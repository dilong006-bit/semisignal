// 주제별 Google News RSS 쿼리 빌더(9절). 순수 함수 — 외부 의존 없음.
import type { TopicKey } from "./types";

/** 주제 키 → q 파라미터 원문(인코딩 전). 모두 when:7d 부여, 한국어 기준. */
export const TOPIC_QUERIES: Record<TopicKey, string> = {
  ai_ax: "(AI 전환 OR AX OR 생성형 AI OR 에이전트 AI) when:7d",
  edu_trend: "(에듀테크 OR HRD OR 기업교육 OR 직무교육 OR LXP) when:7d",
  k12: "(AI 디지털교과서 OR 초등 교육 OR 중등 교육 OR 공교육 AI) when:7d",
  higher_edu: "(고등교육 OR 대학 교육 OR 대학 AI OR 대학 혁신) when:7d",
};

export type Locale = "ko" | "en";

const LOCALE_PARAMS: Record<Locale, string> = {
  // hl=언어, gl=국가, ceid=국가:언어
  ko: "hl=ko&gl=KR&ceid=KR:ko",
  en: "hl=en-US&gl=US&ceid=US:en",
};

/**
 * 주제에 대한 Google News RSS 검색 "경로 + 쿼리스트링"을 만든다.
 * 외부 도메인은 붙이지 않는다 — 호출부에서 /api/news 프록시 프리픽스를 붙인다(6절 격리 원칙).
 * q 는 공백·괄호를 포함하므로 반드시 encodeURIComponent 한다.
 */
export function buildNewsRssPath(topic: TopicKey, locale: Locale = "ko"): string {
  const q = encodeURIComponent(TOPIC_QUERIES[topic]);
  return `/rss/search?q=${q}&${LOCALE_PARAMS[locale]}`;
}
