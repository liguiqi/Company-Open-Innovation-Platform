# 测试与验收说明

## 1. 常用命令

```bash
pnpm lint
pnpm typecheck
pnpm test:int
pnpm test:e2e
```

如果是第一次在当前机器运行 Playwright，或升级过 Playwright 版本，需要先安装浏览器二进制：

```bash
pnpm exec playwright install chromium
```

## 2. 自动化测试现状

| 层级     | 文件                             | 当前覆盖内容                                                       |
| -------- | -------------------------------- | ------------------------------------------------------------------ |
| Lint     | `pnpm lint`                      | ESLint + oxlint                                                    |
| 类型检查 | `pnpm typecheck`                 | TypeScript 无输出校验                                              |
| 集成测试 | `tests/int/api.int.spec.ts`      | 初始化 Payload 并验证 `users` 集合可查询                           |
| E2E      | `tests/e2e/frontend.e2e.spec.ts` | 首页可访问、标题和主标题文案正确                                   |
| E2E      | `tests/e2e/admin.e2e.spec.ts`    | 创建测试管理员、登录 `/admin`、校验 Dashboard / List / Create 流程 |

### E2E 运行前提

- 本地开发服务器默认跑在 `http://localhost:3000`
- Playwright 配置会自动执行 `pnpm dev`
- PostgreSQL 需可连接，否则 Payload 初始化和种子账号创建会失败
- 当前 E2E 依赖本机已安装 Chromium 浏览器二进制

## 3. 建议的人工验收路径

### 3.1 基础可用性

1. 打开首页 `/`
2. 打开 `/needs`、`/ecosystem`、`/cases`、`/process`
3. 打开 `/login`、`/register`
4. 确认 `/dashboard` 未登录时会跳转到 `/login`
5. 确认 `/admin` 可打开 Payload Admin 登录页

### 3.2 认证链路

1. 合作伙伴通过邮箱注册
2. 收到验证邮件并点击验证链接
3. 验证完成后自动写入 Dashboard 登录态
4. 使用邮箱/手机号 + 密码登录成功进入 `/dashboard`
5. 使用短信验证码登录；如果短信环境未配齐，开发环境应返回 `debugCode`

### 3.3 业务链路

1. 合作伙伴提交新方案
2. 上传一个或多个附件（支持 `txt/pdf/ppt/pptx/doc/docx`，单文件不超过 20MB）
3. 管理员 / 评审员在 `/dashboard/proposals` 查看方案
4. 管理员 / 评审员更新状态并填写评审意见
5. 合作伙伴重新进入详情页，确认状态、评审意见和附件下载都正常

## 4. 演示账号来源

- 管理员：`.env.local` 中的 `DEFAULT_ADMIN_*`
- 评审员：`.env.local` 中的 `DEFAULT_REVIEWER_*`
- 合作伙伴：`.env.local` 中的 `DEFAULT_PARTNER_*`

## 5. 当前自动化覆盖缺口

当前自动化测试仍然偏轻量，尚未完整覆盖以下链路：

- 邮箱注册与邮箱验证成功/失败分支
- 短信发送、验证码校验与限流
- 方案提交接口的附件上传与失败回滚
- `partner` 只能查看自己的提案这一访问控制
- 附件下载权限校验
- `needId` 自动生成与邮件通知 Hook

## 6. 已知限制

- `settings` 页面当前仅提供只读展示
- 阿里云短信变量未配齐时，系统自动回退到 mock 短信模式
- SMTP 发送失败不会阻断注册、提案和状态流转主链路
- 直接数据库查询不会体现 Payload 的访问控制；如需按业务权限看数据，请优先用 `/admin`、REST 或 GraphQL
