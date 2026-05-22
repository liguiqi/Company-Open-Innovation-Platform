# 系统架构说明

更新日期：`2026-04-30`

## 1. 系统定位

Open Innovation Platform当前是一个单仓全栈项目，不存在独立拆分的后端服务：

- `Next.js App Router` 同时承载公开站、登录注册页、Innovation Workspace和自定义业务 API
- `Payload CMS 3` 以内嵌方式运行在同一个 Node 进程中，对外提供 Admin、REST、GraphQL 和 Local API
- `PostgreSQL` 保存业务主数据
- `Redis` 保存验证码缓存与验证码相关限流辅助状态
- 仓库根目录 `media/` 保存上传附件与图片，并按业务模块、资产类型做物理归档

站内绝大多数数据读写都不是通过 HTTP 再去请求 Payload，而是直接通过 `getPayloadClient()` 调用 Payload Local API。

## 2. 技术基线

| 层               | 当前实现                                                 |
| ---------------- | -------------------------------------------------------- |
| Web 框架         | `Next.js 16.2.3`                                         |
| CMS / 数据访问层 | `Payload CMS 3.82.1`                                     |
| 前端             | `React 19.2.4` + `Tailwind CSS 4.1.14`                   |
| 富文本           | `@payloadcms/richtext-lexical`                           |
| 语言             | `TypeScript 5.7.x`                                       |
| 图标             | `lucide-react`                                           |
| 认证             | `jose` + Payload Auth + 自定义 `innovation-session`      |
| 输入校验         | `zod`                                                    |
| 数据库           | `PostgreSQL`                                             |
| OTP 缓存         | `Redis`                                                  |
| 邮件             | `nodemailer + SMTP`                                      |
| 短信             | 阿里云 `Dypnsapi SendSmsVerifyCode`                      |
| 文件处理         | `sharp`                                                  |
| 进程守护         | `systemd`                                                |
| 反向代理         | `nginx`                                                  |
| 运行模式         | `next build` + `.next/standalone` + `pnpm start`         |
| 请求体限制       | `Next experimental.proxyClientMaxBodySize = 120mb`       |
| 附件业务限制     | 单文件 `100MB`，支持 `TXT/PDF/PPT/PPTX/DOC/DOCX/ZIP/RAR` |

## 3. 页面路由分组

| 分组          | 典型路由                                                                                                                                                                            | 作用                                                    |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `(public)`    | `/`、`/needs`、`/needs/[id]`、`/ecosystem`、`/ecosystem/directory`、`/cases`、`/cases/[slug]`、`/process`、`/submit`                                                                | 公开门户、需求大厅、伙伴目录、案例、流程与提交引导      |
| `(auth)`      | `/login`、`/register`、`/verify`                                                                                                                                                    | 登录、注册、邮箱验证                                    |
| `(dashboard)` | `/dashboard`、`/dashboard/proposals`、`/dashboard/proposals/new`、`/dashboard/proposals/[id]`、`/dashboard/settings`、`/dashboard/partners`、`/dashboard/users`、`/dashboard/needs` | 登录后工作台；其中 `needs` 目前是仓库内已实现的中台能力 |
| `(payload)`   | `/admin`、`/api/[...slug]`、`/api/graphql`、`/api/graphql-playground`                                                                                                               | Payload Admin 与其原生接口                              |

## 4. 接口面

### 4.1 Payload 自带接口

- `/api/[collection]`
- `/api/graphql`
- `/api/graphql-playground`
- `/admin`

### 4.2 项目自定义业务 API

| 路由                             | 说明                                  |
| -------------------------------- | ------------------------------------- |
| `/api/auth/login`                | 邮箱 / 手机号 + 密码登录              |
| `/api/auth/login-code/send`      | 发送邮箱或短信登录验证码              |
| `/api/auth/login-code/verify`    | 验证登录验证码，仅已有账号可进入      |
| `/api/auth/email-code`           | 发送注册邮箱验证码                    |
| `/api/auth/register`             | 合作伙伴注册                          |
| `/api/auth/verify`               | 邮箱验证完成后写入登录态              |
| `/api/auth/logout`               | 工作台登出                            |
| `/api/sms/send`                  | 发送注册短信验证码                    |
| `/api/sms/verify`                | 兼容的手机验证码登录 / 验证接口       |
| `/api/account/profile`           | 当前用户保存个人资料                  |
| `/api/partner/proposals`         | 合作伙伴 / 管理员提交新方案并上传附件 |
| `/api/proposals/[id]/status`     | 评审员 / 管理员更新方案状态与评审意见 |
| `/api/dashboard/tech-needs`      | 当前仓库中的中台需求管理接口          |
| `/api/dashboard/tech-needs/[id]` | 当前仓库中的中台需求更新接口          |
| `/api/attachments/[id]`          | 业务态附件下载入口                    |
| `/api/public-media/[id]`         | 公共图片资源透出接口                  |

