// 주제 선택 + 생성 트리거(FR-2). 최소 1개 선택 시에만 생성 버튼 활성.
import { TOPICS, type Phase, type TopicKey } from "../lib/types";

interface Props {
  selected: TopicKey[];
  onChange: (topics: TopicKey[]) => void;
  onGenerate: () => void;
  phase: Phase;
}

export function TopicSelector({ selected, onChange, onGenerate, phase }: Props) {
  const running = phase === "fetchingNews" || phase === "summarizing";
  const canGenerate = selected.length > 0 && !running;

  function toggle(key: TopicKey) {
    onChange(
      selected.includes(key)
        ? selected.filter((k) => k !== key)
        : [...selected, key],
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-ink">이번 주 브리핑 주제</h2>
      <p className="mt-1 text-sm text-ink-soft">
        볼 주제를 토글로 선택하세요(최소 1개).
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {TOPICS.map((t) => {
          const active = selected.includes(t.key);
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => toggle(t.key)}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                active
                  ? "border-brand bg-brand text-white"
                  : "border-slate-300 bg-white text-ink-soft hover:border-brand-soft"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onGenerate}
        disabled={!canGenerate}
        className="mt-5 w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-soft disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {running ? "생성 중…" : "주간 브리핑 생성"}
      </button>
    </div>
  );
}
