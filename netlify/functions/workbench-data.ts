import { getStore } from "@netlify/blobs";

const headers = {
  "Content-Type": "application/json; charset=utf-8",
};

export default async (request: Request) => {
  try {
    const url = new URL(request.url);
    const user = normalizeUser(url.searchParams.get("user"));

    if (!user) {
      return json({ error: "需要提供用户名。" }, 400);
    }

    const store = getStore({ name: "cognitive-action-workbench", consistency: "strong" });
    const key = `users/${user}.json`;

    if (request.method === "GET") {
      const text = await store.get(key, { type: "text", consistency: "strong" });
      return json({ data: text ? JSON.parse(text) : null });
    }

    if (request.method === "PUT") {
      const body = await request.json();
      await store.set(
        key,
        JSON.stringify({
          ...body,
          syncedAt: new Date().toISOString(),
        }),
        {
          metadata: {
            user,
            updatedAt: new Date().toISOString(),
          },
        },
      );
      return json({ ok: true });
    }

    return json({ error: "不支持的请求方法。" }, 405);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "同步失败。" }, 500);
  }
};

function normalizeUser(value: string | null) {
  return value
    ?.trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u4e00-\u9fa5_-]/g, "")
    .slice(0, 80);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers,
  });
}
