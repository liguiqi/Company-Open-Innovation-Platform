# 测试与验收说明

更新日期：`2026-04-30`

## 1. 常用命令

```bash
pnpm lint
pnpm typecheck
pnpm test:int
pnpm test:e2e
pnpm build
```

若首次运行 Playwright：

```bash
pnpm exec playwright install chromium
```

## 2. 自动化测试现状

| 层级     | 文件 / 命令                      | 当前覆盖内容                             |
| -------- | -------------------------------- | ---------------------------------------- |
| Lint     | `pnpm lint`                      | ESLint + oxlint                          |
| 类型检查 | `pnpm typecheck`                 | TypeScript 无输出校验                    |
| 集成测试 | `tests/int/api.int.spec.ts`      | 初始化 Payload 并校验 `users` 集合可查询 |
| E2E      | `tests/e2e/frontend.e2e.spec.ts` | 首页可访问、主标题与基础公开站渲染       |
| E2E      | `tests/e2e/admin.e2e.spec.ts`    | `/admin` 登录、进入列表与创建页          |

### E2E 运行前提

- 本地开发服务器跑在 `http://localhost:3000`
- Playwright 配置会自动执行 `pnpm dev`
- PostgreSQL 必须可连接
- 当前机器需已安装 Chromium 二进制

## 3. 建议的人工验收路径

### 3.1 基础可用性

1. 打开首页 `/`
2. 打开 `/needs`、`/ecosystem`、`/ecosystem/directory`、`/cases`、`/process`
3. 打开 `/login`、`/register`
4. 确认 `/dashboard` 未登录时跳转 `/login`
5. 确认 `/admin` 可打开 Payload Admin 登录页
6. 切换深浅主题，确认公开站、登录页和工作台视觉一致

### 3.2 认证链路

1. 使用邮箱或手机号 + 密码登录
2. 使用邮箱验证码登录已有账号
3. 使用短信验证码登录已有账号
4. 使用邮箱注册新合作伙伴账号
5. 使用手机号注册新合作伙伴账号
6. 注册成功后自动跳回登录页
7. 对未注册邮箱 / 手机号走验证码登录，应被提示前往注册，不自动建号

### 3.3 业务链路

1. 合作伙伴提交新方案
2. 上传一个或多个附件
3. 当前附件类型校验：`txt / pdf / ppt / pptx / doc / docx / zip / rar`
4. 当前单文件业务上限：`100MB`
5. 管理员 / 评审员在 `/dashboard/proposals` 查看方案
6. 管理员 / 评审员更新状态并填写评审意见
7. 进入方案详情页，确认评审时间线、状态和评审意见同步更新
8. 管理员在 Payload Admin 修改需求 `status` 后，确认 `/needs`、需求详情页与 `/dashboard/proposals` 中关联需求状态同步更新

### 3.4 个人设置链路

1. 登录后进入 `/dashboard/settings`
2. 修改姓名、用户名、公司、邮箱或手机
3. 点击“保存更新”
4. 刷新页面，确认表单值、顶部用户信息和重新登录后的展示一致
5. 如变更邮箱或手机，确认对应验证状态按规则更新

### 3.5 上传与下载链路

1. 上传一个 `TXT` 附件并从方案详情下载
2. 确认浏览器行为是直接下载，而不是内联预览
3. 上传一个明显大于旧版限制的文件，确认历史上传阈值问题已消失
4. 建议至少验证一次 `30MB` 附件上传，确认 Next / Nginx / 业务接口三层限制已同步
5. 使用非权限账号访问 `/api/attachments/[id]`，确认被拒绝

### 3.6 管理后台链路

1. 进入 `/admin/collections/users`
2. 确认 `users` 列表包含“最后访问时间”
3. 使用某个账号登录工作台后，再回到后台查看 `lastAccessAt` 是否刷新
4. 进入 `/admin/collections/proposals`，确认单条提案的 `reviewTimeline`、`attachments` 与 `media` 关联可见
5. 进入 `media`，确认按文件夹与模块字段可区分不同资产

## 4. 演示账号来源

默认演示账号来自 `.env.local` / `.env` 中的 `DEFAULT_*` 变量：

- 管理员：`DEFAULT_ADMIN_*`
- 评审员：`DEFAULT_REVIEWER_*`
- 合作伙伴：`DEFAULT_PARTNER_*`

## 5. 当前自动化覆盖缺口

仍未完整覆盖以下链路：

- 邮箱注册与邮箱验证成功 / 失败分支
- 短信发送、短信限流与阿里云错误码分支
- 登录验证码“未注册引导去注册”的完整前端交互
- 方案附件上传、超大文件边界、权限下载与失败回滚
- 评审状态流转、通知邮件与 `reviewTimeline` 自动更新
- `users.lastAccessAt` 的自动刷新回归
- `/dashboard/needs` 本地中台需求管理能力

## 6. 当前已知限制

- 自动化测试仍偏轻量，正式验收仍需人工走主链路
- 阿里云短信签名必须使用审核通过的 `平台验证码`
- SMTP 发送失败不会阻断所有主业务链路，但会影响验证码或通知体验
- Redis 缺失时 OTP 会退回进程内存，应用重启后验证码与冷却计数会丢失
- 若 Nginx 或 Next 的请求体限制未同步，超过 `100MB` 的附件仍可能在代理层或框架层失败
