# 系统架构说明

更新日期：`2026-04-17`

## 1. 系统定位

开放创新平台当前是一个单仓全栈项目，不存在额外的独立后端服务：

- `Next.js App Router` 提供公开站点、登录注册页、Dashboard 和自定义业务 API
- `Payload CMS 3` 以内嵌方式运行在同一个 Node 进程中，提供 Admin、REST、GraphQL 和 Local API
- `PostgreSQL` 保存业务数据
- `Redis` 保存短信验证码
- 仓库根目录 `media/` 保存上传附件和图片

绝大多数页面和业务逻辑并不是通过 HTTP 再去调用 Payload，而是直接在服务端通过 `getPayloadClient()` 使用 Payload Local API 访问集合数据。

## 2. 技术基线

| 层               | 当前实现                                   |
| ---------------- | ------------------------------------------ |
| Web 框架         | `Next.js 16.2.3`（App Router）             |
| CMS / 数据访问层 | `Payload CMS 3.82.1`                       |
| 前端             | `React 19` + `Tailwind CSS 4`              |
| 语言             | `TypeScript 5.7.x`                         |
| 数据库           | `PostgreSQL 16`                            |
| OTP 缓存         | `Redis 7`                                  |
| 邮件             | `nodemailer` + SMTP                        |
| 短信             | 阿里云 SMS SDK                             |
| 进程守护         | `systemd`                                  |
| 反向代理         | `nginx`                                    |
| 运行模式         | `next build` + `standalone` + `pnpm start` |

## 3. 路由分组与接口面

### 3.1 页面路由

| 分组          | 典型路由                                                                                                                                                        | 作用                                         |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `(public)`    | `/`、`/needs`、`/needs/[id]`、`/ecosystem`、`/cases`、`/cases/[slug]`、`/process`、`/submit`                                                                    | 公开门户、需求大厅、伙伴目录、案例与合作流程 |
| `(auth)`      | `/login`、`/register`、`/verify`                                                                                                                                | 登录、注册、邮箱验证                         |
| `(dashboard)` | `/dashboard`、`/dashboard/proposals`、`/dashboard/proposals/new`、`/dashboard/proposals/[id]`、`/dashboard/settings`、`/dashboard/partners`、`/dashboard/users` | 登录后工作台                                 |
| `(payload)`   | `/admin`                                                                                                                                                        | Payload Admin 后台                           |

### 3.2 Payload 自带接口

由 `src/app/(payload)` 暴露，和 Next.js 站点共用同一进程：

| 路由                      | 说明                |
| ------------------------- | ------------------- |
| `/api/[collection]`       | Payload REST API    |
| `/api/graphql`            | Payload GraphQL API |
| `/api/graphql-playground` | GraphQL Playground  |
| `/admin`                  | Payload Admin       |

### 3.3 项目自定义业务 API

位于 `src/app/api`：

| 路由                         | 说明                   |
| ---------------------------- | ---------------------- |
| `/api/auth/login`            | 邮箱/手机号 + 密码登录 |
| `/api/auth/register`         | 合作伙伴注册           |
| `/api/auth/verify`           | 邮箱验证写入登录态     |
| `/api/auth/logout`           | Dashboard 登出         |
| `/api/sms/send`              | 发送短信验证码         |
| `/api/sms/verify`            | 校验短信验证码并登录   |
| `/api/proposals`             | 提交新方案与上传附件   |
| `/api/proposals/[id]/status` | 评审员更新方案状态     |
| `/api/attachments/[id]`      | 业务态附件下载入口     |

## 4. 数据访问方式

### 4.1 Payload Local API 是主路径

`src/lib/payload.ts` 使用 `getPayload({ config })` 构造单例客户端，页面和路由常见调用方式如下：

- `payload.find(...)`
- `payload.findByID(...)`
- `payload.count(...)`
- `payload.create(...)`
- `payload.update(...)`
- `payload.delete(...)`

典型场景：

- 首页、需求列表、案例列表、Dashboard 统计：Server Component 直接查 Payload
- 登录、注册、短信验证、方案提交：Route Handler 直接查 Payload
- Hook 中邮件通知和编号生成：`req.payload` 或 `getPayloadClient()` 直接查 Payload

