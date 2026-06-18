import { useState } from "react";
import { AppData, DailyReview } from "../../../types";
import { todayKey } from "../../../lib/date";
import { RotateCcw } from "lucide-react";

interface Props { data: AppData; setData: React.Dispatch<React.SetStateAction<AppData>>; }

export function ReviewPanel({ data, setData }: Props) {
  const today = todayKey();
  const review: DailyReview = data.dailyReviews[today] ?? { date: today, achieved: "", emotion: "", adjustment: "" };

  const update = (patch: Partial<DailyReview>) => {
    setData((prev) => ({ ...prev, dailyReviews: { ...prev.dailyReviews, [today]: { ...review, ...patch } } }));
  };

  // 今日统计
  const done = data.tasks.filter((t) => t.completedAt?.slice(0, 10) === today).length;
  const focus = data.timerReflections.filter((r) => r.createdAt.slice(0, 10) === today).reduce((a, r) => a + r.modeMinutes, 0);
  const thoughts = data.thoughts.filter((t) => t.createdAt.slice(0, 10) === today).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <RotateCcw size={18} /> <span className="text-lg font-semibold">每日复盘</span>
      </div>

      {/* 今日统计 */}
      <div className="grid grid-cols-3 gap-2">
        <Stat label="完成任务" value={`${done}个`} />
        <Stat label="专注时长" value={`${focus}分钟`} />
        <Stat label="捕获想法" value={`${thoughts}条`} />
      </div>

      {/* 复盘三问 */}
      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-400 dark:text-white/30">今天做成了什么？</label>
          <textarea value={review.achieved} onChange={(e) => update({ achieved: e.target.value })} className="mt-1 w-full rounded-xl bg-gray-100 dark:bg-white/10 p-4 text-sm text-gray-900 dark:text-white min-h-[70px] resize-none outline-none placeholder:text-gray-300 dark:placeholder:text-white/15" placeholder="具体一点，哪怕只写了一页..." />
        </div>
        <div>
          <label className="text-xs text-gray-400 dark:text-white/30">今天最明显的情绪？</label>
          <textarea value={review.emotion} onChange={(e) => update({ emotion: e.target.value })} className="mt-1 w-full rounded-xl bg-gray-100 dark:bg-white/10 p-4 text-sm text-gray-900 dark:text-white min-h-[70px] resize-none outline-none placeholder:text-gray-300 dark:placeholder:text-white/15" placeholder="不用分析，描述就好..." />
        </div>
        <div>
          <label className="text-xs text-gray-400 dark:text-white/30">明天微调什么？</label>
          <input value={review.adjustment} onChange={(e) => update({ adjustment: e.target.value })} className="mt-1 w-full rounded-xl bg-gray-100 dark:bg-white/10 px-4 py-3 text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-300 dark:placeholder:text-white/15" placeholder="一个小调整就够了..." />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-100 dark:bg-white/5 p-3 text-center">
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-xs text-gray-400 dark:text-white/30">{label}</div>
    </div>
  );
}
