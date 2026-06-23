# EduScope — 교육 산업 인텔리전스 주간 브리핑

> 회사 프로필을 한 번 입력하면, 매주 교육·AI·HRD 산업 동향을 **우리 회사의 렌즈로 재해석**해 전달하는 주간 브리핑 웹앱.

리서치 인력이 없는 중소기업·스타트업을 위해, 뉴스를 *짧게* 만들지 않고 *우리 회사 상황의 언어로 번역*합니다. 같은 기사라도 입력한 회사 프로필(규모·업종·관심 영역)이 LLM 프롬프트의 "렌즈"가 되어 회사마다 다른 함의로 재해석됩니다.

---

## 핵심 동작

1. **회사 프로필 입력** — 규모 / 업종 / 관심 영역(최소 1개). `localStorage`에 저장되어 다음 방문에 복원.
2. **주제 선택** — AX·AI / 교육 트렌드 / 초·중등 / 고등교육 중 토글 선택.
3. **브리핑 생성** — `① 뉴스 수집 중 → ② 회사 관점으로 정리 중` 2단계 로딩.
4. **결과 카드** — 주제별로 **3줄 요약 + "우리 회사에 주는 의미" + 근거 기사 링크** 표시.
5. 결과를 마크다운으로 복사하거나, 주제·프로필을 바꿔 다시 생성.

---

## 아키텍처 — RAG 데이터 플로우

```
[회사 프로필 + 선택 주제]
        │
        ▼
① 수집 (Retrieval)
   각 주제 → Google News RSS (when:7d) 호출 → XML 파싱
   → Article[] (제목·링크·출처·게시일·요약)
        │
        ▼
② 보강 (Augmentation)
   Article[] + CompanyProfile + 출력형식 지시 → 프롬프트 구성
        │
        ▼
③ 생성 (Generation)
   LLM 호출 → BriefingItem[] (주제별 3줄요약 + 회사함의 + 근거)
        │
        ▼
[브리핑 카드 렌더링]
```

`useBriefing` 훅이 이 흐름을 `phase` 상태(`idle → fetchingNews → summarizing → done/error`)로 오케스트레이션합니다.

---

## 기술 스택

| 영역 | 선택 | 비고 |
|---|---|---|
| 프레임워크 | React 18 | 함수형 컴포넌트 + Hooks |
| 빌드 | Vite 5 | dev server proxy로 CORS 우회 |
| 언어 | TypeScript | 타입 계약 중심 |
| 상태 관리 | React 내장 (useState/useReducer/Context) | 전역 상태 라이브러리 없음 |
| 스타일 | TailwindCSS | 가볍고 반응형 |
| LLM | Anthropic Claude API (`claude-opus-4-8`) | 모델은 환경변수로 분리 |
| 뉴스 소스 | Google News RSS | 키 불필요, XML 파싱 |

> 데이터베이스·인증·서버 프레임워크는 이번 버전에 없습니다. 영속성은 `localStorage`로 최소화.

---

## 디렉터리 구조

```
src/
├── App.tsx                      # 전체 레이아웃 + 흐름 연결
├── components/
│   ├── CompanyProfileForm.tsx   # 회사 프로필 입력 (규모·업종·관심영역)
│   ├── TopicSelector.tsx        # 주제 선택 + 생성 트리거
│   ├── StatusIndicator.tsx      # 2단계 phase / 에러 표시
│   ├── BriefingResults.tsx      # 카드 목록 컨테이너
│   ├── BriefingCard.tsx         # 주제별 카드 (요약·함의·링크)
│   └── ExportButton.tsx         # 마크다운 복사
├── services/
│   ├── newsService.ts           # Google News RSS 호출 + DOMParser XML 파싱
│   └── llmService.ts            # Claude API 호출 + JSON 파싱
├── lib/
│   ├── queries.ts               # 주제별 RSS 쿼리 빌더 (순수 함수)
│   ├── types.ts                 # 타입 계약
│   └── storage.ts               # localStorage 래퍼
├── hooks/
│   └── useBriefing.ts           # 수집→보강→생성 오케스트레이션 + phase 상태
└── main.tsx
vite.config.ts                   # dev proxy 설정 (news, llm)
.env.example                     # 키 없이 형태만 (커밋용)
```

