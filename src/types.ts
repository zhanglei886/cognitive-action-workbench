export type TaskType = "study" | "research" | "engineering" | "social" | "life" | "recovery";

export type TodaySlot = "must" | "move" | "care";

export type TaskPriority = "urgent-important" | "important-not-urgent" | "not-important-not-urgent";

export interface Task {
  id: string;
  title: string;
  nextAction: string;
  type: TaskType;
  priority: TaskPriority;
  pinned: boolean;
  tags: string[];
  deadline?: string;
  estimatedMinutes: number;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}

export type ThoughtTag =
  | "emotion"
  | "relationship"
  | "career"
  | "research"
  | "product"
  | "philosophy"
  | "writing"
  | "idea"
  | "question";

export type ThoughtStatus = "cooling" | "ready" | "processed" | "discarded";

export interface Thought {
  id: string;
  content: string;
  tag: ThoughtTag;
  status: ThoughtStatus;
  createdAt: string;
  availableAt: string;
  processedAt?: string;
}

export interface DailyState {
  date: string;
  energy: number;
  mood: number;
  focus: number;
  fatigue: number;
}

export interface DailyReview {
  date: string;
  achieved: string;
  emotion: string;
  adjustment: string;
}

export interface TimerReflection {
  id: string;
  taskId?: string;
  modeMinutes: number;
  completedWhat: string;
  interruptedBy: string;
  nextStep: string;
  createdAt: string;
}

export interface ThoughtSummary {
  id: string;
  scope: "all" | "ready" | "cooling" | "unprocessed";
  content: string;
  thoughtCount: number;
  createdAt: string;
}

export interface TimerState {
  selectedTaskId?: string;
  modeMinutes: number;
  remainingSeconds: number;
  running: boolean;
  startedAt?: string;
  targetEndAt?: string;
}

export interface AppData {
  version: 1;
  tasks: Task[];
  thoughts: Thought[];
  dailyStates: Record<string, DailyState>;
  todayThree: Record<string, Partial<Record<TodaySlot, string>>>;
  dailyReviews: Record<string, DailyReview>;
  timerReflections: TimerReflection[];
  thoughtSummaries: ThoughtSummary[];
}
