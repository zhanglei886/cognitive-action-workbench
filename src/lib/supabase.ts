import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// 在 Supabase 项目设置中找到这两个值
// https://app.supabase.com → 你的项目 → Settings → API
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

let supabase: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> {
  if (!supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Supabase 环境变量未配置。请创建 .env 文件并设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。\n" +
        "你可以在 https://app.supabase.com 的项目设置 → API 中找到这两个值。"
      );
    }
    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "cognitive-workbench-auth",
      },
      db: {
        schema: "public",
      },
    });
  }
  return supabase;
}

// 清理（用户退出时调用）
export function clearSupabase() {
  supabase = null;
}
