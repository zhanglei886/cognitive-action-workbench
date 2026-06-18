// Supabase Edge Function: AI 想法总结 (DeepSeek, 带配额)
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, content-type" };
const DEEPSEEK_BASE = "https://api.deepseek.com/v1";
const MODEL = "deepseek-chat";
const SYS = `你是一位温暖而敏锐的个人洞察教练。你会阅读用户的思考笔记，结合心理学视角帮助他们获得更深的自省。语气温暖、敏锐、友善，像一位了解你的朋友。不要评判，不要说教，不要用"你应该"。用"我注意到…""看起来你最近…"这样的表达。

结构：
### 个人洞察
- 找出反复出现的主题或矛盾，用心理学理论解释，自然地融入分析。引用具体笔记「原文」(想法#编号)来支持分析。连贯流畅，帮助用户看到自己没意识到的模式。

### 行动建议
- 3-4 条具体可执行的建议，具体到"下一步做什么"。如果信息不足，诚实说明。

输出中文 Markdown，用 ## 作为大标题。自然段落，不要编号列表，不超过 400 字。`;

const FREE_LIMIT = 3;
const PRO_LIMIT = 50;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });

  try {
    // 验证用户
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ error: "未登录" }, 401);

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return json({ error: "无效用户" }, 401);

    // 查配额
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const { count, error: countErr } = await supabase.from("ai_usage").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("type", "summary").gte("created_at", monthStart.toISOString());
    if (countErr) return json({ error: "配额查询失败" }, 500);

    // 查用户 tier
    const { data: profile } = await supabase.from("profiles").select("subscription_tier").eq("id", user.id).single();
    const tier = profile?.subscription_tier ?? "free";
    const limit = tier === "free" ? FREE_LIMIT : PRO_LIMIT;

    if ((count ?? 0) >= limit) {
      return json({ error: `本月 ${limit} 次额度已用完。${tier === "free" ? "升级 Pro 解锁 " + PRO_LIMIT + " 次/月。" : ""}` }, 429);
    }

    // 解析想法
    const body = await req.json() as any;
    const list = (body.thoughts ?? []).filter((t: any) => t.content?.trim()).slice(0, 40);
    if (list.length === 0) return json({ summary: "没有可总结的想法。" });

    // 调用 DeepSeek（服务器端 key）
    const apiKey = Deno.env.get("DEEPSEEK_API_KEY");
    if (!apiKey) return json({ error: "AI 服务未配置" }, 500);

    const resp = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: MODEL, temperature: 0.4, max_tokens: 900, messages: [{ role: "system", content: SYS }, { role: "user", content: `以下是我的思考笔记，给我个人洞察和行动建议。引用时用"想法#编号"标注：\n${list.map((t: any, i: number) => `想法#${i + 1} [${t.tag}/${t.status}] ${t.content.slice(0, 600)}`).join("\n")}` }] }),
    });

    const payload = await resp.json();
    if (!resp.ok) return json({ error: payload?.error?.message ?? "AI 调用失败" }, resp.status);

    const text = payload?.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) return json({ error: "AI 返回空结果" }, 500);

    // 记录使用
    await supabase.from("ai_usage").insert({ user_id: user.id, type: "summary" });

    return json({ summary: text.trim() });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "服务器错误" }, 500);
  }
});

function json(b: unknown, s = 200) { return new Response(JSON.stringify(b), { status: s, headers }); }
