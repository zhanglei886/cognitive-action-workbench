import { Cloud, LogIn } from "lucide-react";
import { useState } from "react";
import { createUserSession, UserSession } from "../lib/auth";
import { Button, Field, Input, Panel } from "./ui";

export function Login({ onLogin }: { onLogin: (session: UserSession) => void }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    const secret = password.trim();
    if (!trimmed || !secret) {
      setError("请填写名字和密码短语。");
      return;
    }
    onLogin(await createUserSession(trimmed, secret));
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-50 px-4 py-10 text-ink-900 dark:bg-[#10120f] dark:text-ink-50">
      <div className="calm-grid pointer-events-none absolute inset-0 opacity-80" />
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-center">
        <Panel className="w-full p-6 sm:p-7">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-moss-100 p-3 text-moss-700 shadow-soft dark:bg-moss-700/25 dark:text-moss-100 dark:shadow-none">
              <Cloud size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">进入你的工作台</h1>
              <p className="mt-2 text-sm leading-6 text-ink-700/65 dark:text-ink-100/55">
                输入名字和密码短语即可同步数据。同名但密码不同的人会进入不同工作台。
              </p>
            </div>
          </div>
          <form onSubmit={submit} className="mt-6 grid gap-4">
            <Field label="名字">
              <Input value={name} onChange={(event) => setName(event.target.value)} autoFocus placeholder="例如：lenovo 或 你的中文名" />
            </Field>
            <Field label="密码短语">
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="不用注册，但请自己记住"
                autoComplete="current-password"
              />
            </Field>
            {error && <div className="rounded-lg bg-clay-100 p-3 text-sm text-clay-600 dark:bg-clay-600/15 dark:text-clay-100">{error}</div>}
            <Button type="submit" className="h-12">
              <LogIn size={16} className="mr-2" />
              进入
            </Button>
          </form>
          <p className="mt-5 rounded-xl border border-clay-400/20 bg-clay-100/75 p-3 text-xs leading-5 text-clay-600 dark:border-clay-100/10 dark:bg-clay-600/15 dark:text-clay-100">
            这是轻量密码短语，不是完整账号系统。密码不会上传保存，但忘记密码短语就无法回到同一份云端数据。
          </p>
        </Panel>
      </div>
    </div>
  );
}
