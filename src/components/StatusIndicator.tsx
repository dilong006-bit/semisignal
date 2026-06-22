// 2단계 로딩/에러 상태 표시(FR-6, FR-7). phase 단일 값으로 한 줄 메시지.
import type { Phase, TopicKey } from "../lib/types";
import { TOPICS } from "../lib/types";

interface Props {
  phase: Phase;
  errorMessage: string | null;
  failedTopics: TopicKey[];
}

const PHASE_TEXT: Record<Exclude<Phase, "idle">, string> = {
  fetchingNews: "① 관련 뉴스 수집 중…",
  summarizing: "② 회사 관점으로 정리 중…",
  done: "완료",
  error: "오류",
};

export function StatusIndicator({ phase, errorMessage, failedTopics }: Props) {
  if (phase === "idle") return null;

  const isLoading = phase === "fetchingNews" || phase === "summarizing";
  const failedLabels = failedTopics
    .map((k) => TOPICS.find((t) => t.key === k)?.label ?? k)
    .join(", ");

  return (
    <div className="space-y-2">
      {isLoading && (
        <div className="flex items-center gap-3 rounded-xl border border-brand/20 bg-brand-bg px-4 py-3">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <span className="text-sm font-medium text-brand">
            {PHASE_TEXT[phase]}
          </span>
        </div>
      )}

      {phase === "error" && errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* 부분 성공: 일부 주제 수집 실패해도 진행했음을 알림. */}
      {failedTopics.length > 0 && phase !== "error" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2">
          <p className="text-xs text-amber-700">
            일부 주제({failedLabels})는 뉴스를 불러오지 못해 제외했습니다.
          </p>
        </div>
      )}
    </div>
  );
}