**서비스 계층 격리 원칙:** 외부 호출(뉴스·LLM)은 반드시 `services/`에 가두고, 컴포넌트는 `useBriefing` 훅만 호출합니다. 코드에서는 외부 도메인 대신 `/api/*` 프록시 경로로만 호출하므로, 추후 LLM 호출부를 "직접 호출 → 서버리스 프록시"로 교체할 때 호출부를 건드리지 않습니다.

---

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.example`을 복사해 `.env`를 채웁니다.

```bash
cp .env.example .env
```

```env
# .env
# 프론트(빌드타임, 번들 포함 — anon 키는 RLS 로 보호되어 공개 가능)
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<supabase-anon-public-key>

# 서버리스 전용(런타임 · 절대 VITE_ 금지 — api/llm 이 사용)
ANTHROPIC_API_KEY=sk-ant-<server-only-key>
ANTHROPIC_MODEL=claude-opus-4-8   # (선택) 미지정 시 기본값
```

> ⚠️ **`.env`는 절대 커밋하지 마세요.** `.gitignore`에 포함되어 있습니다. 외부 API 키(`ANTHROPIC_API_KEY`)는 `VITE_` 접두사 없이 두어 **브라우저 번들에 포함되지 않습니다** — `/api/*` 서버리스 함수에서만 사용합니다.

### 3. 개발 서버 실행

```bash
npm run dev                 # 정적 SPA 만 (서버리스 /api/* 제외)
```

> ⚠️ `npm run dev`(Vite)는 정적 SPA 만 띄우므로 `/api/llm`·`/api/news` 는 404 입니다.
> 서버리스 함수까지 로컬에서 함께 띄우려면 **Vercel CLI** 를 사용합니다:
>
> ```bash
> npm i -g vercel      # 최초 1회
> vercel login         # 최초 1회
> vercel dev           # SPA + /api/* 를 한 서버에서 실행
> ```
>
> `vercel dev` 는 `.env` 의 `ANTHROPIC_API_KEY`·`ANTHROPIC_MODEL` 을 함수 런타임에 주입합니다.

### 4. 프로덕션 빌드

```bash
npm run build    # tsc 타입체크 + vite 빌드 → dist/
npm run preview  # 빌드 결과 미리보기
```

---

## 외부 호출 — 서버리스 프록시

외부 API 키를 브라우저에 노출하지 않기 위해, 외부 호출은 전부 `/api/*` 서버리스 함수가 담당합니다.

| 함수 | 역할 |
|---|---|
| [api/llm.ts](api/llm.ts) | `system·messages` 받아 서버 `ANTHROPIC_API_KEY` 로 Anthropic 호출 → 원응답 그대로 반환(모델은 서버 결정) |
| [api/news.ts](api/news.ts) | `topic·locale` 로 Google News RSS 를 서버에서 fetch → XML 텍스트만 프록시(파싱은 클라이언트 DOMParser) |

클라이언트(`llmService`·`newsService`)는 외부 도메인 대신 `/api/llm`·`/api/news` 만 호출하며, 키를 알지 못합니다.

---

## 작업 이력

### 2026-06-22 — 초기 빌드 (v1.0)

- Vite + React + TypeScript + Tailwind 프로젝트 구성
- 타입 계약(`lib/types.ts`), RSS 쿼리 빌더(`lib/queries.ts`), localStorage 래퍼(`lib/storage.ts`)
- `services/newsService.ts` — Google News RSS 호출 + DOMParser XML 파싱, 부분 성공 처리
- `services/llmService.ts` — Claude API(`claude-opus-4-8`) 호출 + JSON 파싱(코드펜스 제거·1회 재시도)
- `hooks/useBriefing.ts` — phase 기반 수집→보강→생성 오케스트레이션
- UI 컴포넌트 일습(프로필 폼 → 주제 선택 → 상태 → 결과 카드)
- dev proxy로 CORS 우회 검증(뉴스 52건 정상 수신)

### 2026-06-22 — 업종 선택 UI/UX 개선 (오류 수정)

**문제:** 업종 입력이 `텍스트 입력란 + datalist(자동완성)` 구조라, 한 번 값이 채워지면 옵션 목록이 다시 뜨지 않았습니다. 예를 들어 "교육 출판"을 고른 뒤 "에듀테크"로 바꾸려면 Edit 모드에서 기존 값을 지우고 다시 focus해야 해서, 선택을 변경할 수 없는 것처럼 보였습니다.

**원인:** `datalist`는 "선택" UI가 아니라 "입력 자동완성"입니다. 사용자 기대(8개 중 하나를 고르고 바꾸는 동작)와 컴포넌트의 실제 동작(텍스트 편집)이 어긋났습니다.

**수정:** 업종 입력을 **규모 필드와 동일한 단일선택 칩**으로 교체했습니다. 이제 다른 칩을 한 번 클릭하면 즉시 변경됩니다. 데이터 계약(`industry: string`)·저장·LLM 프롬프트는 그대로 유지해 영향 범위를 `CompanyProfileForm.tsx`의 업종 입력부 한 곳으로 한정했고, `aria-pressed`로 접근성을 보강했습니다.

### Phase 1 — 역할 기반 회원관리 + 피드백 루프 (Supabase + Vercel)

- **마일스톤 1~3** — Supabase 스키마/RLS(`profiles`·`briefings`·`reactions`), Editor/Reader 인증·역할(`AuthContext`), 라우트 가드(`RequireAuth`/`RequireRole`)
- **작업 A — 편집자 발행** — 초안(`BriefingItem`)을 검수 후 `briefings` INSERT/DELETE(LLM 자동발행 금지). 권한은 RLS 강제
- **작업 B — 독자 피드 + 반응** — `briefings` 열람 + 카테고리 필터, `reactions` 저장/좋아요 upsert(낙관적 업데이트 + 롤백)
- **작업 C — 신호 대시보드** — `briefing_signals` 뷰 집계로 "발행→반응→신호" 피드백 루프 완성
- **작업 D — 서버리스 키 이전** — 외부 호출을 `api/llm`·`api/news` 서버리스로 이전해 키를 서버사이드로 숨김. dist 번들에 키 흔적 0건 검증
- **작업 E — Vercel 배포 정리** — `vite base` 를 `/` 로, SPA fallback `vercel.json` 추가, 중복되던 GitHub Pages 워크플로(`deploy.yml`) 제거

---

## 배포 (Vercel)

GitHub `main` 에 push 하면 Vercel 이 자동으로 빌드·배포합니다. 아래 콘솔 작업은 직접 수행합니다.

### 1. 환경변수 (Vercel → Project Settings → Environment Variables)

| 변수 | 구분 | 값 |
|---|---|---|
| `VITE_SUPABASE_URL` | 프론트(빌드타임·번들 포함) | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | 프론트(빌드타임·번들 포함) | Supabase anon public 키 (RLS 보호) |
| `ANTHROPIC_API_KEY` | **서버리스(런타임 전용·절대 VITE_ 금지)** | `sk-ant-...` |
| `ANTHROPIC_MODEL` | 서버리스(선택) | 미지정 시 `claude-opus-4-8` |

> `SUPABASE_SERVICE_ROLE_KEY`·`NEWS_API_KEY` 는 현재 코드가 사용하지 않으므로 **등록 불필요**.

### 2. Vercel 연결 (GitHub Import)

Vercel 대시보드 → **Add New → Project** → `dilong006-bit/semisignal` **Import** → 위 환경변수 등록 → **Deploy**.

- Framework: **Vite**(자동감지) · Build: `npm run build` · Output: `dist`
- `/api/*` 는 Vercel 이 서버리스 함수로 자동 등록(`api/llm`·`api/news`)
- ⚠️ 로컬에서 실행한 `vercel dev`/`vercel link`(루트 `.vercel/`)는 **로컬 테스트용**입니다. 실제 자동배포는 이 **GitHub Import 연결**이 담당합니다.

### 3. Supabase Auth redirect URL 등록

Supabase 콘솔 → **Authentication → URL Configuration** 에 **배포 도메인**을 등록합니다.

- **Site URL**: `https://<your-app>.vercel.app`
- **Redirect URLs**: `https://<your-app>.vercel.app/**`

> 코드의 `redirectUrl()` 은 `window.location.origin` 기반이라 자동 대응하지만, 콘솔 allowlist 에 등록하지 않으면 매직링크·Google 로그인이 `localhost` 로 튀거나 거부됩니다.

### 4. 자동배포 흐름

`main` 에 push → Vercel 자동 빌드·배포. PR 브랜치는 Preview 배포가 생성됩니다.

---

## 범위 밖 (다음 단계)

Slack 연동 / 데일리 마이크로 브리핑 / 다중 워크스페이스 / SSO / 결제 / VM vs Serverless 비교 실습(Phase 2). (로드맵 항목)

---

*Phase 1: 역할 기반 회원관리 + 피드백 루프. 외부 키는 서버리스(`/api/*`)에서만 사용되며 브라우저에 노출되지 않습니다.*
