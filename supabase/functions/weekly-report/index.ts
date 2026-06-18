// Supabase Edge Function: 周报生成 (DeepSeek, 带配额)
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, content-type" };
const DEEPSEEK_BASE = "https://api.deepseek.com/v1";
const MODEL = "deepseek-chat";
const SYS = `你是一位温和敏锐的周报叙事者。阅读用户一周数据，写一篇像老朋友聊天的周报。语气自然温和，用"你这周…"而非"用户本周…"，要具体，提到真实任务名，可适度幽默。

结构：
### 这一周的你
概括这一周的整体状态（冲刺型/稳步推进型/调整恢复型），结合专注时长和完成任务数，提到具体的完成事项。

### 值得注意的瞬间
从计时复盘和反思中挑 2-3 个有趣片段，引用具体原文「」标注来源。

### 小小的建议
2-3 条温和建议，着眼于下一周，每条配一个"微行动"——很小很小的第一步。

输出中文 Markdown，用 ## 大标题。自然段落，不要编号，不超过 500 字。`;

const FREE_LIMIT = 1;
const PRO_LIMIT = 4;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });

  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ error: "未登录" }, 401);

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return json({ error: "无效用户" }, 401);

    // 查配额
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const { count, error: countErr } = await supabase.from("ai_usage").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("type", "report").gte("created_at", monthStart.toISOString());
    if (countErr) return json({ error: "配额查询失败" }, 500);

    const { data: profile } = await supabase.from("profiles").select("subscription_tier").eq("id", user.id).single();
    const tier = profile?.subscription_tier ?? "free";
    const limit = tier === "free" ? FREE_LIMIT : PRO_LIMIT;

    if ((count ?? 0) >= limit) {
      return json({ error: `本月 ${limit} 次额度已用完。${tier === "free" ? "升级 Pro 解锁 " + PRO_LIMIT + " 次/月。" : ""}` }, 429);
    }

    const body = await req.json() as any;
    const { weekStart, weekEnd, metrics, tasks, timerReflections, dailyReviews } = body;

    const prompt = [
      `时间：${weekStart} ~ ${weekEnd}`,
      `专注：${metrics?.focusMinutes ?? 0}分钟 | 完成：${metrics?.completedTasks ?? 0}个 | 想法：${metrics?.capturedThoughts ?? 0}条`,
      "", "## 任务", ...(tasks ?? []).slice(0, 15).map((t: any, i: number) => `${i + 1}. [${t.completed ? "✓" : "○"}] ${t.title}`),
      "", "## 计时", ...(timerReflections ?? []).slice(0, 8).map((r: any, i: number) => `${i + 1}. ${r.completedWhat || "-"} | ${r.interruptedBy || "-"}`),
      "", "## 复盘", ...Object.entries(dailyReviews ?? {}).map(([d, r]: [string, any]) => `${d}: ${r.achieved} / ${r.emotion} / ${r.adjustment}`),
    ].join("\n");

    const apiKey = Deno.env.get("DEEPSEEK_API_KEY");
    if (!apiKey) return json({ error: "AI 服务未配置" }, 500);

    const resp = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: MODEL, temperature: 0.4, max_tokens: 1200, messages: [{ role: "system", content: SYS }, { role: "user", content: prompt }] }),
    });

    const payload = await resp.json();
    if (!resp.ok) return json({ error: payload?.error?.message ?? "AI 调用失败" }, resp.status);

    const text = payload?.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) return json({ error: "AI 返回空结果" }, 500);

    await supabase.from("ai_usage").insert({ user_id: user.id, type: "report" });

    return json({ report: text.trim() });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "服务器错误" }, 500);
  }
});

function json(b: unknown, s = 200) { return new Response(JSON.stringify(b), { status: s, headers }); }
