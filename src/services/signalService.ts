// 신호 집계 서비스(작업 C). briefing_signals 뷰 조회(읽기 전용).
// RLS: 편집자만 reactions 전체가 보이므로 집계가 성립 → 대시보드는 편집자 라우트에서만.
import { supabase } from "../lib/supabase";
import type { BriefingSignalRow } from "../lib/types";

/** 브리핑 1건당 1행의 신호 집계를 조회. */
export async function fetchSignals(): Promise<BriefingSignalRow[]> {
  if (!supabase) throw new Error("Supabase 가 설정되지 않았습니다.");
  const { data, error } = await supabase
    .from("briefing_signals")
    .select("briefing_id, title, category, published_at, likes, saves, readers_reacted")
    .order("published_at", { ascending: false });
  if (error) throw new Error(error.message);
  // count(...) 는 문자열로 올 수 있어 숫자로 정규화.
  return (data ?? []).map((r) => ({
    briefing_id: String(r.briefing_id),
    title: String(r.title ?? ""),
    category: String(r.category ?? ""),
    published_at: String(r.published_at ?? ""),
    likes: Number(r.likes ?? 0),
    saves: Number(r.saves ?? 0),
    readers_reacted: Number(r.readers_reacted ?? 0),
  }));
}
