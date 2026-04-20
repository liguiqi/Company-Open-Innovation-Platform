# HeT Open Innovation Platform

Open Innovation Platform正式版落地仓库，基于 `Next.js 16 + Payload CMS 3 + PostgreSQL + Redis` 构建，统一承载公开门户、认证中心、开放创新工作台和 Payload Admin。

## Release

- 当前正式版：`v1.0.0`
- 发版日期：`2026-04-20`
- 当前分支基线：`dev-bugfix`
- 正式访问域名：`https://innovation.example.com`
- 本机应用监听：`127.0.0.1:3005`

### v1.0.0 发版摘要

- 完成公开站首页、需求大厅、生态伙伴、案例、流程页与统一深浅主题适配
- 完成合作伙伴注册、邮箱验证码注册、手机短信验证码注册
- 完成邮箱/手机密码登录与邮箱/短信验证码登录，验证码登录仅允许已有账号进入
- 完成方案提交、多附件上传下载、评审状态流转、评审意见同步更新
- 完成当前用户在 `/dashboard/settings` 自助维护个人信息并同步更新 Payload 用户数据
- 完成 Payload Admin 品牌化适配、域名 HTTPS 部署、systemd + nginx + standalone 落地
- 完成 docs 全量整理，覆盖架构、部署、运维、测试、发版与进度记录

## 当前已交付能力

### 公开站

- 首页 `/`
- 技术需求大厅 `/needs`、需求详情 `/needs/[id]`
- 生态伙伴 `/ecosystem`
- 联合案例 `/cases`、案例详情 `/cases/[slug]`
- 合作流程 `/process`
- 提交入口 `/submit`

### 认证中心

- 登录页 `/login`
- 注册页 `/register`
- 邮箱验证页 `/verify`
- 登录方式：
  - 邮箱 / 手机号 + 密码
  - 邮箱 / 短信验证码
- 注册方式：
  - 基础信息 + 邮箱验证
  - 基础信息 + 手机验证
  - 基础信息 + 邮箱/手机双验证
- 当前不开放用户名直接登录

### 工作台

- Dashboard 概览 `/dashboard`
- 方案管理 `/dashboard/proposals`
- 新建方案 `/dashboard/proposals/new`
- 方案详情与评审 `/dashboard/proposals/[id]`
- 个人设置 `/dashboard/settings`
- 伙伴管理 `/dashboard/partners`
- 用户管理 `/dashboard/users`

### Payload Admin

- 统一入口 `/admin`
- Collection 管理：`users`、`user-groups`、`tech-needs`、`proposals`、`partners`、`case-studies`、`media`

## 技术栈与运行形态

| 层             | 当前实现                                   |
| -------------- | ------------------------------------------ |
| Web 框架       | `Next.js 16.2.3`                           |
| CMS / 数据访问 | `Payload CMS 3.82.1`                       |
| 前端           | `React 19` + `Tailwind CSS 4`              |
| 数据库         | `PostgreSQL`                               |
| OTP 缓存       | `Redis`                                    |
| 邮件           | `nodemailer + SMTP`                        |
| 短信           | 阿里云 `Dypnsapi SendSmsVerifyCode`        |
| 进程守护       | `systemd`                                  |
| 反向代理       | `nginx`                                    |
| 运行模式       | `next build` + `standalone` + `pnpm start` |

当前链路为：

```text
Browser
  -> nginx :443
  -> innovation-platform.service
  -> .next/standalone/server.js
  -> Next.js App Router / Payload Local API
  -> PostgreSQL / Redis / media/
```

## 认证与验证码要点

### 登录

- `/api/auth/login`：邮箱或手机号密码登录
- `/api/auth/login-code/send`：发送邮箱验证码或短信验证码
- `/api/auth/login-code/verify`：验证码验证后仅允许已有账号进入
- 若验证码正确但账号不存在，前端提示前往注册，并预填邮箱或手机号

### 注册

- `/api/auth/email-code`：发送注册邮箱验证码
- `/api/sms/send`：发送注册短信验证码
- `/api/auth/register`：要求基础信息有效，且邮箱验证码或短信验证码至少完成一种
- 注册成功后自动跳回登录页，并透传默认登录标识

### 当前短信配置结论

- 当前正式可用的阿里云签名是 `平台验证码`
- 当前模板编码是 `100001`
- 当前业务场景名是 `平台验证码`
- 该签名由阿里云审核决定，不能仅靠代码把短信前缀改成其他名称

## 本地开发

### 启动步骤

```bash
pnpm install
pnpm db:up
pnpm generate:types
pnpm generate:importmap
pnpm seed
pnpm dev
```

默认开发地址：

- 公开站：`http://localhost:3000`
- Dashboard：`http://localhost:3000/dashboard`
- Admin：`http://localhost:3000/admin`

### 常用命令

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm seed
pnpm db:up
pnpm db:down
pnpm test:int
pnpm test:e2e
```

## 生产部署摘要

- systemd：`deploy/systemd/innovation-platform.service`
- nginx：`deploy/nginx/innovation.example.com.conf`
- 域名：`innovation.example.com`
- 应用端口：`3005`
- 数据目录：仓库根目录 `media/`

### 重要运维说明

当前生产使用 `.next/standalone` 运行，构建产物内会带一份 `.env` / `.env.local` 副本。因此：

1. 修改短信、邮件、数据库、域名等环境变量后，不能只改根目录 `.env`
2. 必须重新执行 `pnpm build`
3. 然后重启 `innovation-platform.service`

否则运行中的 standalone 仍可能读取旧配置。

## 发版验收基线

当前正式版建议至少验证以下路径：

1. `https://innovation.example.com/`
2. `https://innovation.example.com/login`
3. `https://innovation.example.com/register`
4. `https://innovation.example.com/dashboard`
5. `https://innovation.example.com/admin`
6. 注册短信接口 `/api/sms/send`
7. 当前用户设置保存 `/api/account/profile`

## 文档导航

- 文档总索引：[docs/README.md](docs/README.md)
- 架构文档：[docs/architecture/README.md](docs/architecture/README.md)
- 部署说明：[docs/deployment.md](docs/deployment.md)
- 测试与验收：[docs/testing.md](docs/testing.md)
- 运维手册：[docs/Ops/README.md](docs/Ops/README.md)
- 开发进度：[docs/progress/2026-04-20.md](docs/progress/2026-04-20.md)

## 已知约束

- 自动化测试仍未完整覆盖短信、邮件、附件权限与评审链路
- 邮件发送失败当前不会阻断主业务流
- Redis 缺失时 OTP 会退回进程内存，重启后验证码丢失
- 直接数据库改写会绕过 Payload Hook、访问控制和通知逻辑