### 4.2 REST / GraphQL 不是站内主调用链

虽然项目对外提供了 Payload REST / GraphQL，但当前站内页面并不依赖这些 HTTP 接口完成数据查询。它们更多用于：

- Admin 与外部集成联调
- 脚本或调试工具查看数据
- 未来外部系统接入

### 4.3 直接 SQL 只能算运维视角

直接连 PostgreSQL 能看到真实表和原始数据，但有两个重要限制：

1. 不会自动体现 Payload 的访问控制规则
2. 也不会触发 Payload Hook、邮件通知和附件权限逻辑

因此，排查业务问题时应优先顺序如下：

1. `/admin`
2. Payload REST / GraphQL
3. 直接 PostgreSQL

## 5. 集合模型

当前启用的 Payload Collection 如下：

| Collection     | 用途             | 关键字段                                                | 访问特点                                                            |
| -------------- | ---------------- | ------------------------------------------------------- | ------------------------------------------------------------------- |
| `users`        | 平台账号         | `username`、`email`、`phone`、`role`、验证时间戳        | 仅管理员可管理全部；普通用户只能读/改自己                           |
| `user-groups`  | 用户组与扩展权限 | `name`、`description`、`permissions`                    | 仅管理员可读写                                                      |
| `tech-needs`   | 技术需求大厅     | `needId`、`title`、`priority`、`domain`、`status`       | 公开可读；仅管理员维护                                              |
| `proposals`    | 创新方案         | `title`、`type`、`status`、`submittedBy`、`reviewNotes` | 合作伙伴可创建；管理员/评审员可查看并评审全部；合作伙伴仅能看自己的 |
| `partners`     | 生态伙伴目录     | `name`、`category`、`tier`、`sortOrder`                 | 公开可读；仅管理员维护                                              |
| `case-studies` | 联合创新案例     | `title`、`slug`、`partnerName`、`coverImage`            | 公开可读；仅管理员维护                                              |
| `media`        | 图片与文档附件   | `purpose`、`uploadedBy`、`proposal`、文件元数据         | 图片可公开；文档附件受角色和归属限制                                |

### 5.1 关键字段与行为

- `tech-needs.needId`：通过 Hook 自动生成 `RD-YYYY-流水号`
- `proposals.attachments`：通过 `proposals_rels` 关联到 `media`
- `media.purpose=document`：默认只允许上传者、评审员、管理员读取
- `description`、`reviewNotes`、`content` 等富文本字段在 PostgreSQL 中以 `jsonb` 存储

## 6. 认证与权限模型

### 6.1 Dashboard 认证

公开站与 Dashboard 使用自定义会话 Cookie：

- Cookie 名：`innovation-session`
- 签名算法：`HS256`
- 密钥来源：`PAYLOAD_SECRET`
- 有效期：8 小时
- 保护范围：`/dashboard/*`

`src/proxy.ts` 只会保护 `/dashboard`，不会拦截 `/admin`。

### 6.2 Payload Admin 认证

`/admin` 仍由 Payload 自身认证体系处理，和 Dashboard 的 `innovation-session` 不是同一套登录态。这也是附件下载单独做 `/api/attachments/[id]` 业务路由的原因之一：Dashboard 用户态与 Payload 原生文件路由的权限体系并不完全重合。

### 6.3 角色边界

| 角色       | 能力                                                                |
| ---------- | ------------------------------------------------------------------- |
| `admin`    | 查看和维护全部数据；进入 `/admin`；在 Dashboard 中查看用户/伙伴视图 |
| `reviewer` | 查看全部方案、填写评审意见、更新方案状态                            |
| `partner`  | 注册、登录、提交方案、查看自己的方案与附件                          |
| `viewer`   | 预留角色，当前未形成独立业务入口                                    |

## 7. 关键业务流

### 7.1 公开内容访问

1. 浏览器请求公开页面
2. Server Component 通过 `getPayloadClient()` 调用 Local API
3. 服务端渲染后直接返回页面

### 7.2 注册与邮箱验证

