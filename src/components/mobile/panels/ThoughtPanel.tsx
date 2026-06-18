import { useState } from "react";
import { AppData, ThoughtTag, ThoughtStatus } from "../../../types";
import { createId } from "../../../lib/id";
import { addHours } from "../../../lib/date";
import { Lightbulb, CheckCircle, CircleSlash, ArrowRight, Send } from "lucide-react";
import { cx } from "../../ui";

interface Props { data: AppData; setData: React.Dispatch<React.SetStateAction<AppData>>; }

const tags: ThoughtTag[] = ["idea", "research", "product", "emotion", "question", "writing"];
const statuses: ThoughtStatus[] = ["cooling", "ready"];

export function ThoughtPanel({ data, setData }: Props) {
  const [input, setInput] = useState("");
  const [tag, setTag] = useState<ThoughtTag>("idea");

  const add = () => {
    if (!input.trim()) return;
    setData((prev) => ({ ...prev, thoughts: [{ id: createId(), content: input.trim(), tag, status: "cooling", createdAt: new Date().toISOString(), availableAt: addHours(new Date().toISOString(), 24) }, ...prev.thoughts] }));
    setInput(""); setTag("idea");
  };

  const mark = (id: string, s: ThoughtStatus) => {
    setData((prev) => ({ ...prev, thoughts: prev.thoughts.map((t) => t.id === id ? { ...t, status: s, processedAt: s === "processed" || s === "discarded" ? new Date().toISOString() : t.processedAt } : t) }));
  };

  const convertToTask = (t: AppData["thoughts"][0]) => {
    setData((prev) => ({
      ...prev,
      thoughts: prev.thoughts.map((x) => x.id === t.id ? { ...x, status: "processed", processedAt: new Date().toISOString() } : x),
      tasks: [{ id: createId(), title: t.content.slice(0, 42), nextAction: "从这个想法定义下一步。", type: t.tag === "research" ? "research" : "life", priority: "important-not-urgent", pinned: false, tags: [t.tag], estimatedMinutes: 25, completed: false, createdAt: new Date().toISOString() }, ...prev.tasks],
    }));
  };

  return (
    <div className="space-y-3">
      {/* 输入框 */}
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="突然想到什么？记下来..." className="flex-1 rounded-xl bg-gray-100 dark:bg-white/10 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/25 outline-none" />
        <button onClick={add} disabled={!input.trim()} className="shrink-0 rounded-xl bg-gray-900 dark:bg-white px-4 py-3 text-sm font-medium text-white dark:text-black disabled:opacity-30"><Send size={16} /></button>
      </div>

      {/* 标签选择 */}
      <div className="flex gap-1.5 flex-wrap">
        {tags.map((t) => (
          <button key={t} onClick={() => setTag(t)} className={cx("rounded-full px-2.5 py-1 text-xs", tag === t ? "bg-gray-900 dark:bg-white text-white dark:text-black" : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/40")}>{t}</button>
        ))}
      </div>

      {/* 想法列表按状态分组 */}
      {statuses.map((status) => {
        const list = data.thoughts.filter((t) => t.status === status).slice(0, status === "cooling" ? 10 : 5);
        if (list.length === 0) return null;
        return (
          <div key={status}>
            <div className="text-xs text-gray-400 dark:text-white/30 mb-1.5">{status === "cooling" ? `冷却中 (${list.length})` : `可处理 (${list.length})`}</div>
            <div className="space-y-1">
              {list.map((t) => (
                <div key={t.id} className="rounded-xl bg-gray-100 dark:bg-white/5 p-3">
                  <div className="text-sm leading-relaxed">{t.content}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-xs text-gray-400 dark:text-white/30">{t.tag} · {t.status === "cooling" ? `${Math.ceil((new Date(t.availableAt).getTime() - Date.now()) / 3600000)}h后可处理` : "可处理"}</div>
                    <div className="flex gap-1">
                      {t.status === "cooling" ? (
                        <button onClick={() => mark(t.id, "ready")} className="rounded-full bg-gray-200 dark:bg-white/10 px-2 py-0.5 text-xs">提前处理</button>
                      ) : (
                        <>
                          <button onClick={() => mark(t.id, "processed")} className="rounded-full p-1 text-green-500"><CheckCircle size={15} /></button>
                          <button onClick={() => mark(t.id, "discarded")} className="rounded-full p-1 text-gray-400"><CircleSlash size={15} /></button>
                          <button onClick={() => convertToTask(t)} className="rounded-full bg-gray-900 dark:bg-white px-2 py-0.5 text-xs text-white dark:text-black"><ArrowRight size={13} className="inline mr-0.5" />转任务</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {data.thoughts.length === 0 && <div className="py-12 text-center text-sm text-gray-300 dark:text-white/15">思考池还很安静，去捕获点什么吧</div>}
    </div>
  );
}