## 5. 数据访问方式

### 5.1 Payload Local API 是主路径

典型调用：

- `payload.find(...)`
- `payload.findByID(...)`
- `payload.count(...)`
- `payload.create(...)`
- `payload.update(...)`
- `payload.delete(...)`

典型场景：

- 公开页、工作台统计卡片、案例和伙伴目录：Server Component 直接查询 Payload
- 登录、注册、资料保存、需求发布、方案提交、附件权限下载：Route Handler 直接操作 Payload
- Hook 中的编号生成、媒体同步、评审时间线、状态通知、访问记录写入：通过 `req.payload` 或 `getPayloadClient()` 完成

### 5.2 REST / GraphQL 不是站内主调用链

Payload REST / GraphQL 当前主要用于：

- Admin 与第三方系统联调
- SQL 之外的快速结构化查询
- 运维或研发排障时的辅助取数

## 6. Collection 模型

| Collection     | 用途             | 关键字段                                                                                               | 当前要点                                                     |
| -------------- | ---------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| `users`        | 平台账号         | `username`、`email`、`phone`、`role`、`emailVerifiedAt`、`phoneVerifiedAt`、`lastAccessAt`             | 支持最后访问时间记录；普通用户只能读改自己；管理员可管理全部 |
| `user-groups`  | 用户组与扩展权限 | `name`、`description`、`permissions`                                                                   | 当前主要作为后台组织字段使用                                 |
| `tech-needs`   | 技术需求大厅     | `needId`、`title`、`priority`、`domain`、`productLine`、`status`、`publishedAt`                        | `needId` 自动生成，格式为 `RD-年份-流水号`                   |
| `proposals`    | 创新方案         | `title`、`type`、`relatedNeed`、`attachments`、`status`、`reviewNotes`、`reviewedBy`、`reviewTimeline` | 评审时间线自动记录提交与每次状态流转                         |
| `partners`     | 生态伙伴目录     | `name`、`brandPreset`、`logo`、`website`、`category`、`tier`、`sortOrder`                              | 公开页优先渲染统一 SVG / 品牌预设，不直接跳官网              |
| `case-studies` | 联合案例         | `title`、`slug`、`partnerName`、`coverImage`、`summary`、`content`、`whitePaperUrl`                    | 封面图从 `media` 读取                                        |
| `media`        | 图片与附件资产   | `filename`、`purpose`、`module`、`assetCategory`、`storageKey`、`proposal`、`uploadedBy`               | 媒体按模块和资产类型归档；文档下载强制 `Content-Disposition` |

## 7. 认证与会话

### 7.1 当前会话模型

- Cookie 名称：`innovation-session`
- 签名密钥：`PAYLOAD_SECRET`
- 载荷字段：`id`、`email`、`name`、`role`
- 时效：8 小时
- 属性：`HttpOnly + SameSite=Lax + Secure(生产)`

同时存在两套认证上下文：

1. Payload Admin / Payload 原生登录态
2. 前台与工作台使用的 `innovation-session`

`users.afterLogin` Hook 与前台 `getCurrentUser()` / `getRequestUser()` 会共同刷新 `lastAccessAt`，确保后台列表能看到用户最近访问时间。

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

规则：

- 基础信息必填
- 邮箱验证码或短信验证码至少完成一种
- 注册成功后跳回登录页

### 7.4 当前用户资料维护

`/dashboard/settings` 支持当前登录用户修改：

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
- 保存后刷新 `innovation-session`

## 8. UI 与前端交互层

### 8.1 主题系统

- 全站统一使用 `html[data-theme]` 控制深浅主题
- 主题样式集中定义在 `src/app/globals.css`
- 公开站头部和工作台侧边栏都内置 `ThemeToggle`
- Payload Admin Logo / Icon 根据 `data-theme` 动态切换深浅版本

### 8.2 页面转场与品牌适配

