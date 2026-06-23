// 뉴스 서버리스 프록시(작업 D-2). Google News RSS 를 서버에서 fetch 해 XML 텍스트를
// 그대로 반환한다. ⚠️ DOMParser 는 브라우저 전용이라 여기서 파싱하지 않는다 —
// 파싱·Article 매핑은 기존 클라이언트 newsService(브라우저 DOMParser)가 유지한다.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildNewsRssPath, type Locale } from "../src/lib/queries";
import type { TopicKey } from "../src/lib/types";

const VALID_TOPICS: TopicKey[] = ["ai_ax", "edu_trend", "k12", "higher_edu"];

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  const topic = String(req.query.topic ?? "");
  const locale: Locale = req.query.locale === "en" ? "en" : "ko";

  if (!VALID_TOPICS.includes(topic as TopicKey)) {
    res.status(400).json({ error: `알 수 없는 주제: ${topic}` });
    return;
  }

  // queries.ts(클라이언트와 동일 소스)로 RSS 경로 구성 → 외부 호출 대상 한정(SSRF 방지).
  const url = `https://news.google.com${buildNewsRssPath(topic as TopicKey, locale)}`;

  try {
    const upstream = await fetch(url, {
      headers: { Accept: "application/xml, text/xml" },
    });
    const xml = await upstream.text();
    res
      .status(upstream.status)
      .setHeader("content-type", "application/xml; charset=utf-8")
      .send(xml);
  } catch (err) {
    res
      .status(502)
      .json({ error: `뉴스 호출 실패: ${(err as Error).message}` });
  }
}
