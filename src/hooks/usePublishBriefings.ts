// 발행 상태 관리 훅(마일스톤 A). 초안 카드별 발행/발행취소.
// 초안은 휘발성(클라이언트 생성)이라 발행 매핑은 생성 세션 동안만 유지된다.
import { useCallback, useState } from "react";
import type { BriefingItem } from "../lib/types";
import { deleteBriefing, publishBriefing } from "../services/briefingService";

export interface PublishState {
  /** draftKey → 발행된 briefing id. */
  published: Record<string, string>;
  /** draftKey → 처리 중. */
  busy: Record<string, boolean>;
  error: string | null;
  publish: (key: string, item: BriefingItem) => Promise<void>;
  unpublish: (key: string) => Promise<void>;
}

export function usePublishBriefings(editorId: string | null): PublishState {
  const [published, setPublished] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const setBusyKey = (key: string, v: boolean) =>
    setBusy((b) => ({ ...b, [key]: v }));

  const publish = useCallback(
    async (key: string, item: BriefingItem) => {
      if (!editorId) {
        setError("발행하려면 편집자 로그인이 필요합니다.");
        return;
      }
      setBusyKey(key, true);
      setError(null);
      try {
        const row = await publishBriefing(item, editorId);
        setPublished((p) => ({ ...p, [key]: row.id }));
      } catch (e) {
        setError(`발행 실패: ${(e as Error).message}`);
      } finally {
        setBusyKey(key, false);
      }
    },
    [editorId],
  );

  const unpublish = useCallback(
    async (key: string) => {
      const id = published[key];
      if (!id) return;
      setBusyKey(key, true);
      setError(null);
      try {
        await deleteBriefing(id);
        setPublished((p) => {
          const next = { ...p };
          delete next[key];
          return next;
        });
      } catch (e) {
        setError(`발행취소 실패: ${(e as Error).message}`);
      } finally {
        setBusyKey(key, false);
      }
    },
    [published],
  );

  return { published, busy, error, publish, unpublish };
}