1. `/api/auth/register` 校验邮箱、用户名、手机号唯一性
2. 创建 `users` 记录，写入 `emailVerificationToken` 和过期时间
3. `sendVerificationEmail()` 发送验证邮件
4. `/api/auth/verify` 校验 token 后写入 `emailVerifiedAt`
5. 同时签发 `innovation-session`

### 7.3 密码登录与短信登录

- 密码登录支持“邮箱 / 手机号 + 密码”
- 手机号验证码通过 `/api/sms/send` 和 `/api/sms/verify` 完成
- 验证成功后若手机号未对应用户，会自动创建一个 `partner` 用户

### 7.4 方案提交流转

1. 合作伙伴在 `/dashboard/proposals/new` 提交方案
2. 自定义 API 先创建 `proposals`，再创建附件 `media`
3. `beforeChange` 自动补齐 `submittedBy`
4. `afterChange` 触发提案通知邮件
5. 评审员通过 `/api/proposals/[id]/status` 更新状态
6. 状态变化后再次触发通知邮件

### 7.5 附件下载

1. 前端点击 `/api/attachments/[id]`
2. 后端用 `innovation-session` 识别当前用户
3. 查询 `media` 与关联 `proposal`
4. 校验是否为管理员、评审员、上传者或方案所有者
5. 读取磁盘文件并强制附件下载返回

## 8. 外部服务与回退策略

### 8.1 PostgreSQL

- Payload 在 `src/payload.config.ts` 中通过 `@payloadcms/db-postgres` 连接数据库
- 连接变量优先使用 `DATABASE_URI`，其次 `DATABASE_URL`
- 当前库内真实主表包括：`users`、`user_groups`、`tech_needs`、`proposals`、`proposals_rels`、`partners`、`case_studies`、`media`

### 8.2 Redis

- 仅用于短信验证码缓存
- `REDIS_URL` 缺失时，OTP 回退到进程内 `Map`
- 这意味着开发环境可无 Redis 运行，但进程重启会丢失验证码

### 8.3 短信与限流

- 阿里云短信变量未配齐时，系统进入 mock 模式，并在日志打印 `[sms:mock]`
- OTP 过期时间：300 秒
- 发送限流使用 `RateLimiterMemory`
  - 手机号：60 秒 1 次
  - IP：1 小时 20 次

### 8.4 SMTP 邮件

- 验证邮件、提案提交通知、状态变更通知都走 `src/services/email.ts`
- 若 SMTP 未配齐或发送失败，主业务流程继续执行
- 日志关键字：`[email:send-failed]`

## 9. 文件与部署特性

### 9.1 媒体文件

- Upload 静态目录：仓库根目录 `media/`
- 图片通常用于公开展示
- 文档通常作为提案附件，需要业务权限校验

### 9.2 standalone 运行

- `next build` 产出 `.next/standalone/server.js`
- `postbuild` 同步 `.next/static` 与 `public/`
- `pnpm start` 通过 `INNOVATION_MEDIA_DIR` 强制把媒体目录固定到根目录 `media/`

这意味着部署时除了数据库，还必须保留：

- `media/`
- `public/`
- `example.com_nginx/`（若同机保留证书）

## 10. 日志、观测与测试

### 10.1 常见日志关键字

- `[sms:mock]`：短信走 mock 模式
- `[email:send-failed]`：邮件发送失败，但流程已继续
- `[proposal:create-failed]`：方案创建或附件写入失败

### 10.2 自动化测试现状

- `pnpm lint`：ESLint + oxlint
- `pnpm typecheck`：TypeScript 类型检查
- `pnpm test:int`：Payload 基础集成测试
- `pnpm test:e2e`：首页与 Admin 基础导航检查

自动化覆盖仍偏轻量，注册、短信、附件权限和完整评审流转主要依赖人工验收。

## 11. 当前约束

- 没有数据库级 RLS，权限完全由 Payload access 函数实现
- 直接 SQL 查询不会自动体现业务权限
- `settings` 页面当前只读
- 没有独立 `/health` 健康检查接口
- E2E 依赖本机已安装 Playwright 浏览器二进制
