// 수집→보강→생성 오케스트레이션 훅(5/7/8절). phase 상태 단일 소스.
import { useCallback, useRef, useState } from "react";
import type {
  Article,
  BriefingItem,
  CompanyProfile,
  Phase,
  TopicKey,
} from "../lib/types";
import { fetchArticles, NewsFetchError } from "../services/newsService";
import { summarizeBriefing } from "../services/llmService";

export interface UseBriefingResult {
  phase: Phase;
  articles: Article[];
  briefing: BriefingItem[];
  errorMessage: string | null;
  /** 부분 성공 시 수집에 실패한 주제들. */
  failedTopics: TopicKey[];
  /** 수집은 됐지만 LLM 생성이 실패한 경우 true (FR-7 부분 노출용). */
  llmFailed: boolean;
  run: (profile: CompanyProfile, topics: TopicKey[]) => Promise<void>;
  reset: () => void;
}

export function useBriefing(): UseBriefingResult {
  const [phase, setPhase] = useState<Phase>("idle");
  const [articles, setArticles] = useState<Article[]>([]);
  const [briefing, setBriefing] = useState<BriefingItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedTopics, setFailedTopics] = useState<TopicKey[]>([]);
  const [llmFailed, setLlmFailed] = useState(false);

  // 실행 중 중복 호출 방지(12절: 실행 중 버튼 비활성화의 안전망).
  const runningRef = useRef(false);

  const reset = useCallback(() => {
    setPhase("idle");
    setArticles([]);
    setBriefing([]);
    setErrorMessage(null);
    setFailedTopics([]);
    setLlmFailed(false);
  }, []);

  const run = useCallback(
    async (profile: CompanyProfile, topics: TopicKey[]) => {
      if (runningRef.current) return;
      runningRef.current = true;

      setErrorMessage(null);
      setBriefing([]);
      setFailedTopics([]);
      setLlmFailed(false);

      try {
        // 1단계: 수집 (Retrieval)
        setPhase("fetchingNews");
        const { articles: fetched, failed } = await fetchArticles(topics);
        setArticles(fetched);
        setFailedTopics(failed);

        if (fetched.length === 0) {
          // 모든 주제 수집 실패 또는 0건 → 에러로 안내(13절).
          setPhase("error");
          setErrorMessage(
            failed.length > 0
              ? "뉴스를 불러오지 못했습니다. 네트워크 또는 프록시 설정을 확인하세요."
              : "이번 주 관련 기사를 찾지 못했습니다. 주제를 바꿔 다시 시도해 보세요.",
          );
          return;
        }

        // 2단계: 보강 + 3단계: 생성 (Augmentation + Generation)
        setPhase("summarizing");
        try {
          const result = await summarizeBriefing(fetched, profile, topics);
          setBriefing(result);
          setPhase("done");
        } catch (llmErr) {
          // LLM 실패 — 수집 기사 목록은 최소 노출(FR-7 부분 성공).
          console.error("[useBriefing] LLM 실패:", llmErr);
          setLlmFailed(true);
          setPhase("error");
          setErrorMessage(
            `요약 생성에 실패했습니다: ${(llmErr as Error).message}`,
          );
        }
      } catch (err) {
        // 수집 단계의 예기치 못한 실패.
        console.error("[useBriefing] 수집 실패:", err);
        setPhase("error");
        setErrorMessage(
          err instanceof NewsFetchError
            ? err.message
            : `예상치 못한 오류: ${(err as Error).message}`,
        );
      } finally {
        runningRef.current = false;
      }
    },
    [],
  );

  return {
    phase,
    articles,
    briefing,
    errorMessage,
    failedTopics,
    llmFailed,
    run,
    reset,
  };
}
