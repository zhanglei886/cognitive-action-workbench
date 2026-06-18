import { useState } from "react";
import { AppData } from "../../../types";
import { Sparkles, FileText, ChevronRight } from "lucide-react";
import { generateWeeklyReport } from "../../../lib/ai";
import { createId } from "../../../lib/id";
import { MarkdownText } from "../../MarkdownText";

interface Props { data: AppData; setData: React.Dispatch<React.SetStateAction<AppData>>; }

export function ReportPanel({ data, setData }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const reports = data.weeklyReports ?? [];

  const generate = async () => {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now); monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
    setLoading(true); setError("");
    try {
      const content = await generateWeeklyReport(data, monday.toISOString().slice(0, 10), sunday.toISOString().slice(0, 10));
      setData((prev) => ({ ...prev, weeklyReports: [{ id: createId(), weekStart: monday.toISOString().slice(0, 10), weekEnd: sunday.toISOString().slice(0, 10), content, createdAt: new Date().toISOString() }, ...(prev.weeklyReports ?? [])] }));
    } catch (e) { setError(e instanceof Error ? e.message : "生成失败"); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <button onClick={generate} disabled={loading} className="w-full rounded-xl bg-gray-100 dark:bg-white/10 py-4 text-sm font-medium flex items-center justify-center gap-2">
        <Sparkles size={16} />{loading ? "生成中..." : "生成本周周报"}
      </button>
      {error && <div className="rounded-xl bg-red-50 dark:bg-red-400/10 p-3 text-xs text-red-600 dark:text-red-300">{error}</div>}

      {reports.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-300 dark:text-white/15">还没有周报，点上面生成第一篇</div>
      ) : (
        reports.map((r) => (
          <div key={r.id} className="rounded-xl bg-gray-100 dark:bg-white/5 overflow-hidden">
            <button onClick={() => setExpanded(expanded === r.id ? null : r.id)} className="w-full flex items-center justify-between p-4 text-left">
              <div>
                <div className="text-sm font-medium flex items-center gap-2"><FileText size={14} />{r.weekStart} ~ {r.weekEnd}</div>
                <div className="text-xs text-gray-400 dark:text-white/30 mt-0.5">{new Date(r.createdAt).toLocaleDateString("zh-CN")}</div>
              </div>
              <ChevronRight size={16} className={expanded === r.id ? "rotate-90 text-gray-900 dark:text-white" : "text-gray-400"} />
            </button>
            {expanded === r.id && (
              <div className="px-4 pb-4 text-sm leading-relaxed text-gray-700 dark:text-white/60"><MarkdownText content={r.content} /></div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
