# HeT Open Innovation Platform

> 文档类型：PRD + 当前落地说明
> 文档版本：`2026-04-30 / package 2.0.0`
> 项目代号：`innovation-platform`
> 默认开发域名：`https://innovation.example.com`
> 默认生产域名：`https://openinnovation.example.com`

---

## 1. 项目概述

### 1.1 项目定位

本项目是深圳Open Innovation智能控制股份有限公司面向全球创新伙伴的开放创新平台，承载以下核心业务：

1. 技术需求公开发布与展示。
2. 合作伙伴注册、登录与身份验证。
3. 创新方案在线提交、评审与状态流转。
4. 合作伙伴目录与联合创新案例展示。
5. 管理员在 Payload Admin 中完成内容、用户、媒体和业务主数据管理。

### 1.2 当前落地范围

当前仓库已经完成并可验证的能力包括：

1. 公开站首页、技术需求大厅、生态伙伴、完整伙伴目录、案例和流程页。
2. 邮箱/手机密码登录。
3. 邮箱/短信验证码登录，且仅允许已有账号登录。
4. 基础信息加邮箱/手机任一验证的合作伙伴注册。
5. 合作伙伴工作台、评审工作台、管理员工作台。
6. Payload Admin 后台。
7. 提案多附件上传、权限下载、评审意见与时间线沉淀。
8. 媒体按模块与资产分类自动归档。

### 1.3 目标用户

平台服务四类角色：

1. `visitor`
   未登录访客，浏览公开内容。
2. `partner`
   已注册合作伙伴，提交方案并查看自己的提案状态。
3. `reviewer`
   内部评审员，查看全部提案并执行评审流转。
4. `admin`
   管理员，拥有评审能力并负责后台主数据维护。

---

## 2. 产品目标

### 2.1 业务目标

1. 将技术需求、方案征集与合作流程统一到一个平台。
2. 提升外部伙伴的进入门槛清晰度和注册便利性。
3. 将方案提交、附件沉淀、评审意见和状态流转可视化。
4. 为内部管理员提供统一的内容、媒体、用户和提案管理后台。

### 2.2 使用体验目标

1. 公开站、登录页和工作台保持统一品牌和主题体验。
2. 同时适配浅色与深色主题。
3. 页面跳转保持轻量过渡，不出现风格断裂。
4. 附件上传、预览状态、错误提示和下载行为明确可感知。

### 2.3 运维目标

1. 公开站、工作台、Payload Admin 统一部署在一个 Node 进程中，降低运维复杂度。
2. 部署标准化为 `nginx + systemd + standalone`。
3. 数据、媒体和配置边界清晰，便于备份与迁移。

---

## 3. 核心模块与当前实现

### 3.1 公开站

当前公开站路由包括：

1. `/`
2. `/needs`
3. `/needs/[id]`
4. `/submit`
5. `/ecosystem`
6. `/ecosystem/directory`
7. `/cases`
8. `/cases/[slug]`
9. `/process`

当前实现要点：

1. 首页展示品牌介绍、精选需求、伙伴矩阵和案例入口。
2. 需求页实时读取 `tech-needs` 集合，状态与后台同步。
3. 生态伙伴页仅展示金牌战略伙伴。
4. 完整伙伴目录页按四级伙伴层级统一展示。
5. 案例页支持列表和详情。
6. 公开站右上角支持浅色/深色主题切换。

### 3.2 登录与注册

当前认证页包括：

1. `/login`
2. `/register`
3. `/verify`

当前实现要点：

1. 登录页提供两个标签：
   - `邮箱/手机密码登录`
   - `邮箱/短信验证码登录`
2. 登录验证码模式会自动识别邮箱或手机号通道。
3. 验证码正确但账号不存在时，不自动注册，而是提示用户前往注册页。
4. 注册页分为三个标签：
   - `基础信息`
   - `邮箱验证`
   - `手机验证`
5. 至少完成邮箱或手机其中一种验证后，才能创建合作伙伴账号。
6. 用户名仅作为后台唯一账号标识，不作为登录入口。

### 3.3 工作台

工作台核心路由包括：

1. `/dashboard`
2. `/dashboard/proposals`
3. `/dashboard/proposals/new`
4. `/dashboard/proposals/[id]`
5. `/dashboard/settings`
6. `/dashboard/partners`
7. `/dashboard/users`
8. `/dashboard/needs`

当前实现要点：

