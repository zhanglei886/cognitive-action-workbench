import { useRef, useState } from "react";
import { AppData, Task, TaskPriority, TaskType } from "../../../types";
import { createId } from "../../../lib/id";
import { CheckCircle, Play, Clock, CalendarClock, Plus, Columns3, List, Trash2, X } from "lucide-react";
import { MobileKanban } from "../MobileKanban";
import { BottomSheet } from "../BottomSheet";
import { cx } from "../../ui";

interface Props { data: AppData; setData: React.Dispatch<React.SetStateAction<AppData>>; onStartTimer: (taskId?: string) => void; }

const lanes: Array<{ key: TaskPriority; title: string }> = [
  { key: "urgent-important", title: "紧急重要" },
  { key: "important-not-urgent", title: "重要不紧急" },
  { key: "not-important-not-urgent", title: "不重要不紧急" },
];
const types: TaskType[] = ["research", "study", "engineering", "life", "social", "recovery"];

export function TaskPanel({ data, setData, onStartTimer }: Props) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [expandedLane, setExpandedLane] = useState<TaskPriority>("important-not-urgent");
  const [mode, setMode] = useState<"list" | "kanban">("list");
  const [editing, setEditing] = useState<Task | null>(null);

  const activeTasks = data.tasks.filter((t) => !t.completed);
  const completedTasks = data.tasks.filter((t) => t.completed).slice(0, 10);

  // 修复：用 ref 读取最新值，解决 Enter 提交时读到旧 state 的 bug
  const getInput = () => inputRef.current?.value ?? input;

  const createTask = (text?: string) => {
    const title = (text ?? getInput()).trim();
    if (!title) return;
    setData((prev) => ({ ...prev, tasks: [{ id: createId(), title: title.slice(0, 60), nextAction: "", type: "life", priority: "important-not-urgent", pinned: false, tags: [], estimatedMinutes: 25, completed: false, createdAt: new Date().toISOString() }, ...prev.tasks] }));
    setInput("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const toggleComplete = (t: Task) => {
    setData((prev) => ({ ...prev, tasks: prev.tasks.map((x) => x.id === t.id ? { ...x, completed: !x.completed, completedAt: x.completed ? undefined : new Date().toISOString() } : x) }));
  };

  const deleteTask = (id: string) => {
    setData((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== id) }));
    setEditing(null);
  };

  const updateTask = (id: string, patch: Partial<Task>) => {
    setData((prev) => ({ ...prev, tasks: prev.tasks.map((t) => t.id === id ? { ...t, ...patch } : t) }));
    const updated = data.tasks.find((t) => t.id === id);
    if (updated) setEditing({ ...updated, ...patch });
  };

  return (
    <div className="space-y-3">
      {/* 创建输入框 */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") createTask(e.currentTarget.value); }}
          placeholder="输入新任务，回车创建..."
          className="flex-1 rounded-xl bg-gray-100 dark:bg-white/10 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/25 outline-none"
        />
        <button onClick={() => createTask()} disabled={!input.trim()} className="shrink-0 rounded-xl bg-gray-900 dark:bg-white px-4 py-3 text-sm font-medium text-white dark:text-black disabled:opacity-30"><Plus size={16} /></button>
      </div>

      {/* 列表/看板切换 */}
      <div className="flex gap-1">
        <button onClick={() => setMode("list")} className={cx("flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs", mode === "list" ? "bg-gray-200 dark:bg-white/10 font-medium text-gray-900 dark:text-white" : "text-gray-400")}><List size={13} />列表</button>
        <button onClick={() => setMode("kanban")} className={cx("flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs", mode === "kanban" ? "bg-gray-200 dark:bg-white/10 font-medium text-gray-900 dark:text-white" : "text-gray-400")}><Columns3 size={13} />看板</button>
      </div>

      {mode === "kanban" ? (
        <MobileKanban data={data} setData={setData} onStartTimer={onStartTimer} />
      ) : (
        <>
          {lanes.map((lane) => {
            const tasks = activeTasks.filter((t) => t.priority === lane.key);
            const expanded = expandedLane === lane.key;
            return (
              <div key={lane.key}>
                <button
                  onClick={() => setExpandedLane(expanded ? ("" as any) : lane.key)}
                  className="flex w-full items-center justify-between rounded-xl bg-gray-100 dark:bg-white/5 px-4 py-2.5 text-left"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{lane.title}</div>
                    <div className="text-xs text-gray-400 dark:text-white/30">{tasks.length} 个任务</div>
                  </div>
                  <span className="text-gray-400 text-xs">{expanded ? "收起" : "展开"}</span>
                </button>
                {expanded && (
                  <div className="mt-1 space-y-1">
                    {tasks.length === 0 && <div className="py-4 text-center text-xs text-gray-300 dark:text-white/15">这里还没有任务</div>}
                    {tasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setEditing(t)}
                        className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] px-4 py-2.5 active:scale-[0.99] transition cursor-pointer"
                      >
                        <button onClick={(e) => { e.stopPropagation(); toggleComplete(t); }} className={cx("shrink-0", t.completed ? "text-green-500" : "text-gray-300 dark:text-white/20")}>
                          <CheckCircle size={18} />
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className={cx("text-sm truncate text-gray-900 dark:text-white", t.completed && "line-through text-gray-400 dark:text-white/30")}>{t.title}</div>
                          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-white/25 mt-0.5">
                            <span>{t.type}</span>
                            <span className="flex items-center gap-0.5"><Clock size={10} />{t.estimatedMinutes}m</span>
                            {t.deadline && <span className="flex items-center gap-0.5 text-red-400"><CalendarClock size={10} />{ddlText(t.deadline)}</span>}
                            {t.pinned && <span className="text-amber-500">📌</span>}
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onStartTimer(t.id); }} className="shrink-0 rounded-full bg-gray-200 dark:bg-white/10 p-1.5 text-gray-700 dark:text-white/70">
                          <Play size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {completedTasks.length > 0 && (
            <div className="pt-3 border-t border-gray-200 dark:border-white/10">
              <div className="text-xs text-gray-400 dark:text-white/25 mb-2">最近完成</div>
              {completedTasks.map((t) => (
                <div key={t.id} className="flex items-center gap-2 py-1.5 text-sm line-through text-gray-400 dark:text-white/20 truncate">
                  <CheckCircle size={14} className="shrink-0 text-green-400" />{t.title}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 任务编辑 BottomSheet */}
      <BottomSheet open={!!editing} onClose={() => setEditing(null)} title="编辑任务">
        {editing && (
          <div className="space-y-4 text-gray-900 dark:text-white">
            <div>
              <label className="text-xs text-gray-400 dark:text-white/40">标题</label>
              <input value={editing.title} onChange={(e) => updateTask(editing.id, { title: e.target.value })} className="mt-1 w-full rounded-lg bg-gray-100 dark:bg-white/10 px-3 py-2.5 text-sm outline-none text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="text-xs text-gray-400 dark:text-white/40">下一步行动</label>
              <input value={editing.nextAction ?? ""} onChange={(e) => updateTask(editing.id, { nextAction: e.target.value })} placeholder="具体的下一步..." className="mt-1 w-full rounded-lg bg-gray-100 dark:bg-white/10 px-3 py-2.5 text-sm outline-none placeholder:text-gray-300 dark:placeholder:text-white/25 text-gray-900 dark:text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 dark:text-white/40">类型</label>
                <select value={editing.type} onChange={(e) => updateTask(editing.id, { type: e.target.value as TaskType })} className="mt-1 w-full rounded-lg bg-gray-100 dark:bg-white/10 px-3 py-2.5 text-sm outline-none text-gray-900 dark:text-white">
                  {types.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 dark:text-white/40">优先级</label>
                <select value={editing.priority} onChange={(e) => updateTask(editing.id, { priority: e.target.value as TaskPriority })} className="mt-1 w-full rounded-lg bg-gray-100 dark:bg-white/10 px-3 py-2.5 text-sm outline-none text-gray-900 dark:text-white">
                  {lanes.map((l) => <option key={l.key} value={l.key}>{l.title}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 dark:text-white/40">预估时间 (分钟)</label>
                <input type="number" min={1} max={480} value={editing.estimatedMinutes} onChange={(e) => updateTask(editing.id, { estimatedMinutes: Number(e.target.value) || 25 })} className="mt-1 w-full rounded-lg bg-gray-100 dark:bg-white/10 px-3 py-2.5 text-sm outline-none text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 dark:text-white/40">截止日期</label>
                <input type="date" value={editing.deadline?.slice(0, 10) ?? ""} onChange={(e) => updateTask(editing.id, { deadline: e.target.value ? new Date(e.target.value).toISOString() : undefined })} className="mt-1 w-full rounded-lg bg-gray-100 dark:bg-white/10 px-3 py-2.5 text-sm outline-none text-gray-900 dark:text-white" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/60">
                <input type="checkbox" checked={editing.pinned} onChange={(e) => updateTask(editing.id, { pinned: e.target.checked })} className="rounded" /> 置顶
              </label>
              <button onClick={() => deleteTask(editing.id)} className="flex items-center gap-1 rounded-lg bg-red-50 dark:bg-red-400/20 px-4 py-2 text-sm text-red-500 dark:text-red-400"><Trash2 size={14} />删除</button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

function ddlText(iso: string) { const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000); if (diff < 0) return "过期"; if (diff === 0) return "今天"; if (diff === 1) return "明天"; return `${diff}d`; }
