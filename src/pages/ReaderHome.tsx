// 독자 홈 = 발행 브리핑 피드(작업 B). briefings SELECT + 카테고리 필터 + 반응.
import { useAuth } from "../contexts/AuthContext";
import { isSupabaseConfigured } from "../lib/supabase";
import { TOPICS } from "../lib/types";
import { useFeed, type CategoryFilter } from "../hooks/useFeed";
import { useReactions } from "../hooks/useReactions";
import { ReaderBriefingCard } from "../components/ReaderBriefingCard";

export function ReaderHome() {
  const { profile, role } = useAuth();
  const feed = useFeed();
  const reactions = useReactions(profile?.id ?? null);

  const filters: { key: CategoryFilter; label: string }[] = [
    { key: "all", label: "전체" },
    ...TOPICS.map((t) => ({ key: t.key as CategoryFilter, label: t.label })),
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink">독자 피드</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {profile?.email ?? "사용자"} 님 · {role === "editor" ? "편집자" : "독자"}
          </p>
        </div>
      </div>

      {/* Supabase 미설정 안내 */}
      {!isSupabaseConfigured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          피드를 보려면 Supabase 연결이 필요합니다(.env 설정 후 테스트).
        </div>
      )}

      {isSupabaseConfigured && (
        <>
          {/* 카테고리 필터 */}
          <div className="mb-4 flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => feed.setCategory(f.key)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  feed.category === f.key
                    ? "border-brand bg-brand text-white"
                    : "border-slate-300 bg-white text-ink-soft hover:border-brand-soft"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* 에러 */}
          {(feed.error || reactions.error) && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {feed.error ?? reactions.error}
            </div>
          )}

          {/* 로딩 */}
          {feed.loading && (
            <div className="flex items-center gap-3 py-10 text-ink-soft">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              <span className="text-sm">피드 불러오는 중…</span>
            </div>
          )}

          {/* 빈 상태 */}
          {!feed.loading && feed.filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center">
              <p className="text-sm text-ink-soft">
                {feed.items.length === 0
                  ? "아직 발행된 브리핑이 없습니다. 편집자가 발행하면 여기에 표시됩니다."
                  : "이 카테고리에는 발행된 브리핑이 없습니다."}
              </p>
            </div>
          )}

          {/* 피드 카드 */}
          {!feed.loading && feed.filtered.length > 0 && (
            <div className="grid grid-cols-1 gap-4">
              {feed.filtered.map((b) => {
                const r = reactions.get(b.id);
                return (
                  <ReaderBriefingCard
                    key={b.id}
                    briefing={b}
                    saved={r.saved}
                    liked={r.liked}
                    onToggleSave={() => void reactions.toggle(b.id, "saved")}
                    onToggleLike={() => void reactions.toggle(b.id, "liked")}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
