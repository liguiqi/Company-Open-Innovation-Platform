# H&T Open Innovation Platform — 项目架构说明文档

> **文档版本**: v1.0
> **创建日期**: 2026-04-14
> **项目代号**: `innovation-platform`
> **访问地址**: https://innovation.example.com
> **作者**: Platform Team

---

## 1. 项目概述

### 1.1 项目定位

本项目是深圳Open Innovation智能控制股份有限公司（002402.SZ）面向全球电子产业链合作伙伴的 **开放创新平台**。平台承载四项核心业务能力：技术需求发布与对接、创新方案在线提交与评审、生态合作伙伴目录管理、联合创新案例展示。平台目标是加速公司从 OEM 向 ODM 高端解决方案转型过程中的外部技术寻源与协同创新效率。

### 1.2 核心业务模块

平台由五个面向用户的业务模块和一个管理后台组成。**技术需求大厅**向公众展示当前面临的技术挑战，支持按领域（电机控制、传感器、新材料、AI 与算法）筛选，每条需求包含优先级标识、需求编号、所属产品线及详细描述。**创新方案提交**允许注册用户针对具体需求或开放自荐方式在线提交技术方案，支持附件上传（TXT/PDF/PPT/Word/ZIP/RAR，最大 100MB），提交后进入内部评审流程。**生态伙伴目录**展示按层级分类的合作伙伴（金牌战略伙伴、认证伙伴等），支持按技术领域（核心计算芯片、功率与电源、连接与传感、产学研机构）分类浏览。**联合创新案例**以图文详情页形式展示历史合作成功案例，包含合作伙伴信息、技术亮点及可下载的技术白皮书。**合作流程**以可视化四步流程（提交方案→技术评估→PoC 验证→导入供应链）引导潜在合作伙伴理解合作路径。**管理后台**基于 Payload CMS Admin Panel，供内部运营人员管理全部内容数据、用户权限及方案审核流转。

### 1.3 目标用户角色

平台服务四类用户。**访客**（未登录）可浏览技术需求、生态伙伴目录、创新案例及合作流程页面。**合作伙伴**（注册用户，角色 `partner`）可提交创新方案、管理已提交方案、上传资料附件。**评审员**（内部人员，角色 `reviewer`）可查看所有提交方案、推进方案状态流转（pending → reviewing → approved / rejected）、添加评审意见。**管理员**（角色 `admin`）拥有全部权限，可管理用户与用户组、编辑所有内容、配置系统参数。

---

## 2. 技术栈选型

### 2.1 核心技术栈

| 层级     | 技术选型             | 版本             | 选型理由                                                                    |
| -------- | -------------------- | ---------------- | --------------------------------------------------------------------------- |
| 框架     | Next.js (App Router) | 16.2.x           | 全栈 React 框架，SSR/SSG/ISR 灵活渲染，与 Payload CMS 原生集成              |
| 后端/CMS | Payload CMS          | 3.81.x (≥3.79.1) | 直接嵌入 Next.js，TypeScript 原生，自带 Admin Panel、RBAC、REST/GraphQL API |
| 语言     | TypeScript           | 5.x              | 全栈类型安全                                                                |
| UI 组件  | shadcn/ui (CLI v4)   | 最新             | 基于 Radix UI，Tailwind CSS 原子化样式，按需安装，支持高度定制              |
| 样式     | Tailwind CSS         | 4.x              | 与现有 HTML 原型完全兼容，零迁移成本                                        |
| 数据库   | PostgreSQL           | 16.x             | Payload 官方推荐的生产级关系型数据库                                        |
| 运行时   | Node.js              | 20.x LTS         | Payload 3.x 要求 Node.js ≥ 18                                               |
| 包管理   | pnpm                 | 9.x              | Payload 官方推荐，安装速度与磁盘效率最优                                    |

### 2.2 基础设施与服务

| 组件      | 技术选型                           | 用途                                                  |
| --------- | ---------------------------------- | ----------------------------------------------------- |
| 反向代理  | Nginx                              | SSL 终止、静态资源缓存、WebSocket 代理                |
| SSL 证书  | `*.example.com` 泛域名证书 | 内网 HTTPS 访问                                       |
| 缓存/会话 | Redis                              | 短信验证码存储（TTL 5 分钟）、会话缓存                |
| 短信服务  | 阿里云 SMS                         | 手机号注册/登录验证码发送                             |
| 邮件服务  | 企业邮箱（已适配）                 | 邮箱注册验证、密码重置、方案状态通知                  |
| 文件存储  | Payload Upload (本地磁盘)          | 方案附件、伙伴 Logo、案例封面图。生产环境可迁移至 OSS |

### 2.3 开发工具链

