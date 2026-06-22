// localStorage 래퍼(FR-1 영속성). 직렬화·역직렬화 실패에 안전하게.
import type { CompanyProfile } from "./types";

const PROFILE_KEY = "eduscope.profile.v1";

export function loadProfile(): CompanyProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CompanyProfile>;
    // 최소 형태 검증 — 손상된 데이터로 앱이 깨지지 않도록.
    if (
      typeof parsed.size === "string" &&
      typeof parsed.industry === "string" &&
      Array.isArray(parsed.interests)
    ) {
      return {
        size: parsed.size as CompanyProfile["size"],
        industry: parsed.industry,
        interests: parsed.interests as CompanyProfile["interests"],
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: CompanyProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // 용량 초과 등은 조용히 무시 — 저장 실패가 기능을 막지 않는다.
  }
}

export function clearProfile(): void {
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch {
    /* noop */
  }
}
