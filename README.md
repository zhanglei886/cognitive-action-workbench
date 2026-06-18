# Cognitive Workbench · Personal Cognition & Action Workbench

> "Thoughts into the pool first, actions one step ahead."  
> "No conflict, no forced depth. No action, no further analysis."

A full-stack personal productivity tool for knowledge workers and students: task management with Eisenhower matrix, Pomodoro timer with reflection, thought pool with 24h cooling period, daily review, calendar, AI-powered personal insights and weekly reports. Web + Android/iOS (Capacitor).

**Built by a physics undergraduate — for anyone who thinks deeply and wants to act deliberately.**

---

## Features

- **Dashboard** — Weekly stats, Pomodoro countdown with task association, today's 3 priorities, daily energy/mood/focus tracking
- **Tasks** — Create/edit/delete with type, priority (Eisenhower), deadline, tags. List + Kanban views. Tap to open detail editor.
- **Focus Timer** — 5/15/25/50 min modes. Associate a task. Capture quick thoughts during focus. Post-session reflection. Desktop browser notification when timer ends.
- **Thought Pool** — Capture ideas instantly. 24-hour cooling period before processing. AI personal insight analysis with psychological depth. Convert thoughts to tasks.
- **Calendar** — Monthly grid with DDL/event highlighting. Create events (exam, deadline, meeting, milestone, personal). Clickable daily stats.
- **Daily Review** — End-of-day three questions: What did I achieve? What emotion was most present? What to adjust tomorrow?
- **AI Insights** — DeepSeek-powered personal insights on your thought patterns (warm, perceptive, psychology-informed). Weekly narrative reports.
- **Global Search** — Ctrl+K to search tasks, thoughts, and calendar events.
- **Dark/Light mode** + 4 accent themes (Default B&W / Moss Green / Cool Blue / Warm Orange)
- **Dual Layout** — Classic 7-page web layout + Mobile sidebar layout (switchable in Settings)
- **Cloud Sync** — Supabase backend. All data syncs across devices with the same account.
- **PWA** — Installable on desktop and mobile browsers.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + Lucide Icons |
| Backend | Supabase (PostgreSQL + Auth + Edge Functions) |
| AI | DeepSeek API (bring your own key) |
| Mobile | Capacitor 8 (Android / iOS) |
| Notifications | Web Notification API + Capacitor Local Notifications |

## Project Structure

```
src/
├── components/
│   ├── AppShell.tsx          # Web classic layout shell
│   ├── Dashboard.tsx         # Web dashboard
│   ├── Tasks.tsx / KanbanBoard.tsx / FocusTimer.tsx
│   ├── ThoughtPool.tsx / CalendarView.tsx / DailyReview.tsx
│   ├── DataManager.tsx       # Web settings & data management
│   ├── SearchModal.tsx       # Global search (Ctrl+K)
│   ├── ui.tsx                # Shared UI primitives
│   └── mobile/
│       ├── MobileApp.tsx     # Mobile sidebar layout shell
│       ├── Sidebar.tsx       # Narrow icon sidebar
│       ├── SidebarLayout.tsx # Sidebar + content container
│       ├── TopBar.tsx        # Mobile top bar
│       ├── BottomSheet.tsx   # Reusable bottom sheet
│       ├── MobileKanban.tsx  # Single-column swipe kanban
│       └── panels/           # 9 panel components
├── hooks/usePersistentApp.ts # Central state + Supabase sync
├── lib/
│   ├── ai.ts                 # AI calls (DeepSeek)
│   ├── auth.ts               # Supabase Auth
│   ├── cloud.ts              # Supabase data sync layer
│   ├── storage.ts            # localStorage + session
│   ├── supabase.ts           # Supabase client singleton
│   ├── notifications.ts      # Capacitor native notifications
│   └── date.ts / id.ts       # Utilities
└── styles.css                # Global styles + theme variables
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Supabase project (free tier works)
- A DeepSeek API key (for AI features)

### Setup
```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/cognitive-workbench.git
cd cognitive-workbench

# 2. Install dependencies
npm install

# 3. Create .env file (see .env.example)
cp .env.example .env
# Edit .env with your Supabase URL and anon key

# 4. Run SQL migrations
# Open Supabase SQL Editor and run:
#   supabase/migrations/001_initial_schema.sql (tables + RLS)
#   supabase/migrations/002_reset_and_create.sql (if reset needed)
#   supabase/migrations/003_ai_usage.sql (AI usage tracking)

# 5. Deploy Edge Functions (optional, for AI with quotas)
# supabase functions deploy summarize-thoughts
# supabase functions deploy weekly-report

# 6. Start dev server
npm run dev

# 7. Open http://localhost:5173
# Register with email + password → enter your DeepSeek API key in Settings → start using!
```

### Mobile App (Android)
```bash
npm run build
npx cap sync android
npx cap open android
# Build APK in Android Studio
```

### Deploy to Netlify
```bash
npm run build
npx netlify deploy --prod --dir=dist
# Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify env vars
```

## Changelog

### v4.0— 2026-06-19

This release transforms the project from a web-only tool into a full cross-platform personal productivity system.

**New Features:**
- 📱 **Mobile sidebar layout** — 9-panel narrow sidebar navigation optimized for one-hand phone use
- 🔍 **Global search** — `Ctrl+K` to search across tasks, thoughts, and calendar events
- 📅 **Calendar event creation** — Add exams, deadlines, meetings, milestones via bottom sheet
- 🔔 **Desktop browser notifications** — Timer end notifications in web browsers
- 🎨 **4 accent themes** — Default B&W, Moss Green, Cool Blue, Warm Orange with live sidebar coloring
- 🏗️ **Dual layout system** — Switch between classic 7-page and mobile sidebar layouts in Settings
- 📊 **Dashboard redesign** — Weekly stats panel replacing standalone timer, compact today's-3-things, integrated countdown
- 💭 **Thought pool UI polish** — Consolidated button row, delete with proper border styling
- ⏱️ **Timer reflection records** — Now show associated task name and duration
- 🗑️ **Cloud sync fix** — Deleted tasks now properly removed from Supabase (upsert + cleanup)
- 🛡️ **Supabase connection timeout** — 3-second graceful fallback to offline mode

**AI Improvements:**
- 🤖 **Rewritten AI prompts** — Personal insight coach with psychological depth, narrative weekly reports with warmth
- 📝 **Thought citation support** — AI responses now reference specific notes with proper formatting

**Bug Fixes:**
- React StrictMode causing infinite "loading" state on sync
- Kanban white-on-white text in light mode
- Task creation Enter-key stale state
- BottomSheet light mode (was dark-only)
- CalendarView CSS specificity for mobile section hiding
- Today state slider touch interaction
- Supabase RLS 409 conflict on upsert

**Infrastructure:**
- 🗄️ Supabase backend replacing Netlify Blobs
- 🔐 Email+password auth replacing pseudo-auth
- ⚡ DeepSeek API integration (user-provided key)

### v1.0 — Initial Release
- 7-page web layout: Dashboard, Tasks, Kanban, Timer, Thoughts, Calendar, Review, Data
- Eisenhower priority matrix
- Pomodoro timer with reflection
- Thought pool with 24h cooling
- Daily energy/mood/focus tracking with trend chart
- Daily review with three questions
- Dark/light theme
- PWA support
- localStorage persistence
- Netlify deployment

## License

MIT
