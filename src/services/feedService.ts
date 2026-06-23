// 독자 피드 서비스(작업 B-1). 발행된 briefings 조회.
// RLS: 로그인 사용자는 모두 SELECT 가능. 권한 강제는 DB.
import { supabase } from "../lib/supabase";
import type { DbBriefing } from "../lib/types";

/** 발행된 브리핑을 최신순(published_at desc)으로 조회. */
export async function fetchFeed(): Promise<DbBriefing[]> {
  if (!supabase) throw new Error("Supabase 가 설정되지 않았습니다.");
  const { data, error } = await supabase
    .from("briefings")
    .select(
      "id, editor_id, title, source, category, summary, lens, published_at",
    )
    .order("published_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as DbBriefing[];
}
