const headers = {
  "Content-Type": "application/json; charset=utf-8",
};

interface ThoughtInput {
  content: string;
  tag: string;
  status: string;
  createdAt: string;
}

const systemPrompt =
  "你是一个安静、克制的认知整理助手。请总结用户的思考池，把输入的零散想法整理成清晰、深入、可行动的结构。不要鸡汤，不要泛泛总结，不要替我做决定。你需要区分事实、判断、情绪、假设、问题和行动，并指出这段思考背后的核心矛盾。输出中文 Markdown，结构固定为：1. 反复出现的主题；2. 可以暂时搁置的内容；3. 值得转成行动的 3 个下一步；4. 一句话提醒。每个要点短句即可。";

const defaultDashScopeBaseUrl = "https://dashscope.aliyuncs.com/compatible-mode/v1";

export default async (request: Request) => {
  try {
    if (request.method !== "POST") {
      return json({ error: "不支持的请求方法。" }, 405);
    }

    const apiKey = request.headers.get("x-qwen-api-key")?.trim() || process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      return json({ error: "请先在数据页面填写千问 API Key。" }, 400);
    }

    const body = (await request.json()) as { thoughts?: ThoughtInput[] };
    const thoughts = (body.thoughts ?? [])
      .filter((thought) => thought.content?.trim())
      .slice(0, 40);

    if (thoughts.length === 0) {
      return json({ error: "没有可总结的想法。" }, 400);
    }

    const response = await fetch(`${getDashScopeBaseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.QWEN_MODEL ?? "qwen-turbo",
        temperature: 0.4,
        max_tokens: 900,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `请总结这些思考池条目：\n${thoughts
              .map((thought, index) => `${index + 1}. [${thought.tag}/${thought.status}/${thought.createdAt}] ${thought.content.slice(0, 600)}`)
              .join("\n")}`,
          },
        ],
      }),
    });

    const payload = await readJson(response);
    if (!response.ok) {
      return json({ error: extractErrorMessage(payload) }, response.status >= 500 ? 400 : response.status);
    }

    const summary = extractOutputText(payload);
    if (!summary) {
      return json({ error: "千问返回了空结果，请稍后再试，或在 Netlify 环境变量 QWEN_MODEL 里换一个模型。" }, 400);
    }

    return json({ summary });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "AI 总结失败。" }, 500);
  }
};

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text.slice(0, 500) };
  }
}

function extractOutputText(payload: unknown) {
  if (!isObject(payload)) return "";

  const content = payload.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();

  if (Array.isArray(content)) {
    return content
      .map((part) => (isObject(part) && typeof part.text === "string" ? part.text : ""))
      .join("")
      .trim();
  }

  return "";
}

function extractErrorMessage(payload: unknown) {
  if (!isObject(payload)) return "千问 API 调用失败。";
  const error = payload.error;
  if (isObject(error) && typeof error.message === "string") return error.message;
  if (typeof payload.message === "string") return payload.message;
  if (typeof payload.code === "string") return `${payload.code}: ${typeof payload.msg === "string" ? payload.msg : "千问 API 调用失败。"}`;
  return "千问 API 调用失败。";
}

function getDashScopeBaseUrl() {
  return (process.env.DASHSCOPE_BASE_URL ?? defaultDashScopeBaseUrl).replace(/\/$/, "");
}

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers,
  });
}
