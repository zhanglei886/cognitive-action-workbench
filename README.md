# Cognitive Action Workbench

A quiet personal workbench for tasks, focus sessions, delayed thought processing, daily review, lightweight planning, and calendar reflection.

The core idea is simple: when a thought interrupts study or work, capture it into the **Thought Pool** first, let it cool down, and return to the current action.

## Features

- Compact four-quadrant dashboard
  - Current focus timer
  - Today Three
  - Daily state with a recent composite-state line chart
  - Upcoming deadlines and events
- Daily state tracking: energy, mood, focus, and fatigue
- Start-day and close-day flows
- Task system with next actions, task types, completion, tags, deadlines, pinning, and Today Three
- Collapsible task next actions and Event notes to keep the task page short
- Task pagination with 4 tasks per page
- Kanban board for urgent-important, important-not-urgent, and not-important-not-urgent tasks
- Long-term planning in the Review page, with compact paginated planning cards
- Focus timer with 15 / 25 / 50 / 5 minute modes
- Quick "drop into thought pool" capture while timing
- Timer keeps correct elapsed time after switching away from the page
- End-of-session reflection
- Thought Pool with 24-hour cooling, ready / processed / discarded states
- Thought Pool pagination, conversion to tasks, and permanent delete
- AI Thought Pool summary with Markdown rendering and paginated summary history
- Weekly AI report history in the Review page
- Daily lightweight review
- Calendar view with:
  - Consistent date cells
  - Activity, focus, DDL, and Event markers
  - Combined DDL/Event day items
  - Task progress time even when a task is not completed
- Export / import JSON
- PWA support for mobile installation
- Dark mode
- Lightweight name + password-phrase login
- Netlify static hosting + Netlify Functions + Netlify Blobs sync
- Qwen / DashScope-compatible AI support

## Tech Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- Netlify Functions
- Netlify Blobs
- PWA Service Worker

## Lightweight Login

This project uses a lightweight login model:

- Users enter a name and a password phrase.
- No registration is required.
- The password phrase is not stored on the server.
- The app derives a sync key from `name + password phrase`.
- Same name + same password phrase opens the same cloud data space.
- Same name + different password phrase opens a different cloud data space.

This is meant for lightweight personal use. It is not a full authentication system. Do not store highly sensitive data.

## AI Summary

AI summary uses Qwen through DashScope's OpenAI-compatible endpoint:

```text
https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
```

Users can enter their own Qwen API key in the app's settings/data page. The key is stored only in the current browser's `localStorage` and is sent to the Netlify Function only when an AI feature is requested.

You can also set fallback server-side keys in Netlify:

```text
DASHSCOPE_API_KEY=your_key
QWEN_MODEL=qwen-turbo
QWEN_TIMEOUT_MS=30000
QWEN_MAX_ATTEMPTS=3
```

## Local Development

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Build:

```bash
npm run build
```

## Deploy to Netlify

Connect this repository to Netlify. The project includes `netlify.toml`, so Netlify should detect:

```text
Build command: npm run build
Publish directory: dist
Functions directory: netlify/functions
```

Netlify Blobs is used for cloud sync. Each derived login key stores one JSON document.

## Security Notes

- Do not commit API keys.
- Do not commit `.env` files.
- Qwen API keys entered by users are saved only in the user's browser.
- The password phrase is used to derive a sync key but is not a substitute for a real account system.
- Anyone who knows the same name and password phrase can access the same synced data.

## License

MIT
