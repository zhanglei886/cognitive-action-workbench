import { useState } from "react";
import { AppData } from "../../../types";
import { summarizeThoughts, generateWeeklyReport } from "../../../lib/ai";
import { createId } from "../../../lib/id";
import { Sparkles, FileText, ChevronRight } from "lucide-react";
import { MarkdownText } from "../../MarkdownText";

interface Props { data: AppData; setData: React.Dispatch<React.SetStateAction<AppData>>; }

export function AIPanel({ data, setData }: Props) {
  const [loading, setLoading] = useState<"" | "summary" | "report">("");
  const [error, setError] = useState("");
  const [viewSummary, setViewSummary] = useState<string | null>(null);
  const [viewReport, setViewReport] = useState<string | null>(null);

  const unprocessed = data.thoughts.filter((t) => t.status === "cooling" || t.status === "ready");

  const runSummary = async () => {
    if (unprocessed.length === 0) { setError("没有未处理的想法。"); return; }
    setLoading("summary"); setError("");
    try {
      const content = await summarizeThoughts(unprocessed);
      setData((prev) => ({ ...prev, thoughtSummaries: [{ id: createId(), scope: "unprocessed", content, thoughtCount: unprocessed.length, createdAt: new Date().toISOString() }, ...(prev.thoughtSummaries ?? [])] }));
    } catch (e) { setError(e instanceof Error ? e.message : "AI 总结失败"); }
    finally { setLoading(""); }
  };

  const runReport = async () => {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now); monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
    const ws = monday.toISOString().slice(0, 10); const we = sunday.toISOString().slice(0, 10);
    setLoading("report"); setError("");
    try {
      const content = await generateWeeklyReport(data, ws, we);
      setData((prev) => ({ ...prev, weeklyReports: [{ id: createId(), weekStart: ws, weekEnd: we, content, createdAt: new Date().toISOString() }, ...(prev.weeklyReports ?? [])] }));
    } catch (e) { setError(e instanceof Error ? e.message : "周报生成失败"); }
    finally { setLoading(""); }
  };

  return (
    <div className="space-y-4">
      <button onClick={runSummary} disabled={loading !== ""} className="w-full rounded-xl bg-gray-100 dark:bg-white/10 py-4 text-sm font-medium flex items-center justify-center gap-2">
        <Sparkles size={16} />{loading === "summary" ? "总结中..." : `总结未处理想法 (${unprocessed.length}条)`}
      </button>

      <button onClick={runReport} disabled={loading !== ""} className="w-full rounded-xl bg-gray-100 dark:bg-white/10 py-4 text-sm font-medium flex items-center justify-center gap-2">
        <FileText size={16} />{loading === "report" ? "生成中..." : "生成本周周报"}
      </button>

      {error && <div className="rounded-xl bg-red-50 dark:bg-red-400/10 p-3 text-xs text-red-600 dark:text-red-300">{error}</div>}

      {/* AI 总结历史 */}
      {(data.thoughtSummaries ?? []).length > 0 && (
        <div>
          <div className="text-xs text-gray-400 dark:text-white/30 mb-2">最近 AI 总结</div>
          {data.thoughtSummaries!.slice(0, 5).map((s) => (
            <button
              key={s.id}
              onClick={() => setViewSummary(viewSummary === s.id ? null : s.id)}
              className="w-full rounded-xl bg-gray-100 dark:bg-white/5 p-3 mb-1 text-left"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1"><Sparkles size={13} />{s.scope} · {s.thoughtCount}条想法</span>
                <span className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleDateString("zh-CN")}</span>
              </div>
              {viewSummary === s.id && <div className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-white/60"><MarkdownText content={s.content} /></div>}
            </button>
          ))}
        </div>
      )}

      {/* 周报历史 */}
      {(data.weeklyReports ?? []).length > 0 && (
        <div>
          <div className="text-xs text-gray-400 dark:text-white/30 mb-2">最近周报</div>
          {data.weeklyReports!.slice(0, 5).map((r) => (
            <button
              key={r.id}
              onClick={() => setViewReport(viewReport === r.id ? null : r.id)}
              className="w-full rounded-xl bg-gray-100 dark:bg-white/5 p-3 mb-1 text-left"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1"><FileText size={13} />{r.weekStart} ~ {r.weekEnd}</span>
                <ChevronRight size={14} className={viewReport === r.id ? "rotate-90" : ""} />
              </div>
              {viewReport === r.id && <div className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-white/60"><MarkdownText content={r.content} /></div>}
            </button>
          ))}
        </div>
      )}

      {!(data.thoughtSummaries ?? []).length && !(data.weeklyReports ?? []).length && <div className="py-8 text-center text-sm text-gray-300 dark:text-white/15">还没有 AI 总结或周报</div>}
    </div>
  );
}
