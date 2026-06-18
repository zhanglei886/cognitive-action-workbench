import { useState, useMemo } from "react";
import { AppData } from "../types";
import { Search, X, CheckSquare, Lightbulb, CalendarClock } from "lucide-react";
import { Button, cx, Input } from "./ui";

interface Props { data: AppData; open: boolean; onClose: () => void; onNavigate: (view: string) => void; }

export function SearchModal({ data, open, onClose, onNavigate }: Props) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const items: Array<{ id: string; title: string; subtitle: string; type: "task" | "thought" | "event"; icon: any; view: string }> = [];

    data.tasks.filter((t) => t.title.toLowerCase().includes(q) || (t.nextAction ?? "").toLowerCase().includes(q)).slice(0, 5).forEach((t) => {
      items.push({ id: t.id, title: t.title, subtitle: t.nextAction ?? t.type, type: "task", icon: CheckSquare, view: "tasks" });
    });

    data.thoughts.filter((t) => t.content.toLowerCase().includes(q)).slice(0, 3).forEach((t) => {
      items.push({ id: t.id, title: t.content.slice(0, 60), subtitle: `${t.tag} · ${t.status}`, type: "thought", icon: Lightbulb, view: "thoughts" });
    });

    (data.calendarEvents ?? []).filter((e) => e.title.toLowerCase().includes(q) || (e.note ?? "").toLowerCase().includes(q)).slice(0, 3).forEach((e) => {
      items.push({ id: e.id, title: e.title, subtitle: e.date, type: "event", icon: CalendarClock, view: "calendar" });
    });

    return items;
  }, [query, data]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-ink-900/30 backdrop-blur-sm pt-24 px-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-2xl border border-ink-200/80 bg-white p-5 shadow-panel dark:border-white/10 dark:bg-ink-900">
        <div className="flex items-center gap-2 mb-4">
          <Search size={18} className="text-ink-700/40 dark:text-ink-100/35 shrink-0" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索任务、想法、事件... (Ctrl+K)"
            className="flex-1 border-none bg-transparent shadow-none text-base dark:text-white"
          />
          <button onClick={onClose} className="rounded-lg p-1 text-ink-700/40 hover:text-ink-700 dark:text-ink-100/35"><X size={18} /></button>
        </div>

        {query.trim() && (
          <div className="max-h-[50vh] overflow-y-auto space-y-1">
            {results.length === 0 && (
              <div className="py-8 text-center text-sm text-ink-700/40 dark:text-ink-100/35">没有找到匹配的结果</div>
            )}
            {results.map((item) => (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => { onNavigate(item.view); onClose(); }}
                className="flex w-full items-start gap-3 rounded-lg p-2.5 text-left hover:bg-ink-100 dark:hover:bg-white/5 transition"
              >
                <item.icon size={16} className="mt-0.5 shrink-0 text-ink-700/50 dark:text-ink-100/50" />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate text-ink-900 dark:text-ink-50">{item.title}</div>
                  <div className="text-xs text-ink-700/45 dark:text-ink-100/40 mt-0.5">{item.subtitle}</div>
                </div>
                <span className="shrink-0 ml-auto text-[10px] text-ink-700/30 dark:text-ink-100/25 capitalize">{item.type}</span>
              </button>
            ))}
          </div>
        )}

        {!query.trim() && (
          <div className="py-6 text-center text-sm text-ink-700/35 dark:text-ink-100/30">
            输入关键词搜索你的任务、想法和日历事件
          </div>
        )}
      </div>
    </div>
  );
}
