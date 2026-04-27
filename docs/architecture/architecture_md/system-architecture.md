# 系统架构说明

更新日期：`2026-04-27`

## 1. 系统定位

开放创新平台当前是一个单仓全栈项目，不存在独立后端服务：

- `Next.js App Router` 提供公开站点、登录注册页、Dashboard 和自定义业务 API
- `Payload CMS 3` 以内嵌方式运行在同一个 Node 进程中，提供 Admin、REST、GraphQL 和 Local API
- `PostgreSQL` 保存业务数据
- `Redis` 保存邮箱 / 短信验证码缓存
- 仓库根目录 `media/` 保存上传附件和图片，并按业务模块分层归档

站内绝大多数读写，不是走 HTTP 再调 Payload，而是直接通过 `getPayloadClient()` 使用 Payload Local API。

## 2. 技术基线

| 层               | 当前实现                            |
| ---------------- | ----------------------------------- |
| Web 框架         | `Next.js 16.2.3`                    |
| CMS / 数据访问层 | `Payload CMS 3.82.1`                |
| 前端             | `React 19` + `Tailwind CSS 4`       |
| 语言             | `TypeScript 5.7.x`                  |
| 数据库           | `PostgreSQL`                        |
| OTP 缓存         | `Redis`                             |
| 邮件             | `nodemailer + SMTP`                 |
| 短信             | 阿里云 `Dypnsapi SendSmsVerifyCode` |
| 进程守护         | `systemd`                           |
| 反向代理         | `nginx`                             |
| 运行模式         | `standalone + pnpm start`           |

## 3. 页面路由分组

| 分组          | 典型路由                                                                                                                                                        | 作用                                     |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `(public)`    | `/`、`/needs`、`/needs/[id]`、`/ecosystem`、`/cases`、`/cases/[slug]`、`/process`、`/submit`                                                                    | 公开门户、需求大厅、生态伙伴、案例与流程 |
| `(auth)`      | `/login`、`/register`、`/verify`                                                                                                                                | 登录、注册、邮箱验证                     |
| `(dashboard)` | `/dashboard`、`/dashboard/proposals`、`/dashboard/proposals/new`、`/dashboard/proposals/[id]`、`/dashboard/settings`、`/dashboard/partners`、`/dashboard/users` | 登录后工作台                             |
| `(payload)`   | `/admin`                                                                                                                                                        | Payload Admin                            |

## 4. 接口面

### 4.1 Payload 自带接口

- `/api/[collection]`
- `/api/graphql`
- `/api/graphql-playground`
- `/admin`

### 4.2 项目自定义业务 API

| 路由                          | 说明                             |
| ----------------------------- | -------------------------------- |
| `/api/auth/login`             | 邮箱 / 手机号 + 密码登录         |
| `/api/auth/login-code/send`   | 发送邮箱或短信登录验证码         |
| `/api/auth/login-code/verify` | 验证登录验证码，仅已有账号可进入 |
| `/api/auth/email-code`        | 发送注册邮箱验证码               |
| `/api/auth/register`          | 合作伙伴注册                     |
| `/api/auth/verify`            | 邮箱验证写入登录态               |
| `/api/auth/logout`            | Dashboard 登出                   |
| `/api/sms/send`               | 发送注册短信验证码               |
| `/api/sms/verify`             | 手机验证码校验并登录（兼容路径） |
| `/api/account/profile`        | 当前用户保存个人资料             |
| `/api/proposals`              | 创建方案与上传附件               |
| `/api/proposals/[id]/status`  | 评审员更新方案状态与评审意见     |
| `/api/attachments/[id]`       | 业务态附件下载入口               |

## 5. 数据访问方式

### 5.1 Payload Local API 是主路径

典型调用：

- `payload.find(...)`
- `payload.findByID(...)`
- `payload.count(...)`
- `payload.create(...)`
- `payload.update(...)`

典型场景：

- 首页、需求列表、案例列表、Dashboard 统计：Server Component 直接查询 Payload
- 登录、注册、短信验证、方案提交、个人设置：Route Handler 直接操作 Payload
- Hook 中邮件通知和编号生成：使用 `req.payload` 或 `getPayloadClient()`

### 5.2 REST / GraphQL 不是站内主调用链

虽然项目对外提供 Payload REST / GraphQL，但站内页面并不依赖这些 HTTP 接口完成主要数据查询。它们更适合：

- Admin 与外部集成联调
- 脚本或调试工具查看数据
- 未来第三方系统接入

## 6. Collection 模型

| Collection     | 用途             | 关键字段                                                                                 | 访问特点                                              |
| -------------- | ---------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `users`        | 平台账号         | `username`、`email`、`phone`、`role`、验证时间戳                                         | 普通用户只能读改自己；管理员可管理全部                |
| `user-groups`  | 用户组与扩展权限 | `name`、`description`、`permissions`                                                     | 仅管理员可读写                                        |
| `tech-needs`   | 技术需求大厅     | `needId`、`title`、`priority`、`domain`、`status`                                        | 公开可读；管理员维护                                  |
| `proposals`    | 创新方案         | `title`、`type`、`status`、`submittedBy`、`reviewNotes`                                  | 合作伙伴创建；管理员 / 评审员评审；合作伙伴仅看自己的 |
| `partners`     | 生态伙伴目录     | `name`、`category`、`tier`、`sortOrder`                                                  | 公开可读；管理员维护                                  |
| `case-studies` | 联合案例         | `title`、`slug`、`domain`、`content`                                                     | 公开可读；管理员维护                                  |
| `media`        | 媒体与附件       | `filename`、`purpose`、`module`、`assetCategory`、`storageKey`、`proposal`、`uploadedBy` | 公开图片与受控附件并存，并按模块物理归档              |

