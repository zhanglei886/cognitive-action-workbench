import { AppData } from "../types";
import { normalizeData } from "./storage";

const endpoint = "/.netlify/functions/workbench-data";

export async function pullCloudData(userName: string): Promise<AppData | null> {
  const response = await fetch(`${endpoint}?user=${encodeURIComponent(userName)}`);
  if (!response.ok) throw new Error("读取云端数据失败。");
  const payload = (await response.json()) as { data: AppData | null };
  return payload.data ? normalizeData(payload.data) : null;
}

export async function pushCloudData(userName: string, data: AppData) {
  const response = await fetch(`${endpoint}?user=${encodeURIComponent(userName)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("保存云端数据失败。");
}
