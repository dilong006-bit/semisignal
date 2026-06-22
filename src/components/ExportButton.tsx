// 내보내기(FR-8, 선택). 브리핑을 마크다운으로 만들어 클립보드에 복사.
import { useState } from "react";
import type { BriefingItem } from "../lib/types";
import { TOPICS } from "../lib/types";

interface Props {
  briefing: BriefingItem[];
}

function toMarkdown(briefing: BriefingItem[]): string {
  const lines: string[] = ["# 주간 교육 산업 브리핑", ""];
  for (const item of briefing) {
    const label = TOPICS.find((t) => t.key === item.topic)?.label ?? item.topic;
    lines.push(`## [${label}] ${item.headline}`, "");
    for (const s of item.summary) lines.push(`- ${s}`);
    lines.push("", `**우리 회사에 주는 의미:** ${item.implication}`, "");
    if (item.sources.length > 0) {
      lines.push("근거 기사:");
      for (const src of item.sources) {
        lines.push(`- [${src.title || src.link}](${src.link})`);
      }
      lines.push("");
    }
  }
  return lines.join("\n");
}

export function ExportButton({ briefing }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(toMarkdown(briefing));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 권한 실패 시 조용히 무시.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:border-brand-soft hover:text-brand"
    >
      {copied ? "복사됨 ✓" : "마크다운 복사"}
    </button>
  );
}
