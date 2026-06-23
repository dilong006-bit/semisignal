// 코어 수준의 타입 계약(10절). 필드명은 고정, 타입은 명세서를 따른다.
// 컴포넌트·서비스·훅은 이 파일의 타입만 공유한다.

// ── Phase 1: 역할 기반 회원관리 ──────────────────────────────────────────
/** 사용자 역할. 권한의 최종 강제는 Supabase RLS, 프론트 분기는 UX. */
export type Role = "editor" | "reader";

/** profiles 테이블 행(TECH_SPEC 3절). */
export interface Profile {
  id: string;
  email: string | null;
  role: Role;
  created_at?: string;
}

/** 관심 주제 영역 키 (FR-2). */
export type TopicKey = "ai_ax" | "edu_trend" | "k12" | "higher_edu";

/** 회사 규모. */
export type CompanySize = "스타트업" | "소기업" | "중견기업";

/** 사용자가 입력하는 회사 프로필 (FR-1). */
export interface CompanyProfile {
  size: CompanySize;
  /** 업종 — 자유 입력 또는 프리셋. */
  industry: string;
  /** 관심 주제 영역(멀티 선택, 최소 1개). */
  interests: TopicKey[];
}

/** 뉴스 수집 결과의 한 기사 (FR-3, RAG 1단계 산출물). */
export interface Article {
  title: string;
  link: string;
  /** 출처 매체명. */
  source: string;
  /** 게시일(ISO 문자열 또는 원문 그대로). */
  publishedAt: string;
  /** RSS description 등에서 추출한 요약/스니펫. */
  summary: string;
  /** 어떤 주제 쿼리로 수집되었는지. */
  topic: TopicKey;
}

/** LLM 재해석 결과의 주제별 카드 한 장 (FR-4, RAG 3단계 산출물). */
export interface BriefingItem {
  topic: TopicKey;
  headline: string;
  /** 3줄 요약. */
  summary: string[];
  /** "이 회사에 주는 의미" = 회사 함의. */
  implication: string;
  /** 근거 기사 링크. */
  sources: { title: string; link: string }[];
}

/** useBriefing 오케스트레이션의 단계 (FR-6). */
export type Phase =
  | "idle"
  | "fetchingNews"
  | "summarizing"
  | "done"
  | "error";

/** 주제 메타데이터 — UI 라벨/설명에 사용. */
export interface TopicMeta {
  key: TopicKey;
  label: string;
  description: string;
}

export const TOPICS: TopicMeta[] = [
  {
    key: "ai_ax",
    label: "AX · AI 전환",
    description: "AI 전환, 생성형 AI, 에이전트 도입 동향",
  },
  {
    key: "edu_trend",
    label: "교육 트렌드 · HRD",
    description: "에듀테크, 기업교육, 직무교육, LXP",
  },
  {
    key: "k12",
    label: "초 · 중등",
    description: "AI 디지털교과서, 공교육 AI, 초·중등 교육",
  },
  {
    key: "higher_edu",
    label: "고등교육",
    description: "대학 교육, 대학 AI, 대학 혁신",
  },
];

export const COMPANY_SIZES: CompanySize[] = ["스타트업", "소기업", "중견기업"];

/** 업종 프리셋(자유 입력도 허용). */
export const INDUSTRY_PRESETS: string[] = [
  "에듀테크",
  "기업교육 / HRD",
  "이러닝 콘텐츠",
  "교육 출판",
  "AI 솔루션",
  "공교육 / 학교",
  "대학 / 고등교육",
  "컨설팅",
];
