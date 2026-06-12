const headers = {
  "Content-Type": "application/json; charset=utf-8",
};

const defaultDashScopeBaseUrl = "https://dashscope.aliyuncs.com/compatible-mode/v1";
const requestTimeoutMs = Number(process.env.QWEN_TIMEOUT_MS ?? 30_000);
const maxAttempts = Number(process.env.QWEN_MAX_ATTEMPTS ?? 3);

const systemPrompt =
  "你是一个安静、克制的每周复盘助手。你的任务是根据用户一周内的任务、计时、思考池、长期规划、重要日期、每日复盘和状态记录，生成一份短周报。不要鸡汤，不要诊断，不要过度解释。输出中文 Markdown，结构固定为：# 本周推进；# 注意到的模式；# 可以暂时放下；# 下周三个小动作。每个部分只写短句。所有建议必须具体、低摩擦、可执行。";

export default async (request: Request) => {
  try {
    if (request.method !== "POST") {
      return json({ error: "不支持的请求方法。" }, 405);
    }

    const apiKey = request.headers.get("x-qwen-api-key")?.trim() || process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      return json({ error: "请先在数据页面填写千问 API Key。" }, 400);
    }

    const body = await request.json();
    const compact = compactWeeklyInput(body);
    if (!hasWeeklyContent(compact)) {
      return json({ error: "本周还没有足够的记录生成周报。" }, 400);
    }

    const requestBody = {
      model: process.env.QWEN_MODEL ?? "qwen-turbo",
      temperature: 0.35,
      max_tokens: 1100,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `请根据以下 JSON 生成本周周报。不要复述全部数据，只提炼模式和行动。\n${JSON.stringify(compact, null, 2)}`,
        },
      ],
    };

    const { response, payload } = await fetchQwenWithRetry(apiKey, requestBody);
    if (!response.ok) {
      return json({ error: extractErrorMessage(payload, response.status) }, isCapacityError(payload, response.status) ? 429 : response.status);
    }

    const report = extractOutputText(payload);
    if (!report) {
      return json({ error: "千问返回了空结果，请稍后再试，或在 Netlify 环境变量 QWEN_MODEL 里换一个模型。" }, 400);
    }

    return json({ report });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "AI 周报生成失败。" }, 500);
  }
};

function compactWeeklyInput(body: any) {
  return {
    weekStart: String(body.weekStart ?? ""),
    weekEnd: String(body.weekEnd ?? ""),
    metrics: body.metrics ?? {},
    tasks: Array.isArray(body.tasks)
      ? body.tasks.slice(0, 60).map((task: any) => ({
          title: String(task.title ?? "").slice(0, 120),
          nextAction: String(task.nextAction ?? "").slice(0, 160),
          type: task.type,
          priority: task.priority,
          tags: Array.isArray(task.tags) ? task.tags.slice(0, 8) : [],
          deadline: task.deadline,
          completed: Boolean(task.completed),
          completedAt: task.completedAt,
        }))
      : [],
    calendarEvents: Array.isArray(body.calendarEvents)
      ? body.calendarEvents.slice(0, 40).map((event: any) => ({
          title: String(event.title ?? "").slice(0, 120),
          date: event.date,
          type: event.type,
          note: String(event.note ?? "").slice(0, 180),
        }))
      : [],
    strategicPlans: Array.isArray(body.strategicPlans)
      ? body.strategicPlans.slice(0, 40).map((plan: any) => ({
          title: String(plan.title ?? "").slice(0, 120),
          question: String(plan.question ?? "").slice(0, 220),
          area: plan.area,
          horizon: plan.horizon,
          status: plan.status,
          nextReviewAt: plan.nextReviewAt,
          notes: String(plan.notes ?? "").slice(0, 220),
        }))
      : [],
    thoughts: Array.isArray(body.thoughts)
      ? body.thoughts.slice(0, 60).map((thought: any) => ({
          content: String(thought.content ?? "").slice(0, 280),
          tag: thought.tag,
          status: thought.status,
          createdAt: thought.createdAt,
        }))
      : [],
    dailyReviews: body.dailyReviews ?? {},
    dailyStates: body.dailyStates ?? {},
    timerReflections: Array.isArray(body.timerReflections)
      ? body.timerReflections.slice(0, 40).map((record: any) => ({
          modeMinutes: record.modeMinutes,
          completedWhat: String(record.completedWhat ?? "").slice(0, 180),
          interruptedBy: String(record.interruptedBy ?? "").slice(0, 180),
          nextStep: String(record.nextStep ?? "").slice(0, 160),
          createdAt: record.createdAt,
        }))
      : [],
  };
}

function hasWeeklyContent(input: any) {
  return input.tasks.length > 0 || input.calendarEvents.length > 0 || input.strategicPlans.length > 0 || input.thoughts.length > 0 || input.timerReflections.length > 0 || Object.keys(input.dailyReviews).length > 0;
}

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