1. 合作伙伴默认只看到自己的提案数据。
2. 评审员和管理员可查看全部提案。
3. 提案详情页支持评审意见、状态流转和时间线显示。
4. `/dashboard/settings` 允许当前用户修改个人资料。
5. 本机主线仓库已经实现 `/dashboard/needs` 中台需求运营页，是否出现在生产环境需看部署同步状态。

### 3.4 Payload Admin

当前后台入口为 `/admin`。

当前实现要点：

1. 自定义了后台品牌 Logo、favicon 和底部声明。
2. 后台集合已经按业务域分组。
3. 支持媒体文件夹浏览。
4. `media` 集合可根据模块、资产分类和存储键快速识别用途。

---

## 4. 技术栈

### 4.1 应用技术栈

| 层级              | 选型               | 当前版本/说明  |
| ----------------- | ------------------ | -------------- |
| 前后端一体框架    | Next.js App Router | `16.2.3`       |
| CMS / Admin / API | Payload CMS        | `3.82.1`       |
| 语言              | TypeScript         | `5.7.x`        |
| 运行时 UI         | React              | `19.2.4`       |
| 样式系统          | Tailwind CSS       | `4.1.14`       |
| 图标              | Lucide React       | 当前仓库已使用 |
| 数据库            | PostgreSQL         | `16.x`         |
| 缓存 / OTP        | Redis              | `7.x`          |
| 邮件发送          | Nodemailer + SMTP  | 企业邮箱通道   |
| 短信发送          | 阿里云 `Dypnsapi`  | 验证码短信发送 |

### 4.2 设计与组件策略

当前项目并未落成一套独立的第三方组件库依赖面，而是采用：

1. `Tailwind CSS 4` 自定义样式。
2. 项目内自建组件。
3. Payload Admin 自带 UI 组件体系。
4. Lucide 图标补充视觉表达。

### 4.3 构建与脚本

当前关键脚本：

1. `pnpm dev`
2. `pnpm build`
3. `pnpm start`
4. `pnpm generate:types`
5. `pnpm generate:importmap`
6. `pnpm media:organize`
7. `pnpm lint`
8. `pnpm typecheck`

---

## 5. 系统架构

### 5.1 总体架构

```text
Browser
  -> HTTPS
  -> nginx
  -> 127.0.0.1:3005
  -> innovation-platform.service
  -> .next/standalone/server.js
  -> Next.js App Router
  -> Payload Local API
  -> PostgreSQL / Redis / media/
```

### 5.2 当前分层

```text
src/app
  -> 页面路由与 API Route

src/collections
  -> Payload Collections

src/hooks
  -> 提案通知、状态流转、需求编号生成、媒体同步

src/services
  -> 阿里云短信、邮件发送、Redis、限流

src/lib
  -> 环境变量、鉴权、校验器、媒体工具、时间线构建

src/components
  -> 公开站、登录注册、工作台与 Payload 后台扩展组件
```

### 5.3 部署架构

当前正式运行采用：

1. `nginx` 做 SSL 终止和反向代理。
2. `systemd` 守护 Node 服务。
3. `pnpm build` 生成 `.next/standalone`。
4. `pnpm start` 通过 `scripts/start-standalone.mjs` 拉起应用。

---

## 6. 目录结构

当前关键目录如下：

```text
src/
  app/
  collections/
  components/
  hooks/
  lib/
  services/

public/
  branding/

media/

deploy/
  nginx/
  systemd/

docs/
```

目录职责：

1. `src/app`
   路由、页面和 API Route。
2. `src/collections`
   Payload 业务集合定义。
3. `src/services`
   外部服务调用与限流缓存。
4. `public/branding`
   公开站与后台品牌静态资源。
5. `media`
   上传后的图片和附件。
6. `deploy`
   Nginx 与 systemd 模板。

---

## 7. 数据模型

### 7.1 当前 Collections

当前核心集合：

1. `users`
2. `user-groups`
3. `tech-needs`
4. `proposals`
5. `partners`
6. `case-studies`
7. `media`

### 7.2 Users

关键字段：

| 字段              | 说明                                  |
| ----------------- | ------------------------------------- |
| `username`        | 后台唯一用户名，不用于前台登录        |
| `email`           | 邮箱登录标识                          |
| `phone`           | 手机登录标识                          |
| `name`            | 联系人姓名                            |
| `company`         | 公司名称                              |
| `role`            | `admin / reviewer / partner / viewer` |
| `avatar`          | 头像媒体关系                          |
| `emailVerifiedAt` | 邮箱验证时间                          |
| `phoneVerifiedAt` | 手机验证时间                          |
| `lastAccessAt`    | 最后访问时间                          |

