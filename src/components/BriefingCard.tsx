// 주제별 브리핑 카드 한 장(FR-5). 헤드라인 + 3줄 요약 + 회사 함의 + 근거 링크.
import type { ReactNode } from "react";
import type { BriefingItem } from "../lib/types";
import { TOPICS } from "../lib/types";

interface Props {
  item: BriefingItem;
  /** 편집자 발행 컨트롤 등 카드 하단 슬롯(옵션). */
  footer?: ReactNode;
}

export function BriefingCard({ item, footer }: Props) {
  const label = TOPICS.find((t) => t.key === item.topic)?.label ?? item.topic;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full bg-brand-bg px-2.5 py-0.5 text-xs font-medium text-brand">
          {label}
        </span>
      </div>

      <h3 className="text-lg font-semibold leading-snug text-ink">
        {item.headline}
      </h3>

      {item.summary.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {item.summary.map((line, i) => (
            <li key={i} className="flex gap-2 text-sm text-ink-soft">
              <span className="mt-1.5 h-1 w-1 flex-none rounded-full bg-ink-faint" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 rounded-xl border border-brand/15 bg-brand-bg/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">
          우리 회사에 주는 의미
        </p>
        <p className="mt-1 text-sm leading-relaxed text-ink">
          {item.implication}
        </p>
      </div>

      {item.sources.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-ink-faint">근거 기사</p>
          <ul className="mt-1.5 space-y-1">
            {item.sources.map((s, i) => (
              <li key={i}>
                <a
                  href={s.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand underline-offset-2 hover:underline"
                >
                  {s.title || s.link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {footer && <div className="mt-4 border-t border-slate-100 pt-4">{footer}</div>}
    </article>
  );
}