| 工具                      | 用途                                                |
| ------------------------- | --------------------------------------------------- |
| GitHub Copilot Pro+ (CLI) | 实时代码补全、行级辅助、上下文感知的 Bug 修复       |
| GitHub Codex (CLI)        | 批量模块生成、HTML→JSX 迁移、Collection Schema 生成 |
| OxLint + Oxfmt            | 代码质量检查与格式化                                |
| Husky + lint-staged       | Git 提交前自动 lint/format                          |
| Docker Compose            | 本地 PostgreSQL + Redis 一键启动                    |

---

## 3. 系统架构

### 3.1 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                      浏览器客户端                         │
│         https://innovation.example.com          │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS (443)
                           ▼
┌──────────────────────────────────────────────────────────┐
│                    Nginx 反向代理                         │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ SSL 终止     │  │ 静态资源缓存  │  │ WebSocket 代理 │  │
│  │ (泛域名证书) │  │ /_next/static│  │ HMR / 实时通知 │  │
│  └─────────────┘  └──────────────┘  └────────────────┘  │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP (3000)
                           ▼
┌──────────────────────────────────────────────────────────┐
│              Next.js 16 + Payload CMS 3.81               │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │                  App Router 路由层                   │  │
│  │                                                    │  │
│  │  (public)/          (auth)/         (dashboard)/   │  │
│  │  ├─ page.tsx        ├─ login/      ├─ dashboard/   │  │
│  │  ├─ needs/          ├─ register/   ├─ proposals/   │  │
│  │  ├─ ecosystem/      └─ verify/     ├─ partners/    │  │
│  │  ├─ cases/                         └─ settings/    │  │
│  │  └─ process/                                       │  │
│  │                                                    │  │
│  │  (admin)/           api/                           │  │
│  │  └─ admin/          ├─ sms/send/                   │  │
│  │     └─ [[...]]      ├─ sms/verify/                 │  │
│  │                     └─ [...payload]/                │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │              Payload CMS 核心层                      │  │
│  │                                                    │  │
│  │  Collections:                                      │  │
│  │  ├─ Users (认证 + RBAC)                            │  │
│  │  ├─ UserGroups (用户组)                             │  │
│  │  ├─ TechNeeds (技术需求)                            │  │
│  │  ├─ Proposals (创新方案)                            │  │
│  │  ├─ Partners (生态伙伴)                             │  │
│  │  ├─ CaseStudies (创新案例)                          │  │
│  │  └─ Media (文件上传)                                │  │
│  │                                                    │  │
│  │  Services:                                         │  │
│  │  ├─ Auth (Email + SMS OTP Custom Strategy)         │  │
│  │  ├─ Access Control (Collection + Field Level)      │  │
│  │  ├─ Hooks (提交通知/状态变更邮件)                    │  │
│  │  └─ Admin Panel (/admin)                           │  │
│  └────────────────────────────────────────────────────┘  │
└──────┬──────────────────┬────────────────┬───────────────┘
       │                  │                │
       ▼                  ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
