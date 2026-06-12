import { BarChart3, CalendarClock, CheckCircle, Clock, MoveRight } from "lucide-react";
import { AppData, Task, TaskPriority } from "../types";
import { Button, EmptyState, Panel, Select, cx } from "./ui";

const lanes: Array<{
  key: TaskPriority;
  title: string;
  tone: string;
  hint: string;
}> = [
  {
    key: "urgent-important",
    title: "紧急且重要",
    tone: "border-clay-400/50 bg-clay-100/70 dark:bg-clay-600/15",
    hint: "优先安排，减少犹豫。",
  },
  {
    key: "important-not-urgent",
    title: "不紧急但重要",
    tone: "border-moss-300/70 bg-moss-100/70 dark:border-moss-700/35 dark:bg-[#172015]/75",
    hint: "长期推进，稳定复利。",
  },
  {
    key: "not-important-not-urgent",
    title: "不重要且不紧急",
    tone: "border-ink-200 bg-ink-50/70 dark:bg-white/[0.035]",
    hint: "能删则删，能晚则晚。",
  },
];

export function KanbanBoard({ data, setData }: { data: AppData; setData: React.Dispatch<React.SetStateAction<AppData>> }) {
  const activeTasks = data.tasks.filter((task) => !task.completed);
  const maxCount = Math.max(...lanes.map((lane) => activeTasks.filter((task) => task.priority === lane.key).length), 1);

  const updateTask = (taskId: string, patch: Partial<Task>) => {
    setData((current) => ({
      ...current,
      tasks: current.tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task)),
    }));
  };

  const completeTask = (taskId: string) => {
    updateTask(taskId, { completed: true, completedAt: new Date().toISOString() });
  };

  return (
    <div className="grid gap-5">
      <Panel>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold">任务看板</h2>
            <p className="mt-1 text-sm text-ink-700/60 dark:text-ink-100/55">这里只放当前可以推进的具体 work，长期规划移到复盘页。</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-ink-200/80 bg-white/70 px-3 py-2 text-sm text-ink-700/70 dark:border-white/10 dark:bg-white/[0.04] dark:text-ink-100/60">
            <BarChart3 size={16} />
            <span>{activeTasks.length} 个未完成任务</span>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {lanes.map((lane) => {
            const count = activeTasks.filter((task) => task.priority === lane.key).length;
            return (
              <div key={lane.key} className={cx("rounded-xl border p-4", lane.tone)}>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{lane.title}</div>
                  <div className="text-2xl font-semibold">{count}</div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/70 dark:bg-white/10">
                  <div className="h-full rounded-full bg-ink-900 transition-all dark:bg-ink-50" style={{ width: `${Math.max(8, (count / maxCount) * 100)}%` }} />
                </div>
                <p className="mt-3 text-xs text-ink-700/60 dark:text-ink-100/50">{lane.hint}</p>
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-3">
        {lanes.map((lane) => {
          const tasks = activeTasks.filter((task) => task.priority === lane.key);
          return (
            <Panel key={lane.key} className="min-h-80">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold">{lane.title}</h3>
                  <p className="mt-1 text-xs text-ink-700/55 dark:text-ink-100/45">{lane.hint}</p>
                </div>
                <span className="rounded-lg bg-ink-100 px-2 py-1 text-xs text-ink-700/65 dark:bg-white/10 dark:text-ink-100/60">{tasks.length}</span>
              </div>

              <div className="mt-4 grid gap-3">
                {tasks.length === 0 && <EmptyState text="这一栏暂时没有任务。" />}
                {tasks.map((task) => (
                  <article key={task.id} className="rounded-xl border border-ink-200/85 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold">{task.title}</h4>
                        <p className="mt-2 text-sm leading-6 text-ink-700/65 dark:text-ink-100/55">{task.nextAction}</p>
                      </div>
                      <Button variant="ghost" title="完成任务" onClick={() => completeTask(task.id)} className="h-9 w-9 shrink-0 px-0">
                        <CheckCircle size={16} />
                      </Button>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-700/50 dark:text-ink-100/45">
                      <span>{task.type}</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} />
                        {task.estimatedMinutes} 分钟
                      </span>
                      {task.deadline && (
                        <span className={deadlineClass(task.deadline)}>
                          <CalendarClock size={12} />
                          {deadlineText(task.deadline)}
                        </span>
                      )}
                    </div>

                    {(task.tags ?? []).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {task.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-moss-100 px-2 py-1 text-xs text-moss-700 dark:bg-moss-700/20 dark:text-moss-100">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-2">
                      <MoveRight size={15} className="text-ink-700/45 dark:text-ink-100/40" />
                      <Select value={task.priority} onChange={(event) => updateTask(task.id, { priority: event.target.value as TaskPriority })}>
                        {lanes.map((option) => (
                          <option key={option.key} value={option.key}>{option.title}</option>
                        ))}
                      </Select>
                    </div>
                  </article>
                ))}
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

function deadlineText(iso: string) {
  const date = new Date(iso);
  const diffDays = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
  const time = new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
  if (diffDays < 0) return `已过期 · ${time}`;
  if (diffDays === 0) return `今天 · ${time}`;
  if (diffDays === 1) return `明天 · ${time}`;
  return `DDL · ${time}`;
}

function deadlineClass(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const base = "inline-flex items-center gap-1 rounded-full px-2 py-1";
  if (diff < 0) return `${base} bg-clay-100 text-clay-600 dark:bg-clay-600/15 dark:text-clay-100`;
  if (diff < 24 * 60 * 60 * 1000) return `${base} bg-moss-100 text-moss-700 dark:bg-moss-700/20 dark:text-moss-100`;
  return `${base} bg-ink-100 text-ink-700/65 dark:bg-white/10 dark:text-ink-100/60`;
}
