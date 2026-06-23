// 독자 반응 신호 대시보드(작업 C). 편집자 콘솔 상단에 표시.
// 읽기 전용 집계. 편집자 라우트 안에서만 렌더되며 권한은 RLS 가 강제.
import { isSupabaseConfigured } from "../lib/supabase";
import { useSignals, type CategoryAgg } from "../hooks/useSignals";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs text-ink-faint">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}

function CategoryBar({ cat, max }: { cat: CategoryAgg; max: number }) {
  // max 가 0 이면 NaN 방지를 위해 0% 처리.
  const pct = max > 0 ? Math.round((cat.total / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-soft">{cat.label}</span>
        <span className="text-ink-faint">
          저장 {cat.saves} · 좋아요 {cat.likes}
        </span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function SignalDashboard() {
  const { loading, error, agg } = useSignals();

  // 미설정: 빌드는 되되 안내만.
  if (!isSupabaseConfigured) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
        <h2 className="text-sm font-semibold text-amber-800">반응 신호</h2>
        <p className="mt-1 text-sm text-amber-700">
          집계를 보려면 Supabase 연결이 필요합니다(.env 설정 후 테스트).
        </p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white px-5 py-6">
        <div className="flex items-center gap-3 text-ink-soft">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <span className="text-sm">반응 신호 집계 중…</span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
        <h2 className="text-sm font-semibold text-red-700">반응 신호</h2>
        <p className="mt-1 text-sm text-red-700">{error}</p>
      </section>
    );
  }

  // 빈 상태: 발행/반응 0 → 막대·신호 대신 안내.
  if (agg.isEmpty) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
        <h2 className="text-sm font-semibold text-ink">반응 신호</h2>
        <p className="mt-1 text-sm text-ink-soft">
          아직 발행/반응 데이터가 없습니다. 브리핑을 발행하고 독자 반응이 쌓이면
          여기에 집계가 표시됩니다.
        </p>
      </section>
    );
  }

  const maxTotal = Math.max(0, ...agg.categories.map((c) => c.total));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-ink">반응 신호</h2>

      {/* 한 줄 신호 */}
      {agg.topCategory && agg.topCategory.total > 0 && (
        <p className="mt-2 rounded-lg bg-brand-bg px-3 py-2 text-sm text-brand">
          지금 가장 반응이 큰 카테고리는 <strong>{agg.topCategory.label}</strong>{" "}
          입니다 (반응 {agg.topCategory.total}건). 다음 발행 우선순위로 고려해
          보세요.
        </p>
      )}

      {/* 숫자 카드 */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <StatCard label="발행 수" value={agg.publishedCount} />
        <StatCard label="총 저장" value={agg.totalSaves} />
        <StatCard label="총 좋아요" value={agg.totalLikes} />
      </div>

      {/* 카테고리별 반응 바 */}
      <div className="mt-5 space-y-3">
        {agg.categories.map((c) => (
          <CategoryBar key={c.key} cat={c} max={maxTotal} />
        ))}
      </div>
    </section>
  );
}
