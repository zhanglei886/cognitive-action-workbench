import { AppData, DailyReview as DailyReviewType } from "../types";
import { todayKey } from "../lib/date";
import { Field, Panel, Textarea } from "./ui";

export function DailyReview({ data, setData }: { data: AppData; setData: React.Dispatch<React.SetStateAction<AppData>> }) {
  const today = todayKey();
  const review: DailyReviewType = data.dailyReviews[today] ?? {
    date: today,
    achieved: "",
    emotion: "",
    adjustment: "",
  };

  const update = (patch: Partial<DailyReviewType>) => {
    setData((current) => ({
      ...current,
      dailyReviews: {
        ...current.dailyReviews,
        [today]: { ...review, ...patch },
      },
    }));
  };

  return (
    <Panel className="mx-auto max-w-3xl">
      <h2 className="text-lg font-semibold">每日轻复盘</h2>
      <p className="mt-1 text-sm text-ink-700/60 dark:text-ink-100/55">不用深挖，只留下明天能用的一点点信息。</p>
      <div className="mt-5 grid gap-5">
        <Field label="今天做成了什么？">
          <Textarea value={review.achieved} onChange={(event) => update({ achieved: event.target.value })} />
        </Field>
        <Field label="今天最明显的情绪是什么？">
          <Textarea value={review.emotion} onChange={(event) => update({ emotion: event.target.value })} />
        </Field>
        <Field label="明天要微调什么？">
          <Textarea value={review.adjustment} onChange={(event) => update({ adjustment: event.target.value })} />
        </Field>
      </div>
    </Panel>
  );
}
