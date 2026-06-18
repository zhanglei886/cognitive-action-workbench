# 认知工作台 — Supabase 迁移设置指南

## 你已完成

所有代码改动已就绪并通过编译。以下是 7 个改动：

| 文件 | 改动 |
|------|------|
| `supabase/migrations/001_initial_schema.sql` | 建表 SQL（10 张表 + RLS 策略 + 索引） |
| `src/lib/supabase.ts` | Supabase 客户端单例 |
| `src/lib/database.types.ts` | TypeScript Database 类型定义 |
| `src/lib/auth.ts` | Supabase Auth 认证封装（注册/登录/重置密码） |
| `src/components/Login.tsx` | 全新登录页（email + password + 注册 + 找回密码） |
| `src/hooks/usePersistentApp.ts` | 状态管理层（Supabase sync + localStorage 离线缓存） |
| `src/lib/cloud.ts` | Supabase 数据拉取/推送（替换 Netlify Blobs） |
| `src/lib/ai.ts` | AI 调用改为 Supabase Edge Functions |
| `supabase/functions/summarize-thoughts/index.ts` | AI 总结 Edge Function |
| `supabase/functions/weekly-report/index.ts` | 周报 Edge Function |
| `src/components/DataManager.tsx` | 添加旧版数据迁移功能 |
| `src/lib/storage.ts` | 适配新 UserSession，保留旧数据读取 |
| `src/App.tsx` | 适配新的 UserSession + userId |

## 你需要做的

### 1. 创建 Supabase 项目（5 分钟）

1. 访问 https://supabase.com → 注册/登录
2. 创建新项目：名称 `cognitive-workbench`，密码自己记住
3. 等待数据库初始化完成（约 2 分钟）

### 2. 执行建表 SQL

1. 在 Supabase 面板左侧 → SQL Editor
2. 新建查询，粘贴 `supabase/migrations/001_initial_schema.sql` 的全部内容
3. 点击 Run

### 3. 配置环境变量

1. 在 Supabase 面板 → Settings → API
2. 复制 `Project URL` 和 `anon public` key
3. 在项目根目录创建 `.env` 文件：

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 4. 启用 Email Auth

1. Supabase 面板 → Authentication → Providers
2. 确保 Email 提供商已启用
3. （可选）关闭 "Confirm email" 以简化注册流程

### 5. 部署 Edge Functions（需要 Supabase CLI）

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录
supabase login

# 初始化（在项目目录）
supabase init

# 链接到你的项目
supabase link --project-ref <your-project-ref>

# 设置千问 API Key 环境变量
supabase secrets set DASHSCOPE_API_KEY=sk-xxxxxxxx

# 部署两个 Edge Function
supabase functions deploy summarize-thoughts
supabase functions deploy weekly-report
```

### 6. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173 → 应该看到新的登录页面 → 注册账号 → 进入工作台。

### 7. 迁移旧数据

登录后 → 进入"数据与设置"页面 → 如果检测到旧版 localStorage 数据，会出现"迁移旧版数据到云端"按钮 → 点击即可。

## 注意事项

- **Netlify 部署不受影响** — 旧版网站仍然可以运行，直到你决定完全切换
- **旧版 localStorage 数据不会被删除** — 迁移只读取，不删除旧数据
- **Supabase 免费额度**：500MB 数据库 + 50,000 月活用户 + 200 万次 Edge Function 调用，足够初期使用
- **千问 API Key** 存在 Supabase 环境变量中，Pro 用户使用你的 key 调用 AI（后期实现）

## 下一步（Phase 2-4）

见 `C:\Users\Lenovo\.claude\plans\elegant-gliding-corbato.md` 中的完整计划。
