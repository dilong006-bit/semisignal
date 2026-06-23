// 신호 로딩 + 클라이언트 집계(작업 C).
// briefing_signals 는 브리핑 1건당 1행이므로 category 기준으로 합산한다.
import { useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { fetchSignals } from "../services/signalService";
import { TOPICS, type BriefingSignalRow, type TopicKey } from "../lib/types";

export interface CategoryAgg {
  key: TopicKey;
  label: string;
  saves: number;
  likes: number;
  /** 저장 + 좋아요. 막대 길이/최대 판정 기준. */
  total: number;
}

export interface SignalsAgg {
  publishedCount: number;
  totalSaves: number;
  totalLikes: number;
  /** TOPICS 순서의 카테고리별 집계(반응 0 카테고리도 포함). */
  categories: CategoryAgg[];
  /** 반응 합이 최대인 카테고리(전부 0이면 null). */
  topCategory: CategoryAgg | null;
  /** 발행/반응이 모두 없으면 true → 빈 상태 안내. */
  isEmpty: boolean;
}

export interface UseSignalsResult {
  loading: boolean;
  error: string | null;
  agg: SignalsAgg;
}

function aggregate(rows: BriefingSignalRow[]): SignalsAgg {
  const byCat = new Map<string, { saves: number; likes: number }>();
  let totalSaves = 0;
  let totalLikes = 0;

  for (const r of rows) {
    totalSaves += r.saves;
    totalLikes += r.likes;
    const cur = byCat.get(r.category) ?? { saves: 0, likes: 0 };
    cur.saves += r.saves;
    cur.likes += r.likes;
    byCat.set(r.category, cur);
  }

  // TOPICS 순서 고정, 알 수 없는 category 는 무시(라벨 없는 항목 방지).
  const categories: CategoryAgg[] = TOPICS.map((t) => {
    const c = byCat.get(t.key) ?? { saves: 0, likes: 0 };
    return {
      key: t.key,
      label: t.label,
      saves: c.saves,
      likes: c.likes,
      total: c.saves + c.likes,
    };
  });

  const totalReactions = totalSaves + totalLikes;
  const topCategory =
    totalReactions > 0
      ? categories.reduce((a, b) => (b.total > a.total ? b : a))
      : null;

  return {
    publishedCount: rows.length,
    totalSaves,
    totalLikes,
    categories,
    topCategory,
    isEmpty: rows.length === 0 && totalReactions === 0,
  };
}

export function useSignals(): UseSignalsResult {
  const [rows, setRows] = useState<BriefingSignalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    fetchSignals()
      .then((data) => {
        if (active) setRows(data);
      })
      .catch((e) => {
        if (active) setError((e as Error).message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const agg = useMemo(() => aggregate(rows), [rows]);
  return { loading, error, agg };
}
