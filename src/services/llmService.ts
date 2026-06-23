// LLM 재해석 서비스(FR-4, RAG 3단계). Anthropic Claude API 호출 + JSON 파싱.
// 외부 도메인 대신 /api/llm 프록시 경로로 호출한다(CORS 회피, 11-3절).
//
// ⚠️ 배포 경계(명세 11-2/11-3): 이 호출은 로컬 학습용이다. 키를 브라우저에 노출하는
// 구조이므로 실제 배포에서는 서버리스 프록시로 교체해야 한다(17절 확장). 그때
// 이 파일 내부만 바꾸면 되도록 호출부(useBriefing)와 분리해 둔다.
import type { Article, BriefingItem, CompanyProfile, TopicKey } from "../lib/types";
import { TOPICS } from "../lib/types";

const LLM_PROXY_URL = "/api/llm/v1/messages";
const DEFAULT_MODEL = "claude-opus-4-8";
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const MODEL = import.meta.env.VITE_ANTHROPIC_MODEL || DEFAULT_MODEL;

export class LlmError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmError";
  }
}

const SIZE_HINT: Record<CompanyProfile["size"], string> = {
  스타트업: "소수 인원, 빠른 실행과 생존이 중요한 초기 조직",
  소기업: "제한된 리소스로 핵심 사업에 집중하는 조직",
  중견기업: "일정 규모의 인력·예산을 갖추고 확장을 모색하는 조직",
};

function topicLabel(topic: TopicKey): string {
  return TOPICS.find((t) => t.key === topic)?.label ?? topic;
}

/** 수집 기사들을 주제별로 묶어 프롬프트용 텍스트로 직렬화한다. */
function serializeArticles(articles: Article[]): string {
  const byTopic = new Map<TopicKey, Article[]>();
  for (const a of articles) {
    const list = byTopic.get(a.topic) ?? [];
    list.push(a);
    byTopic.set(a.topic, list);
  }

  const blocks: string[] = [];
  for (const [topic, list] of byTopic) {
    const lines = list.map(
      (a, i) =>
        `  [${i + 1}] 제목: ${a.title}\n      출처: ${a.source} / ${a.publishedAt}\n      요약: ${a.summary || "(요약 없음)"}\n      링크: ${a.link}`,
    );
    blocks.push(`### 주제: ${topicLabel(topic)} (key=${topic})\n${lines.join("\n")}`);
  }
  return blocks.join("\n\n");
}

/** 시스템 프롬프트 골격(11-1절). 한국어, 역할·렌즈·근거·출력형식·폴백 명시. */
function buildSystemPrompt(profile: CompanyProfile): string {
  return [
    "너는 한국 교육·HRD 산업의 시니어 애널리스트다.",
    "",
    "[렌즈 — 이 회사의 시장에서 해석하라]",
    `- 규모: ${profile.size} (${SIZE_HINT[profile.size]})`,
    `- 업종: ${profile.industry}`,
    "위 회사의 입장에서 각 뉴스가 어떤 기회/위협/시사점인지 해석한다.",
    "",
    "[근거 — 가두리]",
    "- 제공된 기사 내용에만 근거하라. 기사에 없는 사실을 지어내지 마라.",
    "- 추정이 필요하면 단정하지 말고 '가능성' 수준으로 표현하라.",
    "",
    "[출력 형식 — 고정]",
    "- 선택된 주제마다 카드 1개를 만든다.",
    "- 각 카드는 다음 필드를 가진 객체다:",
    '  - topic: 주제 key (ai_ax | edu_trend | k12 | higher_edu 중 하나)',
    "  - headline: 그 주의 핵심을 한 문장으로",
    "  - summary: 3줄 요약 (문자열 3개의 배열)",
    "  - implication: '이 회사에 주는 의미' (회사 함의, 1~2문장)",
    "  - sources: 근거 기사 배열, 각 항목 { title, link }",
    "- 최종 출력은 위 객체들의 JSON 배열만. 그 외 텍스트·마크다운·코드펜스·설명을 절대 덧붙이지 마라.",
    "",
    "[폴백]",
    "- 기사가 빈약해 의미 있는 해석이 어려우면 implication 에 '근거 부족'을 명시하라.",
  ].join("\n");
}