│ PostgreSQL   │  │    Redis     │  │   外部服务        │
│ 16.x        │  │  验证码缓存   │  │  ├─ 阿里云 SMS   │
│ 业务数据存储  │  │  会话缓存    │  │  └─ 企业邮箱 SMTP │
└──────────────┘  └──────────────┘  └──────────────────┘
```

### 3.2 请求处理流程

公开页面请求的处理路径为：浏览器发起 HTTPS 请求 → Nginx 终止 SSL 并转发至 localhost:3000 → Next.js App Router 匹配 `(public)` 路由组 → Server Component 通过 Payload Local API 直接查询数据库 → 服务端渲染 HTML 返回。这里使用的是 Payload 的 Local API（非 HTTP API），没有网络开销，性能等同于直接数据库查询。

认证请求的处理路径为：用户在登录页输入手机号 → 前端调用 `/api/sms/send` 发送验证码 → 服务端通过阿里云 SMS SDK 发送短信并将验证码写入 Redis（TTL 300 秒）→ 用户输入验证码 → 前端调用 `/api/sms/verify` → 服务端从 Redis 校验验证码 → 校验通过后调用 Payload 的 `payload.login()` 或创建用户并签发 JWT → 前端通过 httpOnly Cookie 持有 `payload-token`。

受保护页面的请求路径为：浏览器携带 Cookie 请求 `/dashboard/*` → Next.js Middleware 检查 `payload-token` 是否存在 → 不存在则 302 重定向至 `/login` → 存在则放行 → Server Component 通过 Payload Local API 获取当前用户信息及授权数据 → 渲染页面。

---

## 4. 目录结构

```
innovation-platform/
├── src/
│   ├── app/                                    # Next.js App Router
│   │   ├── (public)/                           # 公开页面路由组
│   │   │   ├── layout.tsx                      # 公开页面布局（Header + Footer + 导航）
│   │   │   ├── page.tsx                        # 首页 /
│   │   │   ├── needs/
│   │   │   │   ├── page.tsx                    # 技术需求大厅 /needs
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx                # 需求详情 /needs/RD-2026-001
│   │   │   ├── ecosystem/
│   │   │   │   └── page.tsx                    # 生态伙伴目录 /ecosystem
│   │   │   ├── cases/
│   │   │   │   ├── page.tsx                    # 创新案例列表 /cases
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx                # 案例详情 /cases/foc-washing-machine
│   │   │   └── process/
│   │   │       └── page.tsx                    # 合作流程 /process
│   │   │
│   │   ├── (auth)/                             # 认证页面路由组
│   │   │   ├── layout.tsx                      # 认证页面布局（极简，仅 Logo）
│   │   │   ├── login/
│   │   │   │   └── page.tsx                    # 登录（邮箱/手机号切换）
│   │   │   ├── register/
│   │   │   │   └── page.tsx                    # 注册
│   │   │   └── verify/
│   │   │       └── page.tsx                    # 验证码校验
│   │   │
│   │   ├── (dashboard)/                        # 登录后管理页面路由组
│   │   │   ├── layout.tsx                      # 后台布局（Sidebar + TopBar）
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx                    # 仪表盘概览
│   │   │   ├── proposals/
│   │   │   │   ├── page.tsx                    # 方案列表（我的方案 / 全部方案）
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx                # 提交新方案
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx                # 方案详情 / 编辑 / 审核
│   │   │   ├── partners/
│   │   │   │   └── page.tsx                    # 伙伴管理（admin）
│   │   │   ├── users/
│   │   │   │   └── page.tsx                    # 用户与用户组管理（admin）
│   │   │   └── settings/
│   │   │       └── page.tsx                    # 个人设置
│   │   │
│   │   ├── (admin)/                            # Payload Admin Panel
│   │   │   └── admin/
│   │   │       └── [[...segments]]/
│   │   │           ├── page.tsx
│   │   │           └── not-found.tsx
│   │   │
│   │   ├── api/                                # API Routes
│   │   │   ├── sms/
│   │   │   │   ├── send/route.ts               # POST: 发送短信验证码
│   │   │   │   └── verify/route.ts             # POST: 校验验证码并签发 Token
│   │   │   └── [...payload]/route.ts           # Payload REST API 透传
│   │   │
│   │   ├── layout.tsx                          # 根布局（全局字体、Providers、metadata）
│   │   ├── not-found.tsx                       # 全局 404
│   │   └── middleware.ts                       # 路由保护中间件
│   │
│   ├── collections/                            # Payload Collection 定义
│   │   ├── Users.ts
│   │   ├── UserGroups.ts
│   │   ├── TechNeeds.ts
│   │   ├── Proposals.ts
│   │   ├── Partners.ts
│   │   ├── CaseStudies.ts
│   │   └── Media.ts
│   │
│   ├── access/                                 # 权限控制函数
│   │   ├── isAdmin.ts
│   │   ├── isAdminOrReviewer.ts
│   │   ├── isOwnerOrAdmin.ts
│   │   └── isAuthenticated.ts
│   │
│   ├── hooks/                                  # Payload Hooks
│   │   ├── sendProposalNotification.ts         # 方案提交后邮件通知评审员
│   │   ├── onProposalStatusChange.ts           # 方案状态变更通知提交人
│   │   └── generateNeedId.ts                   # 自动生成需求编号 RD-YYYY-NNN
│   │
│   ├── services/                               # 外部服务封装
│   │   ├── aliyun-sms.ts                       # 阿里云短信 SDK 封装
│   │   ├── email.ts                            # 邮件发送封装
│   │   └── redis.ts                            # Redis 客户端（ioredis）
│   │
│   ├── components/                             # 共享 UI 组件
│   │   ├── ui/                                 # shadcn/ui 组件（自动生成）
│   │   ├── layout/
│   │   │   ├── Header.tsx                      # 公开页面顶栏导航
│   │   │   ├── Footer.tsx                      # 公开页面底部
│   │   │   ├── Sidebar.tsx                     # 后台侧边栏
│   │   │   └── TopBar.tsx                      # 后台顶栏
│   │   ├── needs/
│   │   │   ├── NeedCard.tsx                    # 需求卡片
│   │   │   └── NeedFilters.tsx                 # 需求筛选标签
│   │   ├── proposals/
│   │   │   ├── ProposalForm.tsx                # 方案提交表单
│   │   │   └── ProposalStatusBadge.tsx         # 方案状态标签
│   │   ├── partners/
│   │   │   ├── PartnerGrid.tsx                 # 伙伴 Logo 网格
│   │   │   └── PartnerCategoryCard.tsx         # 伙伴分类卡片
│   │   └── shared/
│   │       ├── HeroBanner.tsx                  # 首页 Hero 横幅
│   │       ├── StatsBar.tsx                    # 数据统计条
│   │       └── ProcessTimeline.tsx             # 四步流程时间线
│   │
│   ├── lib/                                    # 工具库
│   │   ├── payload.ts                          # Payload 客户端初始化
│   │   ├── validations.ts                      # Zod Schema 定义
│   │   └── constants.ts                        # 枚举常量（角色、状态、分类）
│   │
│   └── types/                                  # TypeScript 类型定义
│       └── index.ts                            # Payload 自动生成类型的补充
│
├── public/                                     # 静态资源
│   ├── logo.svg
│   ├── og-image.png                            # Open Graph 分享图
│   └── favicon.ico
│
├── docker-compose.yml                          # 本地开发：PostgreSQL + Redis
├── nginx/
│   └── innovation.example.com.conf     # Nginx 站点配置
├── payload.config.ts                           # Payload 主配置
├── next.config.mjs                             # Next.js 配置
├── tailwind.config.ts                          # Tailwind 配置（H&T 品牌色）
├── .env.local                                  # 本地环境变量（不入库）
├── .env.example                                # 环境变量模板
├── tsconfig.json
├── package.json
└── README.md
```

---

## 5. 数据模型设计

### 5.1 Collections 总览

```
┌─────────────┐     ┌──────────────┐
│  UserGroups  │◄────│    Users     │
│             │     │  (Auth集合)   │
└─────────────┘     └──────┬───────┘
                           │ 1:N (提交人)
                           ▼
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  TechNeeds  │◄────│  Proposals   │────►│    Media     │
│  (技术需求)  │ N:1 │  (创新方案)   │ 1:N │  (文件上传)   │
└─────────────┘     └──────────────┘     └──────────────┘

┌─────────────┐     ┌──────────────┐
│  Partners   │     │ CaseStudies  │
│  (生态伙伴)  │     │  (创新案例)   │
└─────────────┘     └──────────────┘
```

### 5.2 各 Collection 字段定义

**Users**（认证集合）

| 字段名    | 类型                      | 必填 | 说明                                                             |
| --------- | ------------------------- | ---- | ---------------------------------------------------------------- |
| email     | email                     | 是   | 登录邮箱（Payload 内建）                                         |
| phone     | text                      | 否   | 手机号，unique + index，短信登录标识                             |
| name      | text                      | 是   | 姓名                                                             |
| company   | text                      | 否   | 公司名称                                                         |
| role      | select                    | 是   | 枚举：`admin` / `reviewer` / `partner` / `viewer`，默认 `viewer` |
| userGroup | relationship → UserGroups | 否   | 所属用户组                                                       |
| avatar    | upload → Media            | 否   | 头像                                                             |

**UserGroups**（用户组）

| 字段名      | 类型     | 必填 | 说明                                   |
| ----------- | -------- | ---- | -------------------------------------- |
| name        | text     | 是   | 组名（如"技术评审委员会"、"战略伙伴"） |
| description | textarea | 否   | 组描述                                 |
| permissions | json     | 否   | 扩展权限标记（预留）                   |

**TechNeeds**（技术需求）

| 字段名      | 类型     | 必填 | 说明                                                                         |
| ----------- | -------- | ---- | ---------------------------------------------------------------------------- |
| needId      | text     | 是   | 需求编号，如 `RD-2026-001`，由 Hook 自动生成                                 |
| title       | text     | 是   | 需求标题                                                                     |
| priority    | select   | 是   | 枚举：`urgent`（急需解决）/ `open`（开放探索）/ `joint-research`（联合预研） |
| domain      | select   | 是   | 枚举：`motor-control` / `sensor` / `materials` / `ai`                        |
| productLine | text     | 否   | 所属产品线（如"工业无人机"、"智能家电"）                                     |
| description | richText | 是   | 需求详细描述                                                                 |
| status      | select   | 是   | 枚举：`open` / `in-progress` / `closed`，默认 `open`                         |
| publishedAt | date     | 否   | 发布日期                                                                     |

**Proposals**（创新方案）

| 字段名         | 类型                     | 必填 | 说明                                                                    |
| -------------- | ------------------------ | ---- | ----------------------------------------------------------------------- |
| title          | text                     | 是   | 方案标题                                                                |
| type           | select                   | 是   | 枚举：`specific-need` / `open-proposal` / `investment` / `partnership`  |
| relatedNeed    | relationship → TechNeeds | 否   | 关联的技术需求（type 为 specific-need 时）                              |
| description    | richText                 | 是   | 技术优势、TRL 成熟度、竞品差异等                                        |
| attachments    | array of upload → Media  | 否   | 附件（PDF/PPT/Word）                                                    |
| submittedBy    | relationship → Users     | 是   | 提交人（自动关联当前登录用户）                                          |
| contactName    | text                     | 是   | 联系人姓名                                                              |
| contactEmail   | email                    | 是   | 联系人邮箱                                                              |
| contactCompany | text                     | 是   | 公司名称                                                                |
| status         | select                   | 是   | 枚举：`pending` / `reviewing` / `approved` / `rejected`，默认 `pending` |
| reviewNotes    | richText                 | 否   | 评审意见（仅 admin/reviewer 可见可编辑）                                |
| reviewedBy     | relationship → Users     | 否   | 评审人                                                                  |

**Partners**（生态伙伴）

| 字段名      | 类型           | 必填 | 说明                                                                  |
| ----------- | -------------- | ---- | --------------------------------------------------------------------- |
| name        | text           | 是   | 伙伴名称                                                              |
| logo        | upload → Media | 否   | Logo 图片                                                             |
| website     | text           | 否   | 官网链接                                                              |
| category    | select         | 是   | 枚举：`chip` / `power` / `connectivity` / `academia`                  |
| tier        | select         | 是   | 枚举：`strategic`（金牌战略）/ `certified`（认证）/ `general`（一般） |
| description | textarea       | 否   | 伙伴简介                                                              |
| products    | text           | 否   | 代表产品/技术（如"MCU, DSP, FPGA"）                                   |
| sortOrder   | number         | 否   | 排序权重                                                              |

**CaseStudies**（联合创新案例）

| 字段名        | 类型           | 必填 | 说明                                                     |
| ------------- | -------------- | ---- | -------------------------------------------------------- |
| title         | text           | 是   | 案例标题                                                 |
| slug          | text           | 是   | URL 标识，unique                                         |
| partnerName   | text           | 是   | 合作伙伴展示名（如"Partner A (Chip Vendor)"）            |
| coverImage    | upload → Media | 是   | 封面图                                                   |
| summary       | textarea       | 是   | 摘要（列表页展示）                                       |
| content       | richText       | 是   | 完整案例正文                                             |
| whitePaperUrl | text           | 否   | 技术白皮书下载链接                                       |
| domain        | select         | 是   | 所属领域：`home-appliance` / `power-tool` / `automotive` |
| publishedAt   | date           | 是   | 发布日期                                                 |

**Media**（文件上传，Payload 内建 Upload Collection）

| 配置项    | 值                                                                                                                                     |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| mimeTypes | `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.*`, `application/vnd.ms-powerpoint`, `image/*` |
| staticDir | `./media`                                                                                                                              |
| maxSize   | 100MB（附件），5MB（图片）                                                                                                             |

---

## 6. 认证与权限体系

### 6.1 认证方式

平台支持两种并行的认证方式。**邮箱密码认证**使用 Payload 内建的 Local Strategy，用户注册时填写邮箱和密码，系统通过已适配的企业邮箱 SMTP 发送验证链接，点击验证后激活账户。**手机短信验证码认证**通过 Payload Custom Auth Strategy 实现，流程为：用户输入手机号 → 调用 `/api/sms/send` → 服务端生成 6 位随机验证码 → 通过阿里云 SMS SDK 发送 → 验证码以 `sms:otp:{phone}` 为 key 写入 Redis（TTL 300 秒）→ 用户输入验证码 → 调用 `/api/sms/verify` → 服务端从 Redis 校验 → 通过则查找或创建用户 → 调用 Payload 签发 JWT → 以 httpOnly Cookie（`payload-token`）返回。

### 6.2 路由保护

Next.js Middleware 在请求到达页面组件前拦截未认证访问。保护策略为：`/dashboard/*` 和 `/admin/*` 路径要求 `payload-token` Cookie 存在，否则重定向至 `/login`；`/admin/*` 路径进一步要求用户角色为 `admin`（在 Payload Admin Panel 配置中限制）；所有 `(public)/*` 路径不做拦截。

### 6.3 RBAC 权限矩阵

| Collection                 | visitor (未登录) | viewer | partner | reviewer | admin |
| -------------------------- | :--------------: | :----: | :-----: | :------: | :---: |
| TechNeeds - 读取           |        ✅        |   ✅   |   ✅    |    ✅    |  ✅   |
| TechNeeds - 创建/编辑/删除 |        ❌        |   ❌   |   ❌    |    ❌    |  ✅   |
| Proposals - 创建           |        ❌        |   ❌   |   ✅    |    ❌    |  ✅   |
| Proposals - 读取（自己的） |        ❌        |   ❌   |   ✅    |    ✅    |  ✅   |
| Proposals - 读取（全部）   |        ❌        |   ❌   |   ❌    |    ✅    |  ✅   |
| Proposals - 审核/状态流转  |        ❌        |   ❌   |   ❌    |    ✅    |  ✅   |
| Partners - 读取            |        ✅        |   ✅   |   ✅    |    ✅    |  ✅   |
| Partners - 管理            |        ❌        |   ❌   |   ❌    |    ❌    |  ✅   |
| CaseStudies - 读取         |        ✅        |   ✅   |   ✅    |    ✅    |  ✅   |
| CaseStudies - 管理         |        ❌        |   ❌   |   ❌    |    ❌    |  ✅   |
| Users - 管理               |        ❌        |   ❌   |   ❌    |    ❌    |  ✅   |
| UserGroups - 管理          |        ❌        |   ❌   |   ❌    |    ❌    |  ✅   |

---

## 7. 部署架构

### 7.1 网络拓扑

```
公司内网用户浏览器
       │
       │ DNS: innovation.example.com → 开发机内网 IP
       │
       ▼
┌───────────────────────────┐
│     开发机 / 服务器         │
│                           │
│  Nginx (:443)             │
│    │ SSL: *.example.        │
│    │   example.com      │
│    │                      │
│    ├──► Next.js (:3000)   │
│    │     + Payload CMS    │
│    │                      │
│  Docker Compose:          │
│    ├── PostgreSQL (:5432) │
│    └── Redis (:6379)      │
│                           │
└───────────────────────────┘
       │
       ├──► 阿里云 SMS API（公网）
       └──► 企业邮箱 SMTP（内网/公网）
```

### 7.2 Nginx 配置

```nginx
# /etc/nginx/conf.d/innovation.example.com.conf

server {
    listen 80;
    server_name innovation.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name innovation.example.com;

    ssl_certificate     /etc/nginx/ssl/example.com/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    client_max_body_size 120M;

    # 主应用代理
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Next.js HMR WebSocket（开发阶段）
    location /_next/webpack-hmr {
        proxy_pass http://127.0.0.1:3000/_next/webpack-hmr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # 静态资源长缓存（生产阶段启用）
    location /_next/static {
        proxy_pass http://127.0.0.1:3000/_next/static;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 7.3 Docker Compose（本地基础设施）

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    ports:
      - '5432:5432'
    environment:
      POSTGRES_DB: innovation_platform
      POSTGRES_USER: payload
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

### 7.4 环境变量

```bash
# .env.example

# === Payload ===
PAYLOAD_SECRET=至少32位随机字符串
NEXT_PUBLIC_SERVER_URL=https://innovation.example.com

# === Database ===
DATABASE_URI=postgresql://payload:your_password@localhost:5432/innovation_platform

# === Redis ===
REDIS_URL=redis://:your_redis_password@localhost:6379

# === 阿里云 SMS ===
ALIYUN_SMS_ACCESS_KEY_ID=your_key_id
ALIYUN_SMS_ACCESS_KEY_SECRET=your_key_secret
ALIYUN_SMS_SIGN_NAME=Open Innovation创新平台
ALIYUN_SMS_TEMPLATE_CODE=SMS_xxxxxxxx

# === 企业邮箱 ===
SMTP_HOST=smtp.your-company.com
SMTP_PORT=465
SMTP_USER=innovation@example.com
SMTP_PASS=your_email_password
SMTP_FROM_NAME=H&T Innovation Platform
SMTP_FROM_ADDRESS=innovation@example.com

```

### 环境变量开发环境联调相关

开发u阶段，你可以使用以下数据进行参数补充和开发联调

【短信认证】使用部署环境中的以下环境变量注入，真实值不写入仓库：

ALIYUN*SMS_ACCESS_KEY_ID=\*\*\_REDACTED*\*\*

ALIYUN*SMS_ACCESS_KEY_SECRET=\*\*\_REDACTED*\*\*

【邮箱认证】同样通过环境变量注入，真实值不写入仓库：

SMTP*USER=\*\*\_REDACTED*\*\*

SMTP*PASS=\*\*\_REDACTED*\*\*

IMAP*HOST=\*\*\_REDACTED*\*\*

SMTP*HOST=\*\*\_REDACTED*\*\*

SMTP_PORT=\*\*\*

---

## 8. 开发计划（两周排期）

### 第一周：基础设施 + 数据层 + 公开页面

| 日期  | 任务                                                                                                                         | 工具分工                          | 交付物                                                          |
| ----- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------- |
| Day 1 | 项目初始化：`create-payload-app`、Docker Compose 启动 PG+Redis、Nginx 配置 HTTPS、验证域名访问                               | 你手动                            | 项目跑通，`https://innovation.example.com/admin` 可访问 |
| Day 2 | 定义全部 7 个 Collections（Users、UserGroups、TechNeeds、Proposals、Partners、CaseStudies、Media），编写 access control 函数 | Codex 批量生成 + 你审查           | Payload Admin 后台可管理全部数据模型                            |
| Day 3 | 短信认证系统：阿里云 SMS 封装、Redis 验证码存取、`/api/sms/send` 和 `/api/sms/verify` 接口、Custom Auth Strategy             | 你主力 + Copilot 辅助             | 手机号注册/登录完整流程跑通                                     |
| Day 4 | 邮箱认证 + 注册/登录页面 UI：`(auth)/login`、`(auth)/register`、`(auth)/verify`、Middleware 路由保护                         | Copilot 辅助表单 + 你写认证逻辑   | 双通道（邮箱+短信）认证全部可用                                 |
| Day 5 | 公开页面迁移（上）：`(public)/layout.tsx`（Header+Footer）、首页、技术需求大厅列表页 + 筛选功能                              | Codex 将 HTML→JSX + Copilot 微调  | 首页和需求大厅上线，数据来自 Payload                            |
| Day 6 | 公开页面迁移（下）：需求详情页、生态伙伴目录页、联合创新案例列表页 + 详情页、合作流程页                                      | Codex 批量生成 + Copilot 样式调整 | 全部 6 个公开页面完成                                           |
| Day 7 | 数据填充 + 联调测试：录入演示数据、公开页面全流程走查、SEO metadata、响应式适配修复                                          | 你手动 + Copilot 修 bug           | 公开页面达到可演示状态                                          |

### 第二周：后台管理 + 方案流程 + 上线

| 日期   | 任务                                                                                                               | 工具分工                              | 交付物                                    |
| ------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------- | ----------------------------------------- |
| Day 8  | Dashboard 布局：`(dashboard)/layout.tsx`（Sidebar+TopBar）、仪表盘概览页（统计卡片：需求总数、方案总数、待审核数） | Codex 生成布局 + Copilot 组件对接     | 后台框架搭好，统计数据从 Payload API 渲染 |
| Day 9  | 方案提交功能：`proposals/new` 表单（Zod 校验、文件上传、关联需求选择）、提交后邮件通知 Hook                        | Codex 生成表单 + 你写 Hook 逻辑       | 合作伙伴可完整提交方案并上传附件          |
| Day 10 | 方案管理 + 审核功能：方案列表（DataTable + 状态筛选 + 分页）、方案详情 + 状态流转操作、审核意见填写                | Codex 生成 DataTable + Copilot 状态机 | 评审员可查看、审核、推进方案状态          |
| Day 11 | 用户与用户组管理：用户列表 DataTable、角色修改、用户组 CRUD、分配用户到组                                          | Codex 生成管理页面                    | 管理员可完整管理用户体系                  |
| Day 12 | 安全加固 + 性能优化：Rate Limiting（短信接口）、CSRF 配置确认、Input Sanitization、Image 优化、Lighthouse 评分     | 你主力 + Copilot 辅助                 | 安全基线达标                              |
| Day 13 | 生产部署：`pnpm build`、PM2 进程管理、Nginx 生产配置优化（gzip、缓存头）、数据库备份脚本                           | 你手动                                | 生产环境运行稳定                          |
| Day 14 | 全流程回归测试 + 文档完善：访客浏览、注册登录、方案提交、审核流转、管理操作全链路走查                              | 你 + Copilot 补测试用例               | 项目正式上线                              |

---

## 9. Copilot Pro+ 与 Codex CLI 使用规范

### 9.1 职责划分原则

**Codex CLI** 用于"批量生成型"任务。适合场景包括：将 HTML 原型片段转换为 Next.js TSX 组件、批量生成 Payload Collection 配置文件、生成整个页面的初始骨架代码、创建 DataTable 列定义和筛选器。使用时应提供清晰的自然语言 prompt 并附上相关上下文文件路径，生成后必须人工审查再合并。

**Copilot Pro+ CLI** 用于"实时辅助型"任务。适合场景包括：在编辑器中补全函数体、编写 Zod 验证 schema、调试类型错误、编写单个 Hook 或工具函数、微调样式和响应式布局。使用方式是写好函数签名和注释让 Copilot 补全实现。

### 9.2 不交给 AI 的部分

以下模块必须由开发者本人编写或逐行审查：Payload Custom Auth Strategy 的 `authenticate` 函数、短信验证码发送和校验逻辑（安全敏感）、Middleware 路由保护规则、Access Control 函数（权限策略）、环境变量和密钥配置、Nginx SSL 和反向代理配置。

### 9.3 Codex Prompt 模板

为保证生成质量一致性，对 Codex 的任务描述应遵循以下结构：

```
## 任务
[一句话说明要做什么]

## 上下文
- 项目技术栈: Next.js 16 + Payload CMS 3.81 + TypeScript + Tailwind CSS + shadcn/ui
- 当前文件路径: [具体路径]
- 依赖的文件: [列出需要参考的现有文件]

## 输入
[提供 HTML 片段 / 数据结构 / 字段定义等]

## 输出要求
- 文件路径: [期望生成到哪个路径]
- 必须使用 Server Component / Client Component（标明）
- 数据获取方式: Payload Local API
- UI 组件: shadcn/ui 的 [具体组件名]
- 样式: Tailwind CSS，品牌色使用 CSS 变量 --ht-blue (#004098) 和 --ht-light-blue (#00A0E9)

## 约束
- 不要使用 any 类型
- 所有文案保持中英双语
- 响应式适配: mobile first
```

---

## 10. 品牌与设计规范

### 10.1 色彩体系

| 用途               | 色值      | CSS 变量          | Tailwind 配置                 |
| ------------------ | --------- | ----------------- | ----------------------------- |
| 主色（Open Innovation深蓝） | `#004098` | `--ht-blue`       | `ht-blue`                     |
| 科技蓝（CTA/强调） | `#00A0E9` | `--ht-light-blue` | `ht-light-blue`               |
| 背景灰             | `#F3F4F6` | `--ht-grey`       | 使用 Tailwind 默认 `gray-100` |
| 正文黑             | `#1F2937` | —                 | `gray-800`                    |
| 辅助文字           | `#6B7280` | —                 | `gray-500`                    |

### 10.2 Tailwind 品牌色扩展

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'ht-blue': '#004098',
        'ht-light-blue': '#00A0E9',
      },
    },
  },
  plugins: [],
}
export default config
```

### 10.3 排版与组件风格

公开页面延续现有 HTML 原型的视觉语言：Hero Banner 使用深蓝到蓝色渐变叠加背景图，统计数据区使用大号数字 + 小号标签居中排列，技术需求卡片使用白底 + 左侧彩色边框 + hover 阴影，按钮分两级——主按钮（`bg-ht-light-blue` 圆角填充）和次按钮（`border-ht-light-blue` 描边）。Dashboard 页面使用 shadcn/ui 默认的中性风格，通过 Sidebar 侧边栏导航实现管理后台标准布局。

---

## 11. 安全策略

### 11.1 应用安全

认证 Token 通过 httpOnly + Secure + SameSite=Lax 的 Cookie 存储，不暴露给前端 JavaScript。短信验证码接口实施 Rate Limiting，同一手机号 60 秒内只能请求一次，同一 IP 每小时最多 20 次。文件上传限制 MIME 类型白名单和 100MB 单文件大小上限，Payload 会自动校验。所有用户输入通过 Zod Schema 校验后再入库。Payload 的 CSRF 保护已配置为仅信任 `https://innovation.example.com` 域。

### 11.2 基础设施安全

Nginx 仅对外暴露 443 端口，PostgreSQL 和 Redis 仅监听 127.0.0.1。数据库密码和 API Key 通过 `.env.local` 管理，不入 Git 仓库。Payload 版本必须 ≥ 3.79.1（修复了 CVE-2026-34746 和 CVE-2026-34747 安全漏洞）。

### 11.3 数据安全

方案提交表单页面包含知识产权保护声明，提示用户在签署 NDA 前不要上传核心机密资料。上传的附件存储在服务器本地 `./media` 目录，通过 Payload Access Control 限制只有提交人本人、评审员和管理员可以访问。数据库配置每日自动备份脚本。

---

## 12. 附录

### 12.1 关键命令速查

```bash
# 项目初始化
npx create-payload-app@latest innovation-platform

# 安装 shadcn/ui 组件
npx shadcn@latest init
npx shadcn@latest add button card badge table form select input textarea sheet navigation-menu dialog toast tabs avatar dropdown-menu

# 本地启动基础设施
docker compose up -d

# 启动开发服务器
pnpm dev

# Nginx 配置测试与重载
sudo nginx -t && sudo nginx -s reload

# 生产构建与启动
pnpm build
pm2 start pnpm --name innovation-platform -- start

# 数据库迁移（Payload 自动处理 schema 变更）
pnpm payload migrate
```

### 12.2 参考资源

| 资源                         | 链接                                                         |
| ---------------------------- | ------------------------------------------------------------ |
| Payload CMS 文档             | https://payloadcms.com/docs                                  |
| Payload Custom Auth Strategy | https://payloadcms.com/docs/authentication/custom-strategies |
| Payload RBAC 指南            | https://payloadcms.com/posts/blog/build-your-own-rbac        |
| Payload 生产部署             | https://payloadcms.com/docs/production/deployment            |
| Next.js App Router           | https://nextjs.org/docs/app                                  |
| shadcn/ui 组件库             | https://ui.shadcn.com                                        |
| 阿里云 SMS Node.js SDK       | https://help.aliyun.com/document_detail/419273.html          |

### 12.3 风险与应对

| 风险               | 概率 | 影响 | 应对策略                                                                                 |
| ------------------ | ---- | ---- | ---------------------------------------------------------------------------------------- |
| 短信验证码被刷     | 中   | 高   | Rate Limiting + 图形验证码前置 + 阿里云黑名单                                            |
| Payload 版本不兼容 | 低   | 中   | 锁定 `3.81.x`，不做 minor 升级直到项目稳定                                               |
| 两周内功能未完成   | 中   | 中   | Day 7 检查点：若公开页面未就绪则砍 Dashboard 的用户组管理，使用 Payload Admin Panel 替代 |
| 文件上传安全隐患   | 低   | 高   | MIME 白名单 + 文件大小限制 + 病毒扫描（后期接入）                                        |

---
