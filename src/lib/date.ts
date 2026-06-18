import { TimerState } from "../types";

export const todayKey = () => new Date().toISOString().slice(0, 10);

export const isSameDay = (iso: string, day = todayKey()) => iso.slice(0, 10) === day;

export const addHours = (iso: string, hours: number) => {
  const date = new Date(iso);
  date.setHours(date.getHours() + hours);
  return date.toISOString();
};

export const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
};

export const formatShortDateTime = (iso: string) =>
  new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

export function getTimerRemainingSeconds(timer: TimerState, now = Date.now()) {
  if (timer.running && timer.targetEndAt) {
    return Math.max(0, Math.ceil((new Date(timer.targetEndAt).getTime() - now) / 1000));
  }
  return Math.max(0, timer.remainingSeconds);
}
