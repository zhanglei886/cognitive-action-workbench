import { Archive, Check, Download, KeyRound, Layout, Palette, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AppData } from "../types";
import { AccentTheme, exportPayload, importPayload, loadData, loadAIKey, saveAIKey } from "../lib/storage";
import { getSupabase } from "../lib/supabase";
import { pushAllData } from "../lib/cloud";
import { Button, cx, Field, Input, Panel, Textarea } from "./ui";

export function DataManager({
  data, replaceData, clearAll, accentTheme, setAccentTheme, userId, onToggleLayout,
}: {
  data: AppData; replaceData: (data: AppData) => void; clearAll: () => void;
  accentTheme: AccentTheme; setAccentTheme: (theme: AccentTheme) => void;
  userId: string; onToggleLayout?: () => void;
}) {
  const [importText, setImportText] = useState("");
  const [message, setMessage] = useState("");
  const [apiKey, setApiKey] = useState(() => loadAIKey());
  const apiKeyRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [legacyFound, setLegacyFound] = useState(false);
  const [migrating, setMigrating] = useState(false);

  useEffect(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("cognitive-action-workbench:data:") && !key.includes(`:${userId}`)) { setLegacyFound(true); break; }
    }
  }, [userId]);

  const download = () => {
    const blob = new Blob([exportPayload(data)], { type: "application/json" }); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `workbench-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url); setMessage("已导出。");
  };

  const doImport = (raw = importText) => {
    try { replaceData(importPayload(raw)); setImportText(""); setMessage("导入成功。"); }
    catch (e) { setMessage(e instanceof Error ? e.message : "导入失败。"); }
  };

  const uploadFile = async (file?: File) => { if (!file) return; doImport(await file.text()); };

  const saveKey = () => {
    const val = apiKeyRef.current?.value ?? apiKey;
    saveAIKey(val);
    setMessage(val.trim() ? "✅ API Key 已保存" : "🗑️ 已清除");
  };

  const clear = () => { if (!confirm("确定清空？")) return; clearAll(); setMessage("已清空。"); };

  const migrateLegacy = async () => {
    setMigrating(true); setMessage("");
    try {
      const migrated: AppData[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("cognitive-action-workbench:data:") && !key.includes(`:${userId}`)) {
          try { const raw = localStorage.getItem(key); if (raw) { const p = JSON.parse(raw); if (p.tasks?.length || p.thoughts?.length) migrated.push(p); } } catch {}
        }
      }
      if (migrated.length === 0) { setMessage("没有可迁移的旧版数据。"); setLegacyFound(false); return; }
      const merged = migrated.reduce((acc, cur) => ({ ...acc, tasks: [...acc.tasks, ...cur.tasks], thoughts: [...acc.thoughts, ...cur.thoughts], calendarEvents: [...(acc.calendarEvents ?? []), ...(cur.calendarEvents ?? [])], strategicPlans: [...(acc.strategicPlans ?? []), ...(cur.strategicPlans ?? [])], timerReflections: [...(acc.timerReflections ?? []), ...(cur.timerReflections ?? [])], thoughtSummaries: [...(acc.thoughtSummaries ?? []), ...(cur.thoughtSummaries ?? [])], weeklyReports: [...(acc.weeklyReports ?? []), ...(cur.weeklyReports ?? [])], dailyStates: { ...acc.dailyStates, ...cur.dailyStates }, dailyReviews: { ...acc.dailyReviews, ...cur.dailyReviews }, todayThree: { ...acc.todayThree, ...cur.todayThree } }), { version: 1, tasks: [], calendarEvents: [], strategicPlans: [], thoughts: [], dailyStates: {}, todayThree: {}, dailyReviews: {}, timerReflections: [], thoughtSummaries: [], weeklyReports: [] });
      replaceData(merged); await pushAllData(userId, merged);
      setMessage(`成功迁移 ${migrated.length} 份旧版数据。`); setLegacyFound(false);
    } catch (e) { setMessage(e instanceof Error ? e.message : "迁移失败。"); }
    finally { setMigrating(false); }
  };

  const chooseAccentTheme = (t: AccentTheme) => { setAccentTheme(t); setMessage(t === "blue" ? "已切换清爽蓝色。" : t === "moss" ? "已切换安静绿色。" : "已切换默认主题。"); };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel><h2 className="text-lg font-semibold">导出</h2><p className="mt-2 text-sm text-ink-700/60 dark:text-ink-100/55">导出当前数据，方便备份或迁移。</p><Button className="mt-5" onClick={download}><Download size={16} className="mr-2" />导出 JSON</Button></Panel>

      <Panel><h2 className="text-lg font-semibold">导入</h2>
        <div className="mt-4 grid gap-4"><Textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="粘贴导出的 JSON。" />
          <div className="flex flex-wrap gap-2"><Button onClick={() => doImport()} disabled={!importText.trim()}><Upload size={16} className="mr-2" />导入文本</Button><Button variant="secondary" onClick={() => fileRef.current?.click()}>选择文件</Button><input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => uploadFile(e.target.files?.[0])} /></div>
        </div>
      </Panel>

      {legacyFound && (
        <Panel className="lg:col-span-2 border-clay-400/30 bg-clay-50/70 dark:border-clay-100/20 dark:bg-clay-600/8">
          <div className="flex items-center gap-2"><Archive size={18} className="text-clay-600 dark:text-clay-100" /><h2 className="text-lg font-semibold">发现旧版数据</h2></div>
          <p className="mt-2 text-sm text-ink-700/60 dark:text-ink-100/55">检测到旧版 localStorage 数据。</p>
          <Button variant="secondary" className="mt-4" onClick={migrateLegacy} disabled={migrating}><Upload size={16} className="mr-2" />{migrating ? "迁移中..." : "迁移旧版数据"}</Button>
        </Panel>
      )}

      <Panel className="lg:col-span-2">
        <div className="flex items-center gap-2"><Palette size={18} className="text-moss-700 dark:text-moss-300" /><h2 className="text-lg font-semibold">外观主题</h2></div>
        <p className="mt-2 text-sm text-ink-700/60 dark:text-ink-100/55">选择工作台的强调色。</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ThemeChoice active={accentTheme === "default"} title="默认" description="纯粹的黑白对比。" swatches={["#000000", "#333333", "#666666", "#999999"]} onClick={() => chooseAccentTheme("default")} />
          <ThemeChoice active={accentTheme === "moss"} title="安静绿色" description="低刺激、偏复盘和恢复。" swatches={["#e8efe2", "#b8c9aa", "#748965", "#4b5f40"]} onClick={() => chooseAccentTheme("moss")} />
          <ThemeChoice active={accentTheme === "blue"} title="清爽蓝色" description="更清醒，适合学习和执行。" swatches={["#e2edf9", "#93bbe2", "#407cb5", "#1e538b"]} onClick={() => chooseAccentTheme("blue")} />
          <ThemeChoice active={accentTheme === "warm"} title="暖橙色" description="温暖有活力，适合创作和冲刺。" swatches={["#ffedd5", "#fdba74", "#ea580c", "#c2410c"]} onClick={() => chooseAccentTheme("warm")} />
        </div>
      </Panel>

      {onToggleLayout && (
        <Panel className="lg:col-span-2">
          <div className="flex items-center gap-2"><Layout size={18} className="text-moss-700 dark:text-moss-300" /><h2 className="text-lg font-semibold">布局切换</h2></div>
          <p className="mt-2 text-sm text-ink-700/60 dark:text-ink-100/55">在经典页面布局和侧边栏布局之间切换。</p>
          <Button variant="secondary" className="mt-4" onClick={onToggleLayout}><Layout size={16} className="mr-2" />切换到侧边栏布局</Button>
        </Panel>
      )}

      <Panel className="lg:col-span-2">
        <h2 className="text-lg font-semibold">AI 设置</h2>
        <p className="mt-2 text-sm text-ink-700/60 dark:text-ink-100/55">DeepSeek API Key 只保存在本地浏览器，不会上传云端。</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <Field label="DeepSeek API Key">
            <input ref={apiKeyRef} type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." autoComplete="off" className="min-h-10 rounded-lg border border-ink-200/85 bg-white/88 px-3 py-2 text-sm text-ink-900 outline-none transition dark:border-white/10 dark:bg-white/[0.055] dark:text-ink-50 w-full" />
          </Field>
          <Button onClick={saveKey}><KeyRound size={16} className="mr-2" />保存 Key</Button>
        </div>
      </Panel>

      <Panel className="lg:col-span-2"><h2 className="text-lg font-semibold">清空数据</h2><p className="mt-2 text-sm text-ink-700/60 dark:text-ink-100/55">只会清空保存在浏览器里的本地数据。</p><Button variant="danger" className="mt-5" onClick={clear}><Trash2 size={16} className="mr-2" />清空所有数据</Button></Panel>

      {message && <div className="lg:col-span-2 rounded-md bg-ink-100 p-3 text-sm text-ink-700 dark:bg-white/5 dark:text-ink-100/70">{message}</div>}
    </div>
  );
}

function ThemeChoice({ active, title, description, swatches, onClick }: { active: boolean; title: string; description: string; swatches: string[]; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cx("flex min-h-[88px] items-center justify-between gap-4 rounded-xl border p-4 text-left transition hover:-translate-y-0.5", active ? "border-moss-500 bg-moss-100/65 shadow-soft dark:border-moss-300/75 dark:bg-moss-500/14" : "border-ink-200/80 bg-white/65 hover:bg-white dark:border-white/10 dark:bg-white/[0.035] dark:hover:bg-white/[0.07]")}>
      <span><span className="block text-sm font-semibold text-ink-900 dark:text-ink-50">{title}</span><span className="mt-1 block text-xs text-ink-700/60 dark:text-ink-100/55">{description}</span><span className="mt-3 flex gap-1.5">{swatches.map((c) => <span key={c} className="h-4 w-4 rounded-full border border-white/80 shadow-sm dark:border-white/15" style={{ backgroundColor: c }} />)}</span></span>
      <span className={cx("grid h-8 w-8 shrink-0 place-items-center rounded-full border transition", active ? "border-moss-500 bg-moss-500 text-white dark:border-moss-300 dark:bg-moss-300 dark:text-ink-900" : "border-ink-200 text-transparent dark:border-white/10")}><Check size={16} /></span>
    </button>
  );
}