### 7.3 Tech Needs

关键字段：

| 字段          | 说明                                      |
| ------------- | ----------------------------------------- |
| `needId`      | 自动生成，格式 `RD-YYYY-NNN`              |
| `title`       | 需求标题                                  |
| `priority`    | `urgent / open / joint-research`          |
| `domain`      | `motor-control / sensor / materials / ai` |
| `productLine` | 产品线                                    |
| `description` | 正文描述                                  |
| `status`      | `open / in-progress / closed`             |
| `publishedAt` | 发布时间                                  |

### 7.4 Proposals

关键字段：

| 字段             | 说明                                        |
| ---------------- | ------------------------------------------- |
| `title`          | 方案标题                                    |
| `type`           | 方案类型                                    |
| `relatedNeed`    | 关联技术需求                                |
| `description`    | 技术描述                                    |
| `attachments`    | 与 `media` 的多关系                         |
| `submittedBy`    | 提交人                                      |
| `contactName`    | 联系人姓名                                  |
| `contactEmail`   | 联系邮箱                                    |
| `contactCompany` | 公司名称                                    |
| `status`         | `pending / reviewing / approved / rejected` |
| `reviewNotes`    | 评审意见                                    |
| `reviewedBy`     | 评审人                                      |
| `reviewTimeline` | 提交与评审时间线                            |

### 7.5 Partners

关键字段：

| 字段          | 说明                                        |
| ------------- | ------------------------------------------- |
| `name`        | 伙伴名称                                    |
| `brandPreset` | 预设 SVG 品牌                               |
| `logo`        | 自定义 Logo 文件                            |
| `website`     | 官网链接，仅后台保留                        |
| `category`    | 伙伴类型                                    |
| `tier`        | `strategic / certified / ecosystem / other` |
| `description` | 对外说明                                    |
| `products`    | 关键词                                      |
| `sortOrder`   | 排序权重                                    |

### 7.6 Media

当前媒体集合不仅负责上传，还负责目录组织。

关键字段：

| 字段            | 说明               |
| --------------- | ------------------ |
| `alt`           | 替代文本           |
| `purpose`       | `image / document` |
| `module`        | 所属业务模块       |
| `assetCategory` | 更细粒度资产分类   |
| `storageKey`    | 物理存储相对路径   |
| `uploadedBy`    | 上传人             |
| `proposal`      | 来源提案，可回指   |

---

## 8. 认证与权限

### 8.1 当前认证方式

平台并行支持四种用户使用感知上的登录/注册方式：

1. 邮箱 + 密码登录。
2. 手机号 + 密码登录。
3. 邮箱验证码登录。
4. 短信验证码登录。

系统内部对应两类核心链路：

1. 密码登录链路。
2. 验证码链路。

### 8.2 注册规则

当前注册要求：

1. 基础信息必填。
2. 用户名必须唯一。
3. 密码至少 6 位。
4. 邮箱或手机至少填写一种。
5. 邮箱验证码或短信验证码至少完成一种。

### 8.3 验证码登录规则

当前验证码登录规则：

1. 自动识别邮箱或手机号通道。
2. 验证码有效期 5 分钟。
3. 单通道发送冷却 60 秒。
4. 验证通过后必须命中后台已存在用户。
5. 若后台不存在账号，前端提示用户去注册。

### 8.4 权限矩阵

| 能力                       | visitor | partner |               reviewer               | admin |
| -------------------------- | :-----: | :-----: | :----------------------------------: | :---: |
| 浏览公开站                 |   ✅    |   ✅    |                  ✅                  |  ✅   |
| 提交方案                   |   ❌    |   ✅    |                  ❌                  |  ✅   |
| 查看自己的方案             |   ❌    |   ✅    |                  ✅                  |  ✅   |
| 查看全部方案               |   ❌    |   ❌    |                  ✅                  |  ✅   |
| 评审方案                   |   ❌    |   ❌    |                  ✅                  |  ✅   |
| 发布技术需求               |   ❌    |   ❌    | 本机主线支持，中台是否可用取决于部署 |  ✅   |
| 管理伙伴、案例、用户、媒体 |   ❌    |   ❌    |                  ❌                  |  ✅   |

---

## 9. 媒体与附件策略

### 9.1 当前支持类型

提案附件当前支持：

1. `txt`
2. `pdf`
3. `ppt`
4. `pptx`
5. `doc`
6. `docx`
7. `zip`
8. `rar`