function buildUserPrompt(articles: Article[], topics: TopicKey[]): string {
  return [
    `다음은 선택된 주제(${topics.map(topicLabel).join(", ")})에 대해 최근 1주일간 수집한 기사다.`,
    "",
    serializeArticles(articles),
    "",
    "위 기사를 바탕으로, 선택된 각 주제별 브리핑 카드를 JSON 배열로만 출력하라.",
  ].join("\n");
}

/** 응답 텍스트에서 코드펜스(```json 등)를 제거하고 JSON 배열만 추출한다. */
function extractJsonArray(text: string): string {
  let t = text.trim();
  // ```json ... ``` 또는 ``` ... ``` 펜스 제거.
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  // 앞뒤 잡텍스트가 있어도 첫 '[' ~ 마지막 ']' 사이만 취한다.
  const start = t.indexOf("[");
  const end = t.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    t = t.slice(start, end + 1);
  }
  return t;
}

function coerceBriefing(raw: unknown, topics: TopicKey[]): BriefingItem[] {
  if (!Array.isArray(raw)) {
    throw new LlmError("LLM 응답이 JSON 배열이 아닙니다.");
  }
  const valid = new Set(topics);
  return raw
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map((x) => {
      const summary = Array.isArray(x.summary)
        ? (x.summary as unknown[]).map((s) => String(s))
        : typeof x.summary === "string"
          ? [x.summary]
          : [];
      const sources = Array.isArray(x.sources)
        ? (x.sources as Record<string, unknown>[])
            .filter((s) => s && typeof s === "object")
            .map((s) => ({
              title: String(s.title ?? ""),
              link: String(s.link ?? ""),
            }))
        : [];
      return {
        topic: x.topic as TopicKey,
        headline: String(x.headline ?? ""),
        summary,
        implication: String(x.implication ?? ""),
        sources,
      } satisfies BriefingItem;
    })
    .filter((item) => valid.has(item.topic));
}

/** 단일 Claude API 호출. 코드펜스 제거 후 JSON 파싱. */
async function callOnce(
  system: string,
  user: string,
  topics: TopicKey[],
): Promise<BriefingItem[]> {
  let res: Response;
  try {
    res = await fetch(LLM_PROXY_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": API_KEY ?? "",
        "anthropic-version": "2023-06-01",
        // 브라우저에서 직접(프록시 경유) 호출을 허용하는 헤더. 로컬 학습용.
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
  } catch (err) {
    throw new LlmError(`LLM 요청 실패: ${(err as Error).message}`);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new LlmError(`LLM 응답 오류 (HTTP ${res.status}) ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const text =
    data.content
      ?.filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("") ?? "";

  if (!text.trim()) throw new LlmError("LLM 응답이 비어 있습니다.");

  const json = extractJsonArray(text);
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new LlmError("LLM 응답 JSON 파싱에 실패했습니다.");
  }
  return coerceBriefing(parsed, topics);
}

/**
 * 수집 기사 + 회사 프로필을 결합해 LLM 을 호출하고 BriefingItem[] 을 받는다(FR-4).
 * JSON 파싱 실패 시 1회 재시도한다(13절).
 */
export async function summarizeBriefing(
  articles: Article[],
  profile: CompanyProfile,
  topics: TopicKey[],
): Promise<BriefingItem[]> {
  if (!API_KEY) {
    throw new LlmError(
      "VITE_ANTHROPIC_API_KEY 가 설정되지 않았습니다. .env 파일을 확인하세요.",
    );
  }

  const system = buildSystemPrompt(profile);
  const user = buildUserPrompt(articles, topics);

  try {
    return await callOnce(system, user, topics);
  } catch (err) {
    // 파싱 실패만 1회 재시도. 그 외(네트워크·HTTP)는 즉시 전파.
    if (err instanceof LlmError && err.message.includes("파싱")) {
      console.warn("[llmService] JSON 파싱 실패 — 1회 재시도");
      return await callOnce(system, user, topics);
    }
    throw err;
  }
}
