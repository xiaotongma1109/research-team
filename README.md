# 研队 - 校内科研组队平台

校内科研组队平台，帮助学生找到志同道合的队友，帮助导师高效招募研究助手。

## 快速开始

### 1. 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com) 注册并创建新项目
2. 进入 SQL Editor，粘贴 `supabase/schema.sql` 的内容并执行
3. 在 Settings > API 中获取 Project URL 和 anon key

### 2. 配置环境变量

```bash
cp .env.local.example .env.local
```

编辑 `.env.local`，填入你的 Supabase 信息：

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx...
```

### 3. 安装依赖并启动

```bash
npm install
npm run dev
```

访问 http://localhost:3000

### 4. 测试注册

使用预置的邀请码注册：`RESEARCH2024A`、`TEAM-ALPHA` 等（见 schema.sql）

## 技术栈

- **框架**: Next.js 14 (App Router)
- **样式**: Tailwind CSS
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth
- **部署**: Vercel

## 项目结构

```
research-team/
├── app/                    # 页面和API路由
│   ├── auth/               # 登录注册
│   ├── post/               # 帖子（发布/详情）
│   ├── profile/            # 个人主页
│   ├── notifications/      # 消息通知
│   └── api/                # API路由
├── components/             # 可复用组件
├── lib/                    # 工具库（Supabase客户端、类型定义）
├── supabase/               # 数据库迁移脚本
└── middleware.ts           # Auth中间件
```

## 部署到 Vercel

1. 推送代码到 GitHub
2. 在 Vercel 中 Import 项目
3. 添加环境变量（同 .env.local）
4. 点击 Deploy

## 下一步迭代

- [ ] AI 智能推荐（基于 Embedding 的语义匹配）
- [ ] 站内即时聊天
- [ ] 微信小程序版本
- [ ] 管理后台
- [ ] 评价/信誉系统
