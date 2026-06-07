# 个人认知与行动工作台

一个安静、低刺激的个人工作台，用来管理任务、专注计时、思考池、每日复盘和日历回看。

核心思路是：学习或工作时突然冒出的想法，不要立刻展开，先丢进 **思考池**，经过冷却后再处理，把行动和分析分流。

## 功能

- Dashboard 首页：精力、情绪、专注、疲劳状态和简单建议
- 任务系统：下一步动作、任务类型、完成状态、今日三件事
- 专注计时器：15 / 25 / 50 / 5 分钟模式
- 计时中快速“丢进思考池”
- 计时结束轻复盘
- 思考池：24 小时冷却、可处理、已处理、废弃
- 想法转任务
- 想法删除功能
- 每日轻复盘
- 日历：按日期查看当天完成任务和捕获的想法
- JSON 导入 / 导出
- PWA：手机可添加到主屏幕
- 暗色模式
- Netlify 静态托管 + Netlify Functions + Netlify Blobs 云同步
- 千问 / DashScope AI 总结思考池

## 技术栈

- Vite
- React
- TypeScript
- Tailwind CSS
- Netlify Functions
- Netlify Blobs
- PWA Service Worker

## 轻量登录方式

这个项目使用的是轻量登录：

- 用户输入名字和密码短语
- 不需要注册
- 密码短语不会上传保存到服务器
- 应用会根据 `名字 + 密码短语` 生成同步身份
- 同一个名字 + 同一个密码短语，会进入同一份云端数据
- 同一个名字 + 不同密码短语，会进入不同数据空间

注意：这不是完整账号系统，只适合轻量个人使用。请不要存放高度敏感的数据。

## AI 总结

AI 总结使用千问 DashScope 兼容模式接口：

```text
https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
```

用户可以在应用的“数据”页面填写自己的千问 API Key。这个 Key 只保存在当前浏览器的 `localStorage`，只有点击 AI 总结时才会临时发送给 Netlify Function。

也可以在 Netlify 里配置备用环境变量：

```text
DASHSCOPE_API_KEY=你的千问 API Key
QWEN_MODEL=qwen-turbo
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

- 用户输入的千问 API Key 只保存在用户自己的浏览器里
- 密码短语只用于生成同步身份，不等同于正式账号密码系统
- 知道同一组名字和密码短语的人，可以访问同一份同步数据

## License

MIT