### 9.2 上传限制

当前三层限制为：

1. 业务上限：单文件 `100MB`
2. Next：`experimental.proxyClientMaxBodySize = 120mb`
3. Nginx：`client_max_body_size 120M`

### 9.3 当前媒体归档策略

媒体当前按以下维度管理：

1. `module`
2. `assetCategory`
3. `folder`
4. `storageKey`

设计目的：

1. 把伙伴 Logo、提案附件、案例图片、需求图片、用户头像分开管理。
2. 在 Payload 后台直接支持按目录浏览。
3. 降低媒体库混杂带来的运维成本。

### 9.4 TXT 下载行为

为了避免浏览器直接预览中文 TXT 时出现乱码，当前对 `document` 类型附件统一返回下载响应头，TXT 也按下载处理。

---

## 10. 关键业务流

### 10.1 注册流程

```text
填写基础信息
  -> 邮箱或手机发送验证码
  -> 验证码校验通过
  -> 创建 users 记录
  -> 跳转回登录页
```

### 10.2 验证码登录流程

```text
输入邮箱或手机号
  -> 发送登录验证码
  -> 校验验证码
  -> 查询 users 是否存在
  -> 存在则创建登录态
  -> 不存在则提示去注册
```

### 10.3 提案评审流程

```text
合作伙伴提交提案
  -> 记录 attachments 与 submittedBy
  -> 自动创建首条 reviewTimeline
  -> 评审员/管理员查看详情
  -> 更新 reviewNotes + status
  -> 追加 reviewTimeline
  -> 可触发通知链路
```

### 10.4 技术需求联动流程

```text
管理员更新 tech-needs.status
  -> 公开需求大厅刷新状态
  -> 需求详情刷新状态
  -> 工作台提案列表与详情中的关联状态刷新
```

---

## 11. 运行与部署

### 11.1 当前运行方式

当前正式运行链路：

1. `pnpm build`
2. 生成 `.next/standalone`
3. `pnpm start`
4. `systemd` 守护进程
5. `nginx` 反向代理到 `127.0.0.1:3005`

### 11.2 当前部署模板

仓库内已有：

1. `deploy/systemd/innovation-platform.service`
2. `deploy/nginx/innovation.example.com.conf`

### 11.3 环境变量重点

必须重点维护：

1. `NEXT_PUBLIC_SERVER_URL`
2. `PAYLOAD_ALLOWED_ORIGINS`
3. `PAYLOAD_SECRET`
4. `DATABASE_URI` 或 `DATABASE_URL`
5. `REDIS_URL`
6. `SMTP_*`
7. `ALIYUN_SMS_*`

### 11.4 构建注意事项

只要改动以下内容，就必须重新构建：

1. 环境变量。
2. 页面代码。
3. Payload Collections。
4. 品牌静态资源。
5. Next 配置。

---

## 12. 测试与验收

### 12.1 自动化基础

当前仓库支持：

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test:int`
4. `pnpm test:e2e`

### 12.2 核心人工验收路径

1. 打开公开站各页面并切换主题。
2. 用邮箱/手机密码登录。
3. 用邮箱/短信验证码登录已存在账号。
4. 注册一个新合作伙伴账号。
5. 上传一个或多个附件并验证下载。
6. 评审员更新提案状态并确认时间线刷新。
7. 管理员修改需求状态并确认公开页同步。
8. 当前用户在 `/dashboard/settings` 修改个人资料并保存。

---

## 13. 当前已知约束

1. 本地主线可能领先生产环境，特别是 `/dashboard/needs` 等中台能力。
2. 阿里云短信签名当前必须使用已审核通过的 `平台验证码`。
3. 若遗漏目标域名到 `PAYLOAD_ALLOWED_ORIGINS`，Admin 保存和登出会异常。
4. 若只迁移数据库、不迁移 `media/`，会出现附件和图片丢失。
5. Redis 缺失时，验证码体验与限流能力会退化。

---

## 14. 结论

截至 `2026-04-30`，该项目已经不是原型或静态站点，而是完成了以下一体化落地：

1. 公开站内容展示。
2. 合作伙伴注册与登录。
3. 工作台提案提交流程。
4. 评审流转与时间线沉淀。
5. Payload Admin 主数据管理。
6. 媒体归档、权限下载与主题化前端体验。

后续如再扩展模块，应继续遵循当前这套一体化架构与文档维护方式：路由、集合、媒体、认证、部署和运维必须同步记录。
