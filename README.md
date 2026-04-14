# H&T Open Innovation Platform

Open Innovation Platform的落地实现仓库，基于 `Next.js 16 + Payload CMS 3 + PostgreSQL + Redis` 构建。

## 已实现范围

- 公开页面：首页、技术需求大厅、生态伙伴目录、联合创新案例、合作流程
- 认证流程：邮箱注册与验证、邮箱/用户名密码登录、手机号短信验证码登录
- 工作台：方案列表、方案详情、方案提交、评审状态流转、用户与伙伴概览
- 内容后台：Payload Admin，统一入口 `/admin`
- 基础设施：PostgreSQL、Redis、Nginx 部署样例、seed 数据脚本、docs 记录

## 本地启动

1. 安装依赖：

```bash
pnpm install
```

2. 配置环境变量：

```bash
cp .env.example .env.local
```

3. 启动 PostgreSQL 和 Redis：

```bash
pnpm db:up
```

4. 生成 Payload 辅助文件：

```bash
pnpm generate:types
pnpm generate:importmap
```

5. 写入演示数据：

```bash
pnpm seed
```

6. 启动开发环境：

```bash
pnpm dev
```

## 常用命令

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm seed
pnpm db:up
pnpm db:down
```

## 默认路由

- 公开站点：`/`
- 登录页：`/login`
- 注册页：`/register`
- 工作台：`/dashboard`
- Payload Admin：`/admin`

## 文档

- 文档索引：[docs/README.md](docs/README.md)
- 部署说明：[docs/deployment.md](docs/deployment.md)
- 测试清单：[docs/testing.md](docs/testing.md)

## 注意事项

- 外部服务密钥只放在 `.env.local`，不入库
- 阿里云短信缺失正式模板编码时，开发环境会自动退回 mock 验证码模式
- `settings` 页面当前为只读视图，完整账号维护建议通过 `/admin` 完成
