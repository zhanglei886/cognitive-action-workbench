# 个人认知与行动工作台

一个安静、低刺激的个人工作台，用来管理任务、专注计时、思考池、每日复盘、长期规划和日历回看。

核心思路是：学习或工作时突然冒出的想法，不要立刻展开，先丢进 **思考池**，经过冷却后再处理，把行动和分析分流。

## 功能

- 四象限首页
  - 当前计时器
  - 今日三件事
  - 今日状态与近日综合状态折线图
  - 近期 DDL / Event
- 今日状态：精力、情绪、专注、疲劳
- 开始今日 / 收工模式
- 任务系统：下一步动作、任务类型、完成状态、标签、DDL、置顶、今日三件事
- 任务下一步动作和 Event 备注支持折叠，减少页面高度
- 任务列表 4 条一页分页
- 任务看板：紧急且重要、不紧急但重要、不重要且不紧急
- 复盘页长期规划：紧凑卡片、分页、可转任务
- 专注计时器：15 / 25 / 50 / 5 分钟模式
- 计时中快速“丢进思考池”
- 计时器离开页面后仍按真实时间继续计算
- 计时结束轻复盘
- 思考池：24 小时冷却、可处理、已处理、废弃、永久删除
- 思考池分页、想法转任务
- AI 思考池总结：Markdown 显示、总结历史翻页
- 复盘页 AI 周报与历史记录
- 每日轻复盘
- 日历视图：
  - 日期格大小一致
  - 活动、专注、DDL、Event 标记
  - 当天 DDL 和 Event 合并展示
  - 即使任务未完成，也能显示当天对该任务推进了多久
- JSON 导入 / 导出
- PWA：手机可添加到主屏幕
- 暗色模式
- 轻量名字 + 密码短语登录
- Netlify 静态托管 + Netlify Functions + Netlify Blobs 云同步
- 千问 / DashScope 兼容 AI 功能

## 技术栈

- Vite
- React
- TypeScript
- Tailwind CSS
- Netlify Functions
- Netlify Blobs
- PWA Service Worker

## 轻量登录方式

这个项目使用轻量登录：

- 用户输入名字和密码短语。
- 不需要注册。
- 密码短语不会上传保存到服务器。
- 应用会根据 `名字 + 密码短语` 生成同步身份。
- 同一个名字 + 同一个密码短语，会进入同一份云端数据。
- 同一个名字 + 不同密码短语，会进入不同数据空间。

注意：这不是完整账号系统，只适合轻量个人使用。请不要存放高度敏感的数据。

## AI 总结

AI 功能使用千问 DashScope 兼容模式接口：

```text
https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
```

用户可以在应用的设置/数据页面填写自己的千问 API Key。这个 Key 只保存在当前浏览器的 `localStorage`，只有点击 AI 功能时才会临时发送给 Netlify Function。

也可以在 Netlify 里配置备用环境变量：

```text
DASHSCOPE_API_KEY=你的千问 API Key
QWEN_MODEL=qwen-turbo
QWEN_TIMEOUT_MS=30000
QWEN_MAX_ATTEMPTS=3
```

## 本地运行

安装依赖：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

构建：

```bash
npm run build
```

## 部署到 Netlify

把这个仓库连接到 Netlify。项目已经包含 `netlify.toml`，通常会自动识别：

```text
Build command: npm run build
Publish directory: dist
Functions directory: netlify/functions
```

云同步使用 Netlify Blobs。每个登录身份对应一份 JSON 数据。

## 安全说明

- 不要提交 API Key。
- 不要提交 `.env` 文件。
- 用户输入的千问 API Key 只保存在用户自己的浏览器里。
- 密码短语只用于生成同步身份，不等同于正式账号密码系统。
- 知道同一组名字和密码短语的人，可以访问同一份同步数据。

## License

MIT
