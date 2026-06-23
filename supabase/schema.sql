-- ============================================================================
-- EduScope Phase 1 — Supabase 스키마 + Row Level Security
-- TECH_SPEC 3절 기반. Supabase 콘솔 > SQL Editor 에 붙여넣어 실행한다.
--
-- 가드레일: 권한은 RLS 가 최종 강제한다(프론트 분기는 UX일 뿐).
--          이 파일은 idempotent — 여러 번 실행해도 안전하도록 작성했다.
-- ============================================================================

-- gen_random_uuid() 사용을 위해(대부분 Supabase 에 기본 활성화되어 있음).
create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────
-- 1. 테이블
-- ─────────────────────────────────────────────────────────────────────────

-- 사용자 프로필 + 역할
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  role       text not null default 'reader' check (role in ('editor','reader')),
  created_at timestamptz not null default now()
);

-- 발행된 브리핑(편집자 산출물)
create table if not exists public.briefings (
  id           uuid primary key default gen_random_uuid(),
  editor_id    uuid references public.profiles(id),
  title        text not null,
  source       text,
  category     text not null,
  summary      text,
  lens         text not null,            -- "우리 회사 렌즈" 코멘트(편집자 검수본)
  published_at timestamptz not null default now()
);

-- 독자 반응(피드백 루프 핵심)
create table if not exists public.reactions (
  id          uuid primary key default gen_random_uuid(),
  briefing_id uuid references public.briefings(id) on delete cascade,
  reader_id   uuid references public.profiles(id),
  saved       boolean not null default false,
  liked       boolean not null default false,
  updated_at  timestamptz not null default now(),
  unique (briefing_id, reader_id)
);

-- 조회 성능용 인덱스
create index if not exists idx_briefings_category   on public.briefings (category);
create index if not exists idx_briefings_published  on public.briefings (published_at desc);
create index if not exists idx_reactions_briefing   on public.reactions (briefing_id);
create index if not exists idx_reactions_reader     on public.reactions (reader_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. 헬퍼 함수
-- ─────────────────────────────────────────────────────────────────────────

-- 현재 사용자가 편집자인지. SECURITY DEFINER 로 profiles 의 RLS 재귀를 피한다.
create or replace function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'editor'
  );
$$;

-- 최초 로그인 시 profiles 행 자동 생성(role='reader' 기본).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'reader')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 일반 사용자의 self 역할 변경(권한 상승) 차단.
-- 관리자는 콘솔 SQL Editor(JWT 없음 → auth.uid() is null)에서 변경하면 통과한다.
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null and new.role is distinct from old.role then
    raise exception '역할 변경은 관리자만 가능합니다';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_role_change on public.profiles;
create trigger trg_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Row Level Security
-- ─────────────────────────────────────────────────────────────────────────

alter table public.profiles  enable row level security;
alter table public.briefings enable row level security;
alter table public.reactions enable row level security;

-- profiles: 본인 행만 조회/수정(역할 변경은 위 트리거가 차단).
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- briefings: 로그인 사용자 모두 조회 / 쓰기는 편집자만.
drop policy if exists briefings_select_authed on public.briefings;
create policy briefings_select_authed on public.briefings
  for select using (auth.uid() is not null);

drop policy if exists briefings_insert_editor on public.briefings;
create policy briefings_insert_editor on public.briefings
  for insert with check (public.is_editor() and editor_id = auth.uid());

drop policy if exists briefings_update_editor on public.briefings;
create policy briefings_update_editor on public.briefings
  for update using (public.is_editor()) with check (public.is_editor());

drop policy if exists briefings_delete_editor on public.briefings;
create policy briefings_delete_editor on public.briefings
  for delete using (public.is_editor());

-- reactions: 독자는 자기 행만 생성/수정. 조회는 본인 + 편집자(집계용).
drop policy if exists reactions_select_own_or_editor on public.reactions;
create policy reactions_select_own_or_editor on public.reactions
  for select using (reader_id = auth.uid() or public.is_editor());

drop policy if exists reactions_insert_own on public.reactions;
create policy reactions_insert_own on public.reactions
  for insert with check (reader_id = auth.uid());

drop policy if exists reactions_update_own on public.reactions;
create policy reactions_update_own on public.reactions
  for update using (reader_id = auth.uid()) with check (reader_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────
-- 4. 편집자 대시보드용 집계 뷰(마일스톤 6에서 사용)
--    뷰는 호출자 권한으로 동작하므로 reactions RLS(편집자 전체 조회)가 그대로 적용된다.
-- ─────────────────────────────────────────────────────────────────────────
create or replace view public.briefing_signals as
select
  b.id                                        as briefing_id,
  b.title,
  b.category,
  b.published_at,
  count(r.*) filter (where r.liked)           as likes,
  count(r.*) filter (where r.saved)           as saves,
  count(distinct r.reader_id)                 as readers_reacted
from public.briefings b
left join public.reactions r on r.briefing_id = b.id
group by b.id;

-- ============================================================================
-- [관리자 운영 메모]
-- 편집자 승격(데모 코드 게이트 폐기 → 실인증):
--   1) 대상 사용자가 /login 으로 최초 로그인 → profiles 행 자동 생성(reader).
--   2) 콘솔 SQL Editor 에서 아래 실행(JWT 없음 → 트리거 통과):
--        update public.profiles set role = 'editor' where email = 'editor@example.com';
-- ============================================================================
