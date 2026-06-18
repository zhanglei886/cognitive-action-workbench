# 个人认知与行动工作台

> "想法先进池子，行动先做一步。"  
> "没有冲突，不强行深刻。没有行动，不继续分析。"

面向知识工作者和学生的全栈个人效能工具：Eisenhower 优先级任务管理、番茄钟计时+复盘、24小时冷却思考池、每日复盘、日历、AI 个人洞察和周报。支持 Web + Android/iOS（Capacitor）。

**物理系本科生独立开发——献给所有深度思考、审慎行动的人。**

---

## 功能

- **首页** — 本周统计、番茄钟倒计时+任务关联、今日三件事、每日能量/情绪/专注追踪
- **任务** — 创建/编辑/删除、类型、Eisenhower 优先级、截止日期、标签。列表+看板双模式。点击任务打开详细编辑器
- **计时器** — 5/15/25/50 分钟模式、关联任务、计时间快速捕获想法、结束后复盘。桌面浏览器通知
- **思考池** — 即时捕获想法。24h 冷却期再处理。AI 个人洞察分析（带心理学深度）。想法转任务
- **日历** — 月视图带 DDL/事件高亮。创建事项（考试/截止/会议/里程碑/个人）。可点击今日统计弹窗
- **每日复盘** — 每日三问：做成了什么？最明显的情绪？明天微调什么？
- **AI 洞察** — DeepSeek 驱动的个人思考模式分析（温暖、敏锐、结合心理学）。每周叙事型周报
- **全局搜索** — Ctrl+K 搜索任务、想法、日历事件
- **日/夜模式** + 4 种强调色（默认黑白 / 安静绿 / 清爽蓝 / 暖橙）
- **双布局** — 经典 7 页 Web 布局 + 移动端侧边栏布局（设置中切换）
- **云端同步** — Supabase 后端，同账号跨设备自动同步
- **PWA** — 可安装到桌面和手机浏览器

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 18 + TypeScript + Vite |
| 样式 | Tailwind CSS + Lucide 图标 |
| 后端 | Supabase (PostgreSQL + Auth + Edge Functions) |
| AI | DeepSeek API（用户自填 Key） |
| 移动端 | Capacitor 8 (Android / iOS) |
| 通知 | Web Notification API + Capacitor 原生通知 |

## 项目结构

```
src/
├── components/
│   ├── AppShell.tsx          # Web 经典布局壳
│   ├── Dashboard.tsx         # Web 首页
│   ├── Tasks.tsx / KanbanBoard.tsx / FocusTimer.tsx
│   ├── ThoughtPool.tsx / CalendarView.tsx / DailyReview.tsx
│   ├── DataManager.tsx       # Web 设置与数据管理
│   ├── SearchModal.tsx       # 全局搜索 (Ctrl+K)
│   ├── ui.tsx                # 共享 UI 基础组件
│   └── mobile/
│       ├── MobileApp.tsx     # 移动端侧边栏布局壳
│       ├── Sidebar.tsx       # 窄图标侧边栏
│       ├── SidebarLayout.tsx # 侧边栏+内容容器
│       ├── TopBar.tsx        # 移动端顶栏
│       ├── BottomSheet.tsx   # 通用底部弹出面板
│       ├── MobileKanban.tsx  # 单列横滑看板
│       └── panels/           # 9 个功能面板
├── hooks/usePersistentApp.ts # 核心状态管理 + Supabase 同步
├── lib/
│   ├── ai.ts                 # AI 调用（DeepSeek）
│   ├── auth.ts               # Supabase 认证
│   ├── cloud.ts              # Supabase 数据同步层
│   ├── storage.ts            # localStorage + session
│   ├── supabase.ts           # Supabase 客户端单例
│   ├── notifications.ts      # Capacitor 原生通知
│   └── date.ts / id.ts       # 工具函数
└── styles.css                # 全局样式 + 主题变量
```

## 快速开始

### 前置条件
- Node.js 18+ 和 npm
- Supabase 项目（免费额度即可）
- DeepSeek API Key（用于 AI 功能）

### 安装
```bash
# 1. 克隆
git clone https://github.com/YOUR_USERNAME/cognitive-workbench.git
cd cognitive-workbench

# 2. 安装依赖
npm install

# 3. 创建 .env 文件（参考 .env.example）
cp .env.example .env
# 编辑 .env，填入你的 Supabase URL 和 anon key

# 4. 执行 SQL 迁移
# 在 Supabase SQL Editor 中依次运行：
#   supabase/migrations/001_initial_schema.sql（建表 + RLS）
#   supabase/migrations/002_reset_and_create.sql（如需重置）
#   supabase/migrations/003_ai_usage.sql（AI 用量追踪）

# 5. 部署 Edge Functions（可选，用于 AI 配额管理）
# supabase functions deploy summarize-thoughts
# supabase functions deploy weekly-report

# 6. 启动开发服务器
npm run dev

# 7. 打开 http://localhost:5173
# 用邮箱注册 → 在设置中填入 DeepSeek API Key → 开始使用！
```

### 构建 Android App
```bash
npm run build
npx cap sync android
npx cap open android
# 在 Android Studio 中构建 APK
```

### 部署到 Netlify
```bash
npm run build
npx netlify deploy --prod --dir=dist
# 在 Netlify 环境变量中设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY
```

## 更新日志

### v4.0 — 2026-06-19

从纯 Web 工具升级为完整的跨平台个人效能系统。

**新功能：**
- 📱 **移动端侧边栏布局** — 9 面板窄侧边栏，优化单手操作
- 🔍 **全局搜索** — `Ctrl+K` 跨任务/想法/事件搜索
- 📅 **日历事项创建** — 通过底部 Sheet 添加考试/截止/会议/里程碑
- 🔔 **桌面浏览器通知** — 计时结束浏览器弹通知
- 🎨 **4 种强调色** — 默认黑白/安静绿/清爽蓝/暖橙，侧边栏实时变色
- 🏗️ **双布局系统** — 经典 7 页和移动侧边栏，设置中自由切换
- 📊 **首页重设计** — 本周统计+倒计时面板、今日三件事紧凑化
- 💭 **思考池 UI 优化** — 按钮整合到一行、删除统一白框样式
- ⏱️ **计时复盘记录** — 显示关联任务名和时长
- 🗑️ **云端删除同步修复** — 删除任务正确同步到 Supabase
- 🛡️ **Supabase 连接超时** — 3 秒优雅降级离线模式

**AI 改进：**
- 🤖 **AI 提示词重写** — 个人洞察教练（心理学深度）、叙事型周报（温暖风格）
- 📝 **想法引用支持** — AI 回复标注具体想法编号

**Bug 修复：**
- React StrictMode 导致同步永远卡在"正在读取云端"
- 看板亮色模式白字白底
- 任务创建 Enter 键读到旧 state
- BottomSheet 只支持暗色模式
- 日历视图 CSS 选择器覆盖不全
- 今日状态滑块触控不响应
- Supabase RLS 409 冲突

**基础设施：**
- 🗄️ Supabase 替代 Netlify Blobs
- 🔐 邮箱+密码真实认证替代伪认证
- ⚡ DeepSeek API 集成（用户自填 Key）

### v1.0 — 初始版本
- 7 页 Web 布局：首页、任务、看板、计时、思考池、日历、复盘、数据
- Eisenhower 优先级矩阵
- 番茄钟计时+复盘
- 24h 冷却思考池
- 每日状态追踪+趋势图
- 每日复盘三问
- 日/夜主题切换
- PWA 支持
- localStorage 持久化
- Netlify 部署

## 开源协议

MIT
