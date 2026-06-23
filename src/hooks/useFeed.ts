// 피드 로딩 + 카테고리 필터(작업 B-1). 데이터가 작아 필터는 클라이언트에서.
import { useEffect, useMemo, useState } from "react";
import type { DbBriefing, TopicKey } from "../lib/types";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { fetchFeed } from "../services/feedService";

export type CategoryFilter = TopicKey | "all";

export interface UseFeedResult {
  loading: boolean;
  error: string | null;
  /** 전체 발행 글. */
  items: DbBriefing[];
  /** 카테고리 필터 적용 결과. */
  filtered: DbBriefing[];
  category: CategoryFilter;
  setCategory: (c: CategoryFilter) => void;
}

export function useFeed(): UseFeedResult {
  const [items, setItems] = useState<DbBriefing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<CategoryFilter>("all");

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    fetchFeed()
      .then((rows) => {
        if (active) setItems(rows);
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

  const filtered = useMemo(
    () =>
      category === "all"
        ? items
        : items.filter((b) => b.category === category),
    [items, category],
  );

  return { loading, error, items, filtered, category, setCategory };
}
