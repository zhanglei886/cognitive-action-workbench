import { ChevronLeft, ChevronRight, Plus, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from "react";
import { AppData, DailyReview as DailyReviewType, StrategicPlan, StrategicPlanStatus, Task } from "../types";
import { generateWeeklyReport } from "../lib/ai";
import { todayKey } from "../lib/date";
import { createId } from "../lib/id";
import { MarkdownText } from "./MarkdownText";
import { Button, EmptyState, Field, Input, Panel, Select, Textarea, cx } from "./ui";

const planStatuses: Array<[StrategicPlanStatus, string]> = [
  ["exploring", "探索中"],
  ["deciding", "待决策"],
  ["active", "推进中"],
  ["paused", "暂停"],
  ["done", "完成"],
];

const blankPlan = {
  title: "",
  status: "exploring" as StrategicPlanStatus,
  notes: "",
};

const planPageSize = 9;

export function DailyReview({ data, setData }: { data: AppData; setData: Dispatch<SetStateAction<AppData>> }) {
  const today = todayKey();
  const [reportWeekAnchor, setReportWeekAnchor] = useState(today);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [planDraft, setPlanDraft] = useState(blankPlan);
  const [planPage, setPlanPage] = useState(0);

  const weekRange = useMemo(() => getWeekRange(reportWeekAnchor), [reportWeekAnchor]);
  const currentWeekReport = (data.weeklyReports ?? []).find((report) => report.weekStart === weekRange.startKey && report.weekEnd === weekRange.endKey);
  const weekStats = useMemo(() => getWeekStats(data, weekRange.startKey, weekRange.endKey), [data, weekRange.startKey, weekRange.endKey]);
  const activePlans = useMemo(
    () =>
      [...(data.strategicPlans ?? [])].sort((a, b) => {
        if (a.status === "done" && b.status !== "done") return 1;
        if (a.status !== "done" && b.status === "done") return -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
    [data.strategicPlans],
  );

  const planPageCount = Math.max(1, Math.ceil(activePlans.length / planPageSize));
  const pagePlans = activePlans.slice(planPage * planPageSize, (planPage + 1) * planPageSize);
  const review: DailyReviewType = data.dailyReviews[today] ?? {
    date: today,
    achieved: "",
    emotion: "",
    adjustment: "",
  };
  const isCurrentWeek = weekRange.startKey === getWeekRange(today).startKey;

  useEffect(() => {
    setPlanPage((page) => Math.min(page, planPageCount - 1));
  }, [planPageCount]);

  const updateReview = (patch: Partial<DailyReviewType>) => {
    setData((current) => ({
      ...current,
      dailyReviews: {
        ...current.dailyReviews,
        [today]: { ...review, ...patch },
      },
    }));
  };

  const savePlan = () => {
    if (!planDraft.title.trim()) return;
    const plan: StrategicPlan = {
      id: createId(),
      title: planDraft.title.trim(),
      status: planDraft.status,
      notes: planDraft.notes.trim(),
      createdAt: new Date().toISOString(),
    };
    setData((current) => ({ ...current, strategicPlans: [plan, ...(current.strategicPlans ?? [])] }));
    setPlanDraft(blankPlan);
    setPlanPage(0);
  };

  const updatePlan = (planId: string, patch: Partial<StrategicPlan>) => {
    setData((current) => ({
      ...current,
      strategicPlans: (current.strategicPlans ?? []).map((plan) => (plan.id === planId ? { ...plan, ...patch } : plan)),
    }));
  };

  const deletePlan = (planId: string) => {
    setData((current) => ({
      ...current,
      strategicPlans: (current.strategicPlans ?? []).filter((plan) => plan.id !== planId),
    }));
  };

  const convertPlanToTask = (plan: StrategicPlan) => {
    const task: Task = {
      id: createId(),
      title: `推进：${plan.title}`,
      nextAction: plan.notes || plan.question || "写下一个 25 分钟内能完成的具体动作。",
      type: "life",
      priority: "important-not-urgent",
      pinned: true,
      tags: ["长期规划"],
      estimatedMinutes: 25,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setData((current) => ({ ...current, tasks: [task, ...current.tasks] }));
  };

  const runWeeklyReport = async () => {
    setError("");
    setGenerating(true);
    try {
      const content = await generateWeeklyReport(data, weekRange.startKey, weekRange.endKey);
      setData((current) => ({
        ...current,
        weeklyReports: [
          {
            id: createId(),
            weekStart: weekRange.startKey,
            weekEnd: weekRange.endKey,
            content,
            createdAt: new Date().toISOString(),
          },
          ...(current.weeklyReports ?? []).filter((report) => !(report.weekStart === weekRange.startKey && report.weekEnd === weekRange.endKey)),
        ],
      }));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "AI 周报生成失败。");
    } finally {
      setGenerating(false);
    }
  };

  const moveReportWeek = (offset: number) => {
    setReportWeekAnchor((current) => {
      const date = new Date(current);
      date.setDate(date.getDate() + offset * 7);
      return toDateKey(date);
    });
  };

  return (
    <div className="grid gap-5">
      <Panel>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">长期规划</h2>
            <p className="mt-1 text-sm text-ink-700/60 dark:text-ink-100/55">把长远问题放在这里沉淀，真正要做的下一步再转成任务。</p>
          </div>
          <div className="rounded-xl border border-ink-200/80 bg-white/70 px-3 py-2 text-sm text-ink-700/70 dark:border-white/10 dark:bg-white/[0.04] dark:text-ink-100/60">
            {activePlans.filter((plan) => plan.status !== "done").length} 个开放问题
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[280px_1fr]">
          <div className="rounded-xl border border-ink-200/85 bg-white/58 p-4 dark:border-white/10 dark:bg-white/[0.035]">
            <h3 className="text-sm font-semibold">添加规划</h3>
            <div className="mt-4 grid gap-3">
              <Field label="标题">
                <Input value={planDraft.title} onChange={(event) => setPlanDraft({ ...planDraft, title: event.target.value })} placeholder="例如：调研潜在导师" />
              </Field>
              <Field label="状态">
                <Select value={planDraft.status} onChange={(event) => setPlanDraft({ ...planDraft, status: event.target.value as StrategicPlanStatus })}>
                  {planStatuses.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="备注">
                <Textarea value={planDraft.notes} onChange={(event) => setPlanDraft({ ...planDraft, notes: event.target.value })} placeholder="只写当前要记住的线索或下一步。" className="min-h-24" />
              </Field>
              <Button onClick={savePlan} className="h-10">
                <Plus size={16} className="mr-2" />
                添加
              </Button>
            </div>
          </div>

          <div className="grid gap-3">
            {activePlans.length === 0 && <EmptyState text="还没有长期规划。导师调研、课程策略、申请方向这类问题都可以放在这里。" />}
            {activePlans.length > 0 && (
              <>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {pagePlans.map((plan) => (
                    <article key={plan.id} className="flex min-h-36 flex-col rounded-xl border border-ink-200/85 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className={cx("break-words text-sm font-semibold leading-5", plan.status === "done" && "line-through text-ink-700/45 dark:text-ink-100/40")}>{plan.title}</h3>
                          <span className={cx("mt-2 inline-flex", planStatusClass(plan.status))}>{planStatusLabel(plan.status)}</span>
                        </div>
                        <Button variant="ghost" onClick={() => deletePlan(plan.id)} title="删除规划" className="h-8 w-8 shrink-0 px-0">
                          <Trash2 size={15} />
                        </Button>
                      </div>
                      <p className="mt-2 min-h-[3.25rem] overflow-hidden text-xs leading-5 text-ink-700/62 dark:text-ink-100/52 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
                        {plan.notes || "暂无备注。"}
                      </p>
                      <div className="mt-auto grid grid-cols-[1fr_auto] gap-2 pt-3">
                        <Select value={plan.status} onChange={(event) => updatePlan(plan.id, { status: event.target.value as StrategicPlanStatus })} className="h-9 min-h-9 text-xs">
                          {planStatuses.map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </Select>
                        <Button variant="secondary" onClick={() => convertPlanToTask(plan)} className="h-9 px-2 text-xs" title="转成任务">
                          <Sparkles size={14} />
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>

                {activePlans.length > planPageSize && (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-ink-200/80 bg-white/60 p-2 dark:border-white/10 dark:bg-white/[0.035]">
                    <Button variant="secondary" onClick={() => setPlanPage((page) => Math.max(page - 1, 0))} disabled={planPage === 0} className="h-9 text-xs">
                      <ChevronLeft size={15} className="mr-1" />
                      上一页
                    </Button>
                    <span className="text-sm text-ink-700/60 dark:text-ink-100/55">
                      {planPage + 1} / {planPageCount}
                    </span>
                    <Button variant="secondary" onClick={() => setPlanPage((page) => Math.min(page + 1, planPageCount - 1))} disabled={planPage >= planPageCount - 1} className="h-9 text-xs">
                      下一页
                      <ChevronRight size={15} className="ml-1" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel>
          <h2 className="text-lg font-semibold">每日轻复盘</h2>
          <p className="mt-1 text-sm text-ink-700/60 dark:text-ink-100/55">不用深化，只留下明天能用的一点点信息。</p>
          <div className="mt-5 grid gap-5">
            <Field label="今天做成了什么？">
              <Textarea value={review.achieved} onChange={(event) => updateReview({ achieved: event.target.value })} />
            </Field>
            <Field label="今天最明显的情绪是什么？">
              <Textarea value={review.emotion} onChange={(event) => updateReview({ emotion: event.target.value })} />
            </Field>
            <Field label="明天要微调什么？">
              <Textarea value={review.adjustment} onChange={(event) => updateReview({ adjustment: event.target.value })} />
            </Field>
          </div>
        </Panel>

        <Panel>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">AI 周报</h2>
              <p className="mt-1 text-sm text-ink-700/60 dark:text-ink-100/55">{formatWeekRange(weekRange.startKey, weekRange.endKey)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => moveReportWeek(-1)} title="上一周" className="h-10 w-10 px-0">
                <ChevronLeft size={16} />
              </Button>
              <Button variant="secondary" onClick={() => moveReportWeek(1)} disabled={isCurrentWeek} title="下一周" className="h-10 w-10 px-0">
                <ChevronRight size={16} />
              </Button>
              <Button onClick={runWeeklyReport} disabled={generating || !weekStats.hasContent} className="shrink-0">
                {currentWeekReport ? <RefreshCw size={16} className="mr-2" /> : <Sparkles size={16} className="mr-2" />}
                {generating ? "生成中" : currentWeekReport ? "重新生成" : "生成周报"}
              </Button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
            <WeekStat label="学习" value={formatFocusDuration(weekStats.focusMinutes)} />
            <WeekStat label="完成" value={`${weekStats.completedTasks} 个`} />
            <WeekStat label="想法" value={`${weekStats.thoughts} 条`} />
            <WeekStat label="复盘" value={`${weekStats.reviews} 天`} />
          </div>

          {error && <div className="mt-4 rounded-md bg-clay-100 p-3 text-sm text-clay-600 dark:bg-clay-600/15 dark:text-clay-100">{error}</div>}

          <div className="mt-5">
            {currentWeekReport ? (
              <article className="rounded-lg border border-ink-200 p-4 dark:border-white/10">
                <div className="mb-3 text-xs text-ink-700/50 dark:text-ink-100/45">生成于 {new Date(currentWeekReport.createdAt).toLocaleString("zh-CN")}</div>
                <MarkdownText content={currentWeekReport.content} />
              </article>
            ) : (
              <EmptyState text={weekStats.hasContent ? "还没有本周周报。生成一次，把这一周收束成几个可行动的句子。" : "本周记录还太少，先做一点，再回来生成周报。"} />
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function WeekStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink-200/80 bg-white/60 p-3 text-center dark:border-white/10 dark:bg-white/[0.04]">
      <div className="text-sm font-semibold tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-ink-700/50 dark:text-ink-100/45">{label}</div>
    </div>
  );
}

function getWeekStats(data: AppData, weekStart: string, weekEnd: string) {
  const timerRecords = data.timerReflections.filter((record) => isInDayRange(record.createdAt, weekStart, weekEnd));
  const reviews = Object.keys(data.dailyReviews).filter((date) => date >= weekStart && date <= weekEnd);
  const thoughts = data.thoughts.filter((thought) => isInDayRange(thought.createdAt, weekStart, weekEnd));
  const calendarEvents = (data.calendarEvents ?? []).filter((event) => isInDayRange(event.date, weekStart, weekEnd));
  const strategicPlans = (data.strategicPlans ?? []).filter(
    (plan) =>
      isInDayRange(plan.createdAt, weekStart, weekEnd) ||
      Boolean(plan.nextReviewAt && isInDayRange(plan.nextReviewAt, weekStart, weekEnd)) ||
      plan.status === "active" ||
      plan.status === "deciding",
  );
  const weeklyTasks = data.tasks.filter(
    (task) =>
      isInDayRange(task.createdAt, weekStart, weekEnd) ||
      Boolean(task.completedAt && isInDayRange(task.completedAt, weekStart, weekEnd)) ||
      Boolean(task.deadline && isInDayRange(task.deadline, weekStart, weekEnd)),
  );

  return {
    focusMinutes: timerRecords.reduce((total, record) => total + record.modeMinutes, 0),
    completedTasks: weeklyTasks.filter((task) => task.completedAt && isInDayRange(task.completedAt, weekStart, weekEnd)).length,
    thoughts: thoughts.length,
    reviews: reviews.length,
    hasContent: timerRecords.length > 0 || reviews.length > 0 || thoughts.length > 0 || weeklyTasks.length > 0 || calendarEvents.length > 0 || strategicPlans.length > 0,
  };
}

function getWeekRange(dayKey: string) {
  const date = new Date(dayKey);
  const dayIndex = (date.getDay() + 6) % 7;
  const start = new Date(date);
  start.setDate(date.getDate() - dayIndex);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    startKey: toDateKey(start),
    endKey: toDateKey(end),
  };
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isInDayRange(iso: string, startKey: string, endKey: string) {
  const key = iso.slice(0, 10);
  return key >= startKey && key <= endKey;
}

function formatWeekRange(startKey: string, endKey: string) {
  const formatter = new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit" });
  return `${formatter.format(new Date(startKey))} - ${formatter.format(new Date(endKey))}`;
}

function formatFocusDuration(minutes: number) {
  if (minutes <= 0) return "0 分钟";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} 分钟`;
  if (rest === 0) return `${hours} 小时`;
  return `${hours} 小时 ${rest} 分钟`;
}

function planStatusLabel(status: StrategicPlanStatus) {
  return planStatuses.find(([value]) => value === status)?.[1] ?? "探索中";
}

function planStatusClass(status: StrategicPlanStatus) {
  const base = "rounded-full px-2 py-1 text-xs";
  if (status === "active") return `${base} bg-moss-100 text-moss-700 dark:bg-moss-700/20 dark:text-moss-100`;
  if (status === "deciding") return `${base} bg-clay-100 text-clay-600 dark:bg-clay-600/15 dark:text-clay-100`;
  if (status === "done") return `${base} bg-ink-100 text-ink-700/55 dark:bg-white/10 dark:text-ink-100/50`;
  if (status === "paused") return `${base} bg-ink-100 text-ink-700/55 dark:bg-white/10 dark:text-ink-100/50`;
  return `${base} bg-white text-ink-700/65 dark:bg-white/10 dark:text-ink-100/60`;
}
