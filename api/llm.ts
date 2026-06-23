// LLM 서버리스 프록시(작업 D-1). 키를 서버사이드로 숨긴다.
// 클라이언트가 보낸 system·messages 를 받아 ANTHROPIC_API_KEY 로 Anthropic 을 호출하고,
// 원응답(JSON)을 변형 없이 그대로 반환한다 — 클라이언트 파싱 로직이 그대로 동작하도록.
import type { VercelRequest, VercelResponse } from "@vercel/node";

const DEFAULT_MODEL = "claude-opus-4-8";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST 만 허용됩니다." });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // 서버 키 미설정 — 빌드는 되되 런타임에 안내만(가드레일).
    res
      .status(500)
      .json({ error: "서버에 ANTHROPIC_API_KEY 가 설정되지 않았습니다." });
    return;
  }

  // 모델은 서버 환경변수로 결정(클라이언트가 모델을 정하지 않게 단순화).
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  const { system, messages, max_tokens } = (req.body ?? {}) as {
    system?: unknown;
    messages?: unknown;
    max_tokens?: number;
  };

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: max_tokens ?? 4096,
        system,
        messages,
      }),
    });

    // Anthropic 응답을 status·body 그대로 전달(구조 변형 없음).
    const text = await upstream.text();
    res
      .status(upstream.status)
      .setHeader("content-type", "application/json")
      .send(text);
  } catch (err) {
    res
      .status(502)
      .json({ error: `Anthropic 호출 실패: ${(err as Error).message}` });
  }
}