- 公开站、登录页、工作台主内容区使用 `RouteTransition`
- 跳转前统一通过 `emitRouteTransitionStart()` 触发转场
- 品牌资源由 `HetBrandLogo`、`HetWordmark`、`AdminIcon`、`AdminLoginLogo` 统一管理
- 顶部和侧边栏的法律声明、品牌色和暗色主题已做统一变量适配

### 8.3 组件分层

- `components/auth/*`：登录、注册、邮箱验证
- `components/dashboard/*`：个人设置、需求运营台
- `components/proposals/*`：方案提交、评审表单、评审时间线
- `components/layout/*`：公开站头部/页脚、工作台侧边栏/顶部栏
- `components/payload/*`：Payload Admin 品牌化组件
- `components/shared/*`：主题切换、状态徽标、空状态、转场等公共组件

## 9. 关键业务流

### 9.1 登录与验证码登录

1. `/api/auth/login` 使用邮箱 / 手机号解析真实账号标识
2. `/api/auth/login-code/send` 自动识别邮箱或手机通道并发送验证码
3. `/api/auth/login-code/verify` 验证成功后只允许已有账号登录
4. 若验证码正确但未命中账号，接口返回 `register` 动作和预填注册链接
5. 登录成功后写入 `innovation-session`，并刷新 `users.lastAccessAt`

### 9.2 注册与通道绑定

1. 用户完成基础信息填写
2. 邮箱和手机至少验证一种
3. `/api/auth/register` 创建 `users` 记录
4. 按实际验证结果写入 `emailVerifiedAt` / `phoneVerifiedAt`
5. 成功后回跳到登录页

### 9.3 方案提交与评审时间线

1. 合作伙伴或管理员在 `/dashboard/proposals/new` 提交方案
2. `/api/partner/proposals` 创建 `proposals` 与关联 `media`
3. 当前支持多文件上传，单文件业务上限 `100MB`
4. `reviewTimeline` 在首次提交时自动写入“提交记录”
5. 评审员 / 管理员通过 `/api/proposals/[id]/status` 更新状态与评审意见
6. `onProposalStatusChange` 与通知 Hook 同步维护时间线和消息触发

### 9.4 附件下载

1. 前端统一访问 `/api/attachments/[id]`
2. 后端根据 `innovation-session` 识别用户
3. 权限允许的角色包括：管理员、评审员、上传者、方案所有者
4. 读取 `storageKey` 对应物理文件并强制附件下载
5. `TXT` 也按下载文件处理，不走浏览器内联预览

### 9.5 需求发布

1. `tech-needs` 后台主数据仍以 Payload Collection 为准
2. 当前仓库额外实现了 `/dashboard/needs` 中台能力与 `/api/dashboard/tech-needs*`
3. `status` 更新后，会同步反映到公开站 `/needs` 和方案详情中的关联需求状态

## 10. 外部服务与回退策略

### 10.1 PostgreSQL

- 通过 `@payloadcms/db-postgres` 连接
- 优先读取 `DATABASE_URI`，其次 `DATABASE_URL`
- 结构变化通过 `src/migrations/` 管理

### 10.2 Redis

- 用于邮箱 / 短信验证码缓存
- `REDIS_URL` 缺失时，OTP 会回退到进程内缓存
- 应用重启后，进程内验证码与频控状态会丢失

### 10.3 短信与限流

- 正式短信签名：`平台验证码`
- 模板编码：`100001`
- 场景名：`平台验证码`
- OTP 过期时间：300 秒
- 冷却限制：同一标识 60 秒内不可重复发送
- IP 频控：同一 IP 每小时最多 20 次

### 10.4 SMTP 邮件

- 通过 `@payloadcms/email-nodemailer` 接入
- 支持注册邮箱验证码、登录邮箱验证码和业务通知
- 若 SMTP 失败，注册 / 登录等主业务返回会按具体接口容错逻辑处理

### 10.5 文件与目录组织

- `media/document/proposals/`：提案附件
- `media/document/partners/`：伙伴相关文档
- `media/image/partners/logo/`：伙伴 Logo
- `media/image/partners/svg/`：伙伴 SVG
- `media/image/case-studies/cover/`：案例封面
- `media/image/users/avatar/`：用户头像
- `media/image/tech-needs/`：需求图片

所有目录映射都由 `module + assetCategory + storageKey` 自动维护。
