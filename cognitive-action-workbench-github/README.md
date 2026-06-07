# Cognitive Action Workbench

A quiet personal workbench for tasks, focus sessions, delayed thought processing, daily review, and lightweight calendar reflection.

The core idea is simple: when a thought interrupts study or work, capture it into a **Thought Pool** first, let it cool down, and return to the current action.

## Features

- Dashboard with daily energy, mood, focus, fatigue, and simple suggestions
- Task system with next actions, task types, completion, and "Today Three"
- Focus timer with 15 / 25 / 50 / 5 minute modes
- Quick "drop into thought pool" capture while timing
- End-of-session reflection
- Thought Pool with 24-hour cooling, ready / processed / discarded states
- Convert thoughts into tasks
- Delete thoughts when they should be removed entirely
- Daily lightweight review
- Calendar view for completed tasks and captured thoughts by day
- Export / import JSON
- PWA support for mobile installation
- Dark mode
- Netlify static hosting + Netlify Functions + Netlify Blobs sync
- Qwen / DashScope-compatible AI summary for Thought Pool

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

By default, the user can enter their own Qwen API key in the app's Data page. The key is stored only in the current browser's `localStorage` and is sent to the Netlify Function only when AI summary is requested.

You can also set a fallback server-side key in Netlify:

```text
DASHSCOPE_API_KEY=your_key
QWEN_MODEL=qwen-turbo
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
