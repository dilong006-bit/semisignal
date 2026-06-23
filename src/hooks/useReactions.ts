// 반응 상태 맵 + 낙관적 토글/롤백(작업 B-2).
// ⚠️ saved·liked 는 별개 필드. 하나를 토글할 때 다른 필드 현재값을 보존해 함께 upsert.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { fetchMyReactions, upsertReaction } from "../services/reactionService";

export interface ReactionState {
  saved: boolean;
  liked: boolean;
}

const EMPTY: ReactionState = { saved: false, liked: false };

export interface UseReactionsResult {
  /** briefingId → 현재 반응 상태. */
  get: (briefingId: string) => ReactionState;
  /** 한 필드 토글(다른 필드 보존). 낙관적 업데이트 + 실패 시 롤백. */
  toggle: (briefingId: string, field: keyof ReactionState) => Promise<void>;
  error: string | null;
}

export function useReactions(readerId: string | null): UseReactionsResult {
  const [map, setMap] = useState<Record<string, ReactionState>>({});
  const [error, setError] = useState<string | null>(null);

  // 마운트(또는 readerId 변경) 시 본인 반응 복원.
  useEffect(() => {
    if (!readerId || !supabase) return;
    let active = true;
    fetchMyReactions(readerId)
      .then((rows) => {
        if (!active) return;
        const next: Record<string, ReactionState> = {};
        for (const r of rows) {
          next[r.briefing_id] = { saved: r.saved, liked: r.liked };
        }
        setMap(next);
      })
      .catch((e) => {
        if (active) setError((e as Error).message);
      });
    return () => {
      active = false;
    };
  }, [readerId]);

  const get = useCallback(
    (briefingId: string): ReactionState => map[briefingId] ?? EMPTY,
    [map],
  );

  const toggle = useCallback(
    async (briefingId: string, field: keyof ReactionState) => {
      if (!readerId) {
        setError("반응하려면 로그인이 필요합니다.");
        return;
      }
      const current = map[briefingId] ?? EMPTY;
      const next: ReactionState = { ...current, [field]: !current[field] };

      // 낙관적 업데이트
      setMap((m) => ({ ...m, [briefingId]: next }));
      setError(null);

      try {
        // saved·liked 둘 다 전달(행 전체가 덮임).
        await upsertReaction({
          briefingId,
          readerId,
          saved: next.saved,
          liked: next.liked,
        });
      } catch (e) {
        // 롤백
        setMap((m) => ({ ...m, [briefingId]: current }));
        setError(`반응 저장 실패: ${(e as Error).message}`);
      }
    },
    [readerId, map],
  );

  return { get, toggle, error };
}
