// ============================================================
// Supabase Database 类型定义
// 与 supabase/migrations/001_initial_schema.sql 保持一致
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          email: string | null;
          subscription_tier: "free" | "pro_monthly" | "pro_annual" | "lifetime";
          subscription_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          email?: string | null;
          subscription_tier?: "free" | "pro_monthly" | "pro_annual" | "lifetime";
          subscription_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          email?: string | null;
          subscription_tier?: "free" | "pro_monthly" | "pro_annual" | "lifetime";
          subscription_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          next_action: string;
          type: "study" | "research" | "engineering" | "social" | "life" | "recovery";
          priority: "urgent-important" | "important-not-urgent" | "not-important-not-urgent";
          pinned: boolean;
          tags: string[];
          deadline: string | null;
          estimated_minutes: number;
          completed: boolean;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          next_action?: string;
          type?: "study" | "research" | "engineering" | "social" | "life" | "recovery";
          priority?: "urgent-important" | "important-not-urgent" | "not-important-not-urgent";
          pinned?: boolean;
          tags?: string[];
          deadline?: string | null;
          estimated_minutes?: number;
          completed?: boolean;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          next_action?: string;
          type?: "study" | "research" | "engineering" | "social" | "life" | "recovery";
          priority?: "urgent-important" | "important-not-urgent" | "not-important-not-urgent";
          pinned?: boolean;
          tags?: string[];
          deadline?: string | null;
          estimated_minutes?: number;
          completed?: boolean;
          created_at?: string;
          completed_at?: string | null;
        };
      };
      calendar_events: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          date: string;
          type: "exam" | "deadline" | "meeting" | "milestone" | "personal";
          note: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          date: string;
          type?: "exam" | "deadline" | "meeting" | "milestone" | "personal";
          note?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          date?: string;
          type?: "exam" | "deadline" | "meeting" | "milestone" | "personal";
          note?: string;
          created_at?: string;
        };
      };
      strategic_plans: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          question: string | null;
          area: "advisor" | "course" | "research" | "career" | "life" | "other" | null;
          horizon: "month" | "semester" | "year" | null;
          status: "exploring" | "deciding" | "active" | "paused" | "done";
          next_review_at: string | null;
          notes: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          question?: string | null;
          area?: "advisor" | "course" | "research" | "career" | "life" | "other" | null;
          horizon?: "month" | "semester" | "year" | null;
          status?: "exploring" | "deciding" | "active" | "paused" | "done";
          next_review_at?: string | null;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          question?: string | null;
          area?: "advisor" | "course" | "research" | "career" | "life" | "other" | null;
          horizon?: "month" | "semester" | "year" | null;
          status?: "exploring" | "deciding" | "active" | "paused" | "done";
          next_review_at?: string | null;
          notes?: string;
          created_at?: string;
        };
      };
      thoughts: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          tag: "emotion" | "relationship" | "career" | "research" | "product" | "philosophy" | "writing" | "idea" | "question";
          status: "cooling" | "ready" | "processed" | "discarded";
          created_at: string;
          available_at: string;
          processed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          tag?: "emotion" | "relationship" | "career" | "research" | "product" | "philosophy" | "writing" | "idea" | "question";
          status?: "cooling" | "ready" | "processed" | "discarded";
          created_at?: string;
          available_at: string;
          processed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          tag?: "emotion" | "relationship" | "career" | "research" | "product" | "philosophy" | "writing" | "idea" | "question";
          status?: "cooling" | "ready" | "processed" | "discarded";
          created_at?: string;
          available_at?: string;
          processed_at?: string | null;
        };
      };
      daily_states: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          energy: number;
          mood: number;
          focus: number;
          fatigue: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          energy?: number;
          mood?: number;
          focus?: number;
          fatigue?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          energy?: number;
          mood?: number;
          focus?: number;
          fatigue?: number;
        };
      };
      daily_reviews: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          achieved: string;
          emotion: string;
          adjustment: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          achieved?: string;
          emotion?: string;
          adjustment?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          achieved?: string;
          emotion?: string;
          adjustment?: string;
        };
      };
      timer_reflections: {
        Row: {
          id: string;
          user_id: string;
          task_id: string | null;
          mode_minutes: number;
          completed_what: string;
          interrupted_by: string;
          next_step: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          task_id?: string | null;
          mode_minutes: number;
          completed_what?: string;
          interrupted_by?: string;
          next_step?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          task_id?: string | null;
          mode_minutes?: number;
          completed_what?: string;
          interrupted_by?: string;
          next_step?: string;
          created_at?: string;
        };
      };
      thought_summaries: {
        Row: {
          id: string;
          user_id: string;
          scope: "all" | "ready" | "cooling" | "unprocessed";
          content: string;
          thought_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          scope?: "all" | "ready" | "cooling" | "unprocessed";
          content: string;
          thought_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          scope?: "all" | "ready" | "cooling" | "unprocessed";
          content?: string;
          thought_count?: number;
          created_at?: string;
        };
      };
      weekly_reports: {
        Row: {
          id: string;
          user_id: string;
          week_start: string;
          week_end: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          week_start: string;
          week_end: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          week_start?: string;
          week_end?: string;
          content?: string;
          created_at?: string;
        };
      };
      today_three: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          slot: "must" | "move" | "care";
          task_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          slot: "must" | "move" | "care";
          task_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          slot?: "must" | "move" | "care";
          task_id?: string | null;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
