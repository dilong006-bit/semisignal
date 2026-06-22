// 뉴스 수집 서비스(FR-3, RAG 1단계). Google News RSS 호출 + DOMParser XML 파싱.
// 외부 도메인 대신 /api/news 프록시 경로로 호출한다(CORS 회피, 6/11-3절).
import { buildNewsRssPath, type Locale } from "../lib/queries";
import type { Article, TopicKey } from "../lib/types";

/** Vite dev proxy 프리픽스. /api/news -> https://news.google.com */
const NEWS_PROXY_PREFIX = "/api/news";

/** 주제별 LLM 전달 기사 상한(9절: 비용·지연 관리). */
const MAX_ARTICLES_PER_TOPIC = 10;

export class NewsFetchError extends Error {
  constructor(
    message: string,
    public readonly topic: TopicKey,
  ) {
    super(message);
    this.name = "NewsFetchError";
  }
}

function getText(item: Element, tag: string): string {
  const el = item.querySelector(tag);
  return el?.textContent?.trim() ?? "";
}

/** RSS description 에 섞인 HTML 태그를 제거하고 공백을 정리한다. */
function stripHtml(html: string): string {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
}

/** RSS XML 문자열을 Article[] 로 파싱한다. */
function parseRss(xml: string, topic: TopicKey): Article[] {
  const doc = new DOMParser().parseFromString(xml, "application/xml");

  // 파싱 에러 감지(브라우저는 parsererror 노드를 넣는다).
  if (doc.querySelector("parsererror")) {
    throw new NewsFetchError("RSS XML 파싱에 실패했습니다.", topic);
  }

  const items = Array.from(doc.querySelectorAll("item"));
  return items.slice(0, MAX_ARTICLES_PER_TOPIC).map((item) => {
    // Google News 의 source 는 <source> 요소, 없으면 title 끝의 " - 매체" 추정.
    const rawTitle = getText(item, "title");
    const sourceEl = item.querySelector("source");
    const source =
      sourceEl?.textContent?.trim() ||
      (rawTitle.includes(" - ") ? rawTitle.split(" - ").pop()!.trim() : "");

    return {
      title: rawTitle,
      link: getText(item, "link"),
      source,
      publishedAt: getText(item, "pubDate"),
      summary: stripHtml(getText(item, "description")),
      topic,
    };
  });
}

/** 단일 주제의 기사 목록을 수집한다. */
export async function fetchArticlesForTopic(
  topic: TopicKey,
  locale: Locale = "ko",
): Promise<Article[]> {
  const url = `${NEWS_PROXY_PREFIX}${buildNewsRssPath(topic, locale)}`;

  let res: Response;
  try {
    res = await fetch(url, { headers: { Accept: "application/xml, text/xml" } });
  } catch (err) {
    // 네트워크/CORS 등 fetch 자체 실패.
    throw new NewsFetchError(
      `뉴스 요청 실패: ${(err as Error).message}`,
      topic,
    );
  }

  if (!res.ok) {
    throw new NewsFetchError(`뉴스 응답 오류 (HTTP ${res.status})`, topic);
  }

  const xml = await res.text();
  return parseRss(xml, topic);
}

/**
 * 여러 주제를 병렬 수집한다. 일부 주제가 실패해도 전체를 중단하지 않고
 * 성공한 기사만 모은다(FR-7 부분 성공). 실패 주제는 failed 에 기록.
 */
export async function fetchArticles(
  topics: TopicKey[],
  locale: Locale = "ko",
): Promise<{ articles: Article[]; failed: TopicKey[] }> {
  const results = await Promise.allSettled(
    topics.map((t) => fetchArticlesForTopic(t, locale)),
  );

  const articles: Article[] = [];
  const failed: TopicKey[] = [];

  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      articles.push(...r.value);
    } else {
      failed.push(topics[i]);
      console.error(`[newsService] ${topics[i]} 수집 실패:`, r.reason);
    }
  });

  return { articles, failed };
}
