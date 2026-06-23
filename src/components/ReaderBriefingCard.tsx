// 독자용 브리핑 카드(작업 B). DbBriefing(발행 DB 행)을 렌더한다.
// 편집자 초안용 BriefingCard 와 별개 — 그쪽은 건드리지 않는다.
import type { DbBriefing } from "../lib/types";
import { TOPICS } from "../lib/types";

interface Props {
  briefing: DbBriefing;
  saved: boolean;
  liked: boolean;
  onToggleSave: () => void;
  onToggleLike: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function ReaderBriefingCard({
  briefing,
  saved,
  liked,
  onToggleSave,
  onToggleLike,
}: Props) {
  const label =
    TOPICS.find((t) => t.key === briefing.category)?.label ?? briefing.category;
  // 발행 시 "\n" join 으로 저장된 요약을 줄 단위로 복원.
  const summaryLines = (briefing.summary ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="rounded-full bg-brand-bg px-2.5 py-0.5 text-xs font-medium text-brand">
          {label}
        </span>
        <span className="text-xs text-ink-faint">
          {formatDate(briefing.published_at)}
        </span>
      </div>

      <h3 className="text-lg font-semibold leading-snug text-ink">
        {briefing.title}
      </h3>

      {summaryLines.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {summaryLines.map((line, i) => (
            <li key={i} className="flex gap-2 text-sm text-ink-soft">
              <span className="mt-1.5 h-1 w-1 flex-none rounded-full bg-ink-faint" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      )}

      {briefing.lens && (
        <div className="mt-4 rounded-xl border border-brand/15 bg-brand-bg/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">
            우리 회사에 주는 의미
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink">{briefing.lens}</p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        {briefing.source ? (
          <a
            href={briefing.source}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-xs text-brand hover:underline"
          >
            근거 기사 보기
          </a>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleSave}
            aria-pressed={saved}
            title="저장"
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition ${
              saved
                ? "border-brand bg-brand-bg text-brand"
                : "border-slate-300 text-ink-soft hover:border-brand-soft"
            }`}
          >
            <span>{saved ? "🔖" : "📑"}</span>
            <span>저장</span>
          </button>
          <button
            type="button"
            onClick={onToggleLike}
            aria-pressed={liked}
            title="좋아요"
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition ${
              liked
                ? "border-rose-300 bg-rose-50 text-rose-600"
                : "border-slate-300 text-ink-soft hover:border-rose-200"
            }`}
          >
            <span>{liked ? "❤️" : "👍"}</span>
            <span>좋아요</span>
          </button>
        </div>
      </div>
    </article>
  );
}
