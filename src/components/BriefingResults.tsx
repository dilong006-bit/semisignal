// 카드 목록 컨테이너(FR-5). BriefingItem[] 을 주제별 카드로 렌더.
// LLM 실패 시 수집 기사 목록만이라도 노출(FR-7 부분 성공).
import type { ReactNode } from "react";
import type { Article, BriefingItem } from "../lib/types";
import { BriefingCard } from "./BriefingCard";
import { ExportButton } from "./ExportButton";

interface Props {
  briefing: BriefingItem[];
  articles: Article[];
  llmFailed: boolean;
  /** 카드별 하단 슬롯(편집자 발행 컨트롤 주입용, 옵션). */
  cardFooter?: (item: BriefingItem, index: number) => ReactNode;
}

export function BriefingResults({
  briefing,
  articles,
  llmFailed,
  cardFooter,
}: Props) {
  // 정상 결과
  if (briefing.length > 0) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">주간 브리핑</h2>
          <ExportButton briefing={briefing} />
        </div>
        <div className="grid grid-cols-1 gap-4">
          {briefing.map((item, i) => (
            <BriefingCard
              key={`${item.topic}-${i}`}
              item={item}
              footer={cardFooter?.(item, i)}
            />
          ))}
        </div>
      </section>
    );
  }

  // LLM 실패하지만 수집된 기사가 있으면 최소 목록 노출.
  if (llmFailed && articles.length > 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">
          수집된 기사 ({articles.length})
        </h2>
        <p className="text-sm text-ink-soft">
          요약 생성은 실패했지만, 수집된 원문 기사는 아래에서 볼 수 있습니다.
        </p>
        <ul className="space-y-2">
          {articles.map((a, i) => (
            <li
              key={i}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <a
                href={a.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-brand hover:underline"
              >
                {a.title}
              </a>
              <p className="mt-1 text-xs text-ink-faint">
                {a.source} · {a.publishedAt}
              </p>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return null;
}
