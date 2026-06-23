// 반응 서비스(작업 B-2). reactions 조회 + upsert.
// RLS: reader 는 자기 행(reader_id = auth.uid())만 조회/생성/수정.
import { supabase } from "../lib/supabase";
import type { DbReaction } from "../lib/types";

/** 본인의 모든 반응 행 조회(마운트 시 카드 상태 복원용). */
export async function fetchMyReactions(
  readerId: string,
): Promise<DbReaction[]> {
  if (!supabase) throw new Error("Supabase 가 설정되지 않았습니다.");
  const { data, error } = await supabase
    .from("reactions")
    .select("id, briefing_id, reader_id, saved, liked, updated_at")
    .eq("reader_id", readerId);
  if (error) throw new Error(error.message);
  return (data ?? []) as DbReaction[];
}

/**
 * 반응 upsert. unique(briefing_id, reader_id) 기준으로 같은 행을 갱신.
 * ⚠️ 행 전체가 덮이므로 saved·liked 둘 다 현재 값으로 전달해야 한다(호출 측 책임).
 */
export async function upsertReaction(input: {
  briefingId: string;
  readerId: string;
  saved: boolean;
  liked: boolean;
}): Promise<DbReaction> {
  if (!supabase) throw new Error("Supabase 가 설정되지 않았습니다.");
  const { data, error } = await supabase
    .from("reactions")
    .upsert(
      {
        briefing_id: input.briefingId,
        reader_id: input.readerId,
        saved: input.saved,
        liked: input.liked,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "briefing_id,reader_id" },
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as DbReaction;
}
