import { Thought } from "../types";
import { loadAIKey } from "./storage";

const endpoint = "/.netlify/functions/summarize-thoughts";

export async function summarizeThoughts(thoughts: Thought[]) {
  const apiKey = loadAIKey();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { "x-qwen-api-key": apiKey } : {}),
    },
    body: JSON.stringify({
      thoughts: thoughts.map(({ content, tag, status, createdAt }) => ({ content, tag, status, createdAt })),
    }),
  });

  const payload = await readPayload(response);
  if (!response.ok) throw new Error(payload.error ?? "AI 总结失败。");
  return payload.summary ?? "";
}

async function readPayload(response: Response): Promise<{ summary?: string; error?: string }> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as { summary?: string; error?: string };
  } catch {
    return { error: text.slice(0, 300) };
  }
}
