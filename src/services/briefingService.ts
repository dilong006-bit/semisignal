// 브리핑 발행 서비스(마일스톤 A). Supabase briefings INSERT/DELETE.
// 권한은 RLS 가 강제(briefings 쓰기는 editor 만). 이 코드는 호출 편의일 뿐.
import { supabase } from "../lib/supabase";
import type { BriefingItem, DbBriefing } from "../lib/types";

/**
 * BriefingItem(LLM 초안) → briefings 행 매핑(작업 A 명세).
 * title←headline, category←topic, summary←3줄 join,
 * lens←implication, source←sources 첫 출처, editor_id←편집자.
 */
export function briefingItemToRow(item: BriefingItem, editorId: string) {
  const first = item.sources[0];
  return {
    editor_id: editorId,
    title: item.headline,
    category: item.topic,
    summary: item.summary.join("\n"),
    lens: item.implication,
    source: first?.link ?? first?.title ?? null,
  };
}

/** 초안 1건 발행 → 삽입된 행 반환(id 로 발행취소). */
export async function publishBriefing(
  item: BriefingItem,
  editorId: string,
): Promise<DbBriefing> {
  if (!supabase) throw new Error("Supabase 가 설정되지 않았습니다.");
  const { data, error } = await supabase
    .from("briefings")
    .insert(briefingItemToRow(item, editorId))
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as DbBriefing;
}

/** 발행취소 — briefing 행 삭제(RLS 로 본인/편집자만). */
export async function deleteBriefing(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase 가 설정되지 않았습니다.");
  const { error } = await supabase.from("briefings").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
