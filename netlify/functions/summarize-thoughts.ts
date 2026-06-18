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
  "你是一个安静、克制的认知整理助手。请把用户的思考池整理成轻量行动建议，而不是心理分析。不要鸡汤，不要泛泛总结，不要替用户做大决定。输出中文 Markdown，结构必须固定为：## 最近反复出现的主题；## 可以暂时放下的内容；## 值得转成任务的内容；## 建议下一步行动。每个部分 2-4 个短要点，优先指出可执行的下一步；如果信息不足就明确说信息不足，不要编造。";

const defaultDashScopeBaseUrl = "https://dashscope.aliyuncs.com/compatible-mode/v1";
const requestTimeoutMs = Number(process.env.QWEN_TIMEOUT_MS ?? 30_000);
const maxAttempts = Number(process.env.QWEN_MAX_ATTEMPTS ?? 3);

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

    const requestBody = {
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
    };

    const { response, payload } = await fetchQwenWithRetry(apiKey, requestBody);
    if (!response.ok) {
      return json({ error: extractErrorMessage(payload, response.status) }, isCapacityError(payload, response.status) ? 429 : response.status);
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

async function fetchQwenWithRetry(apiKey: string, body: unknown) {
  let latestResponse: Response | null = null;
  let latestPayload: unknown = {};

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
    let response: Response;
    let payload: unknown;

    try {
      response = await fetch(`${getDashScopeBaseUrl()}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      payload = await readJson(response);
    } catch (error) {
      response = new Response(JSON.stringify({ message: "Qwen request timeout or network interruption" }), { status: 504 });
      payload = { message: error instanceof Error ? error.message : "Qwen request timeout or network interruption" };
    } finally {
      clearTimeout(timeout);
    }

    latestResponse = response;
    latestPayload = payload;

    if (response.ok || !isCapacityError(payload, response.status) || attempt === maxAttempts - 1) {
      break;
    }

    await delay(750 * (attempt + 1));
  }

  return { response: latestResponse as Response, payload: latestPayload };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

function extractErrorMessage(payload: unknown, status = 400) {
  if (isCapacityError(payload, status)) {
    return "千问当前请求过多或模型服务容量不足。我已经自动重试过，还是没有成功；请等一两分钟再试。";
  }
  if (!isObject(payload)) return "千问 API 调用失败。";
  const error = payload.error;
  if (isObject(error) && typeof error.message === "string") return error.message;
  if (typeof payload.message === "string") return payload.message;
  if (typeof payload.code === "string") return `${payload.code}: ${typeof payload.msg === "string" ? payload.msg : "千问 API 调用失败。"}`;
  return "千问 API 调用失败。";
}

function isCapacityError(payload: unknown, status: number) {
  const message = extractRawError(payload).toLowerCase();
  return (
    status === 429 ||
    status === 503 ||
    message.includes("too many requests") ||
    message.includes("throttled") ||
    message.includes("capacity") ||
    message.includes("internalerror.algo") ||
    message.includes("inactivity timeout") ||
    message.includes("too much time has passed") ||
    message.includes("request timeout")
  );
}

function extractRawError(payload: unknown) {
  if (!isObject(payload)) return "";
  const error = payload.error;
  const pieces = [
    typeof payload.message === "string" ? payload.message : "",
    typeof payload.code === "string" ? payload.code : "",
    typeof payload.msg === "string" ? payload.msg : "",
    isObject(error) && typeof error.message === "string" ? error.message : "",
    isObject(error) && typeof error.code === "string" ? error.code : "",
  ];
  return pieces.filter(Boolean).join(" ");
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
