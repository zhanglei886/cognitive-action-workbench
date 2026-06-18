import { Session, User } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";

// ============================================================
// Supabase Auth 封装
// 替代旧的 name+password→SHA-256 伪认证
// ============================================================

export interface UserSession {
  userId: string;
  email: string;
  displayName: string;
  subscriptionTier: "free" | "pro_monthly" | "pro_annual" | "lifetime";
}

/**
 * 从 Supabase session 提取应用层 UserSession
 */
export async function resolveUserSession(supabaseSession: Session | null): Promise<UserSession | null> {
  if (!supabaseSession?.user) return null;

  const supabase = getSupabase();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, subscription_tier")
    .eq("id", supabaseSession.user.id)
    .maybeSingle();

  return {
    userId: supabaseSession.user.id,
    email: supabaseSession.user.email ?? "",
    displayName: (profile as any)?.display_name ?? supabaseSession.user.email?.split("@")[0] ?? "用户",
    subscriptionTier: ((profile as any)?.subscription_tier as UserSession["subscriptionTier"]) ?? "free",
  };
}

/**
 * 注册新用户
 */
export async function signUp(email: string, password: string, displayName: string): Promise<UserSession> {
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { display_name: displayName.trim() },
    },
  });

  if (error) throw new Error(translateAuthError(error.message));
  if (!data.user) throw new Error("注册失败，请稍后再试。");

  // 手动 upsert profile（以防 trigger 没有及时执行）
  await supabase.from("profiles").upsert({
    id: data.user.id,
    display_name: displayName.trim(),
    email: email.trim().toLowerCase(),
    subscription_tier: "free" as const,
  } as any);

  return {
    userId: data.user.id,
    email: data.user.email ?? email,
    displayName: displayName.trim(),
    subscriptionTier: "free",
  };
}

/**
 * 登录
 */
export async function signIn(email: string, password: string): Promise<UserSession> {
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) throw new Error(translateAuthError(error.message));

  const profile = await resolveUserSession(data.session);
  if (!profile) throw new Error("登录成功但读取用户信息失败。");

  return profile;
}

/**
 * 发送密码重置邮件
 */
export async function sendPasswordReset(email: string): Promise<void> {
  const supabase = getSupabase();
  const redirectTo = `${window.location.origin}/?reset=true`;
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo,
  });
  if (error) throw new Error(translateAuthError(error.message));
}

/**
 * 退出登录
 */
export async function signOut(): Promise<void> {
  const supabase = getSupabase();
  await supabase.auth.signOut();
}

/**
 * 获取当前 session
 */
export async function getSession() {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * 监听 auth 状态变化
 */
export function onAuthStateChange(callback: (session: Session | null) => void) {
  const supabase = getSupabase();
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return data.subscription;
}

// ============================================================
// 旧版兼容（用于数据迁移）
// ============================================================

export function legacyUserKey(name: string) {
  return name.trim().toLowerCase();
}

async function digestText(value: string) {
  if (globalThis.crypto?.subtle) {
    const bytes = new TextEncoder().encode(value);
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash).toString(16).padStart(16, "0");
}

export async function legacyCreateSession(name: string, password: string) {
  const displayName = name.trim();
  const normalizedName = normalizeName(displayName);
  const secret = password.trim();
  const digest = await digestText(`${normalizedName}:${secret}`);
  return {
    displayName,
    syncKey: `${normalizedName}-${digest.slice(0, 24)}`,
  };
}

function normalizeName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9一-龥_-]/g, "")
    .slice(0, 48) || "user";
}

// ============================================================
// 错误信息中文化
// ============================================================

function translateAuthError(message: string): string {
  const map: Record<string, string> = {
    "Invalid login credentials": "邮箱或密码不正确。",
    "Email not confirmed": "邮箱尚未验证，请先点击邮件中的确认链接。",
    "User already registered": "该邮箱已注册，请直接登录。",
    "Password should be at least 6 characters": "密码至少需要 6 个字符。",
    "Email rate limit exceeded": "操作太频繁，请稍后再试。",
    "For security purposes, you can only request this after": "操作太频繁，请 60 秒后再试。",
  };
  for (const [key, value] of Object.entries(map)) {
    if (message.toLowerCase().includes(key.toLowerCase())) return value;
  }
  return message;
}
