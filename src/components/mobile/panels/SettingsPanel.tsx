import { useRef, useState } from "react";
import { AppData } from "../../../types";
import { AccentTheme, exportPayload, importPayload, loadAIKey, saveAIKey } from "../../../lib/storage";
import { Moon, Sun, Palette, Download, Upload, Trash2, KeyRound } from "lucide-react";
import { cx } from "../../ui";

interface Props {
  data: AppData; replaceData: (d: AppData) => void; clearAll: () => void;
  accentTheme: AccentTheme; setAccentTheme: (t: AccentTheme) => void;
  userId: string; theme: "light" | "dark"; onToggleTheme: () => void; onLogout: () => void;
  onToggleLayout: () => void;
}

export function SettingsPanel({ data, replaceData, clearAll, accentTheme, setAccentTheme, userId, theme, onToggleTheme, onLogout, onToggleLayout }: Props) {
  const [msg, setMsg] = useState("");
  const [importText, setImportText] = useState("");
  const [apiKey, setApiKey] = useState(loadAIKey);
  const apiKeyRef = useRef<HTMLInputElement>(null);

  const download = () => { const b = new Blob([exportPayload(data)], { type: "application/json" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = `workbench-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(u); setMsg("已导出。"); };
  const doImport = () => { try { replaceData(importPayload(importText)); setImportText(""); setMsg("导入成功。"); } catch (e) { setMsg(e instanceof Error ? e.message : "导入失败。"); } };
  const saveK = () => { const v = apiKeyRef.current?.value ?? apiKey; saveAIKey(v); setMsg(v.trim() ? "✅ API Key 已保存" : "🗑️ 已清除"); };
  const clr = () => { if (!confirm("确定清空？")) return; clearAll(); setMsg("已清空。"); };

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium flex items-center gap-2">{theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}{theme === "dark" ? "暗色" : "亮色"}</span>
          <button onClick={onToggleTheme} className={cx("relative h-7 w-12 rounded-full transition", theme === "dark" ? "bg-gray-900 dark:bg-white" : "bg-gray-300")}>
            <span className={cx("absolute top-0.5 h-6 w-6 rounded-full bg-white dark:bg-black shadow transition flex items-center justify-center", theme === "dark" ? "left-[22px]" : "left-0.5")}>
              {theme === "dark" ? <Moon size={11} /> : <Sun size={11} className="text-gray-500" />}
            </span>
          </button>
        </div>
      </Card>

      <Card>
        <div className="text-sm font-medium mb-3 flex items-center gap-2"><Palette size={16} />强调色</div>
        <div className="grid grid-cols-4 gap-2">
          <AccentBtn label="默认" colors={["#000", "#666"]} active={accentTheme === "default"} onClick={() => setAccentTheme("default")} />
          <AccentBtn label="安静绿" colors={["#b8c9aa", "#4b5f40"]} active={accentTheme === "moss"} onClick={() => setAccentTheme("moss")} />
          <AccentBtn label="清爽蓝" colors={["#93bbe2", "#1e538b"]} active={accentTheme === "blue"} onClick={() => setAccentTheme("blue")} />
          <AccentBtn label="暖橙" colors={["#fdba74", "#c2410c"]} active={accentTheme === "warm"} onClick={() => setAccentTheme("warm")} />
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">布局切换</span>
          <button onClick={onToggleLayout} className="rounded-lg bg-gray-200 dark:bg-white/10 px-4 py-2 text-xs">经典布局</button>
        </div>
      </Card>

      <Card>
        <div className="text-sm font-medium mb-3 flex items-center gap-2"><Download size={16} />数据</div>
        <div className="flex gap-2">
          <button onClick={download} className="flex-1 rounded-lg bg-gray-200 dark:bg-white/10 py-2.5 text-xs"><Download size={13} className="inline mr-1" />导出</button>
          <label className="flex-1 rounded-lg bg-gray-200 dark:bg-white/10 py-2.5 text-xs text-center cursor-pointer"><Upload size={13} className="inline mr-1" />导入<input type="file" accept=".json" className="hidden" onChange={(e) => e.target.files?.[0]?.text().then(doImport)} /></label>
        </div>
        <textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="或粘贴 JSON..." className="mt-2 w-full rounded-lg bg-gray-100 dark:bg-white/10 p-3 text-xs min-h-[50px] resize-none outline-none" />
        <button onClick={doImport} disabled={!importText.trim()} className="mt-1 rounded-lg bg-gray-200 dark:bg-white/10 px-4 py-1.5 text-xs disabled:opacity-30">导入</button>
      </Card>

      <Card>
        <button onClick={clr} className="rounded-lg bg-red-50 dark:bg-red-400/10 px-4 py-2.5 text-xs text-red-600 dark:text-red-300 flex items-center gap-2"><Trash2 size={14} />清空所有数据</button>
      </Card>

      <Card>
        <div className="text-sm font-medium mb-3 flex items-center gap-2"><KeyRound size={16} />DeepSeek API Key</div>
        <input ref={apiKeyRef} type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." className="w-full rounded-lg bg-gray-100 dark:bg-white/10 px-3 py-2.5 text-sm outline-none text-gray-900 dark:text-white placeholder:text-gray-400" />
        <button onClick={saveK} className="mt-2 rounded-lg bg-gray-200 dark:bg-white/10 px-4 py-2 text-xs text-gray-700 dark:text-white/60">保存 Key</button>
      </Card>

      <button onClick={onLogout} className="w-full rounded-xl bg-gray-100 dark:bg-white/10 py-3 text-sm text-gray-500 dark:text-white/40">退出登录</button>

      {msg && <div className="rounded-xl bg-gray-100 dark:bg-white/10 p-3 text-xs text-center text-gray-600 dark:text-white/50">{msg}</div>}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl bg-gray-100 dark:bg-white/5 p-4">{children}</div>;
}

function AccentBtn({ label, colors, active, onClick }: { label: string; colors: string[]; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cx("rounded-xl p-3 text-center transition active:scale-95", active ? "bg-gray-200 dark:bg-white/10 ring-2 ring-gray-900 dark:ring-white" : "bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10")}>
      <div className="flex gap-1 justify-center mb-2">{colors.map((c) => <span key={c} className="h-5 w-5 rounded-full border border-white/30 shadow-sm" style={{ backgroundColor: c }} />)}</div>
      <div className="text-xs font-medium">{label}</div>
    </button>
  );
}