## 7. 认证与会话

### 7.1 当前会话模型

- Cookie 名称：`innovation-session`
- 签名密钥：`PAYLOAD_SECRET`
- 载荷字段：`id`、`email`、`name`、`role`
- 时效：8 小时
- 属性：`HttpOnly + SameSite=Lax + Secure(生产)`

### 7.2 登录方式

当前支持：

1. 邮箱或手机号 + 密码
2. 邮箱验证码登录已有账号
3. 短信验证码登录已有账号

当前不支持：

- 用户名直接登录
- 验证码正确后自动注册新账号

### 7.3 注册方式

注册页当前为三标签流：

1. 基础信息
2. 邮箱验证
3. 手机验证

要求：

- 基础信息必填
- 邮箱验证码或短信验证码至少完成一种
- 注册成功后跳回登录页

### 7.4 当前用户资料维护

`/dashboard/settings` 当前已支持当前登录用户修改：

- 姓名
- 用户名
- 公司名称
- 邮箱
- 手机号

后端接口：`/api/account/profile`

规则：

- 校验用户名、邮箱、手机号唯一性
- 非管理员账号必须保留至少一种已验证通道
- 若邮箱或手机号变更，则同步重置该通道验证状态
- 保存后会刷新 `innovation-session`

## 8. 关键业务流

### 8.1 邮箱注册

1. 用户填写基础信息
2. `/api/auth/email-code` 发送邮箱验证码
3. `/api/auth/register` 校验基础信息、邮箱验证码或手机验证码
4. 创建 `users` 记录，按实际验证结果写入 `emailVerifiedAt` / `phoneVerifiedAt`
5. 跳回登录页

### 8.2 验证码登录

1. `/api/auth/login-code/send` 根据输入自动选择邮箱或短信通道
2. 验证码写入 Redis 或内存缓存，TTL 为 300 秒
3. `/api/auth/login-code/verify` 验证成功后查询 `users`
4. 命中已有账号才写登录态；未命中返回 `register` 动作和预填注册链接
5. 若使用的通道尚未验证，会补写验证时间戳

### 8.3 方案提交流转

1. 合作伙伴在 `/dashboard/proposals/new` 提交方案
2. `/api/proposals` 创建 `proposals` 记录与关联 `media`
3. 方案附件当前支持 `TXT / PDF / PPT / PPTX / DOC / DOCX / ZIP / RAR`
4. `media` 自动将方案附件归档到 `media/document/proposals/`
5. Hook 自动补齐 `submittedBy`、通知相关用户
6. 评审员通过 `/api/proposals/[id]/status` 更新状态与评审意见
7. 合作伙伴再次进入详情页可看到最新状态和意见

### 8.4 附件下载

1. 前端访问 `/api/attachments/[id]`
2. 后端根据 `innovation-session` 识别用户
3. 校验是否为管理员、评审员、上传者或方案所有者
4. 优先按 `storageKey` 定位模块目录，找不到时再回退老路径
5. 读取磁盘文件并强制附件下载返回

## 9. 外部服务与回退策略

### 9.1 PostgreSQL

- 通过 `@payloadcms/db-postgres` 连接
- 优先使用 `DATABASE_URI`，其次 `DATABASE_URL`

### 9.2 Redis

- 用于验证码缓存
- `REDIS_URL` 缺失时，OTP 回退到进程内 `Map`
- 进程重启后验证码失效

### 9.3 短信与限流

- 当前正式短信签名：`平台验证码`
- 模板编码：`100001`
- 场景名：`平台验证码`
- OTP 过期时间：300 秒
- 发送限流：手机号 / 邮箱 60 秒 1 次，IP 1 小时 20 次
- 当前代码使用 `RateLimiterMemory`，应用重启会清空限流计数

### 9.4 SMTP 邮件

- 注册验证码、登录验证码、提案通知、状态变更通知都走 `src/services/email.ts`
- 若 SMTP 未配齐或发送失败，主业务流继续执行
- 日志关键字：`[email:send-failed]`

## 10. 文件与部署特性

- 媒体持久化目录：仓库根目录 `media/`
- 当前目录约定：
  - `media/document/proposals/`：方案附件
  - `media/document/partners/`：伙伴侧文档
  - `media/image/partners/logo/`：伙伴 Logo
  - `media/image/partners/svg/`：伙伴 SVG
  - `media/image/case-studies/cover/`：案例封面
  - `media/image/users/avatar/`：用户头像
  - `media/image/tech-needs/`：技术需求图片预留目录
- 运行模式：`next build` + `standalone`
- `.next/standalone/.env*` 会携带构建时环境变量副本
- 环境变量变更后必须 rebuild + restart
