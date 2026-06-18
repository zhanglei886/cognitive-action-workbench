import { KeyRound, LogIn, Mail, UserPlus, ArrowLeft, Send, Cloud, User } from "lucide-react";
import { useEffect, useState } from "react";
import { onAuthStateChange, resolveUserSession, sendPasswordReset, signIn, signUp, UserSession } from "../lib/auth";
import { Button, Field, Input, Panel } from "./ui";

type Mode = "login" | "register" | "reset";

export function Login({ onLogin }: { onLogin: (session: UserSession) => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // 自动恢复 session
  useEffect(() => {
    const subscription = onAuthStateChange(async (session) => {
      if (session) {
        const profile = await resolveUserSession(session);
        if (profile) onLogin(profile);
      }
    });
    return () => subscription.unsubscribe();
  }, [onLogin]);

  const validate = (): string | null => {
    if (!email.trim()) return "请填写邮箱。";
    if (!email.includes("@")) return "邮箱格式不正确。";
    if (mode !== "reset" && !password.trim()) return "请填写密码。";
    if (mode === "reset") return null;
    if (mode === "register" && !displayName.trim()) return "请填写你的名字。";
    if (password.length < 6) return "密码至少需要 6 个字符。";
    return null;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        onLogin(await signIn(email, password));
      } else if (mode === "register") {
        onLogin(await signUp(email, password, displayName));
      } else if (mode === "reset") {
        await sendPasswordReset(email);
        setResetSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败，请稍后再试。");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next: Mode) => {
    setError("");
    setResetSent(false);
    setMode(next);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-50 px-4 py-10 text-ink-900 dark:bg-[#10120f] dark:text-ink-50">
      <div className="calm-grid pointer-events-none absolute inset-0 opacity-80" />
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-center">
        <Panel className="w-full p-6 sm:p-7">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-moss-100 p-3 text-moss-700 shadow-soft dark:bg-moss-700/25 dark:text-moss-100 dark:shadow-none">
              <Cloud size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">
                {mode === "login" ? "进入你的工作台" : mode === "register" ? "创建工作台" : "重置密码"}
              </h1>
              <p className="mt-2 text-sm leading-6 text-ink-700/65 dark:text-ink-100/55">
                {mode === "login"
                  ? "用邮箱和密码登录，数据云端同步。"
                  : mode === "register"
                  ? "注册后数据自动同步到云端，换设备也能访问。"
                  : "输入注册邮箱，我们会发送重置链接。"}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="mt-6 grid gap-4">
            {mode === "register" && (
              <Field label="名字">
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-700/40 dark:text-ink-100/35" />
                  <Input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    autoFocus
                    placeholder="你的名字（会显示在工作台顶部）"
                    className="pl-9"
                  />
                </div>
              </Field>
            )}

            <Field label="邮箱">
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-700/40 dark:text-ink-100/35" />
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoFocus={mode !== "register"}
                  placeholder="your@email.com"
                  autoComplete="email"
                  className="pl-9"
                />
              </div>
            </Field>

            {mode !== "reset" && (
              <Field label="密码">
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-700/40 dark:text-ink-100/35" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={mode === "register" ? "至少 6 个字符" : "你的密码"}
                    autoComplete={mode === "register" ? "new-password" : "current-password"}
                    className="pl-9"
                  />
                </div>
              </Field>
            )}

            {error && (
              <div className="rounded-lg bg-clay-100 p-3 text-sm text-clay-600 dark:bg-clay-600/15 dark:text-clay-100">
                {error}
              </div>
            )}

            {resetSent && (
              <div className="rounded-lg bg-moss-100 p-3 text-sm text-moss-700 dark:bg-moss-700/20 dark:text-moss-100">
                重置链接已发送到 {email}，请检查邮箱（包括垃圾邮件）。
              </div>
            )}

            <Button type="submit" disabled={loading} className="h-12">
              {loading ? (
                "处理中..."
              ) : mode === "login" ? (
                <>
                  <LogIn size={16} className="mr-2" />
                  登录
                </>
              ) : mode === "register" ? (
                <>
                  <UserPlus size={16} className="mr-2" />
                  注册
                </>
              ) : (
                <>
                  <Send size={16} className="mr-2" />
                  发送重置链接
                </>
              )}
            </Button>
          </form>

          {/* Mode Switchers */}
          <div className="mt-4 flex flex-col gap-2 text-center text-sm">
            {mode === "login" ? (
              <>
                <button onClick={() => switchMode("register")} className="text-moss-700 hover:underline dark:text-moss-300">
                  还没有账号？注册
                </button>
                <button onClick={() => switchMode("reset")} className="text-ink-700/55 hover:underline dark:text-ink-100/45">
                  忘记密码？
                </button>
              </>
            ) : (
              <button onClick={() => switchMode("login")} className="inline-flex items-center justify-center gap-1 text-ink-700/55 hover:underline dark:text-ink-100/45">
                <ArrowLeft size={14} />
                返回登录
              </button>
            )}
          </div>

          {/* 旧版数据迁移提示 */}
          <div className="mt-5 rounded-xl border border-clay-400/20 bg-clay-100/75 p-3 text-xs leading-5 text-clay-600 dark:border-clay-100/10 dark:bg-clay-600/15 dark:text-clay-100">
            如果你以前用名字+密码短语使用过旧版，登录新版后请在"数据与设置"页面使用"导入旧版数据"功能迁移历史数据。
          </div>
        </Panel>
      </div>
    </div>
  );
}
