# 部署与本地开发说明

更新日期：`2026-04-20`

## 1. 项目形态

当前仓库是单仓全栈应用：

- 页面层：`Next.js App Router`
- 内容与数据层：嵌入式 `Payload CMS 3`
- 主数据库：`PostgreSQL`
- 验证码缓存：`Redis`
- 媒体文件：仓库根目录 `media/`
- 生产守护：`systemd + nginx`

线上真实链路：

```text
浏览器 -> nginx -> innovation-platform.service -> .next/standalone/server.js
      -> Next.js / Payload Local API -> PostgreSQL / Redis / media/
```

## 2. 环境变量与加载顺序

代码入口：`src/lib/env.ts`

加载优先级：

1. 进程环境变量
2. `.env.local`
3. `.env`
4. 代码默认值

建议从模板初始化：

```bash
cp .env.example .env.local
```

关键变量：

| 变量                            | 是否必需 | 说明                                      |
| ------------------------------- | -------- | ----------------------------------------- |
| `PAYLOAD_SECRET`                | 是       | Dashboard 自定义会话与 Payload 共用密钥   |
| `NEXT_PUBLIC_SERVER_URL`        | 是       | 域名、验证链接、CSRF 白名单、邮件链接基址 |
| `DATABASE_URI` / `DATABASE_URL` | 是       | PostgreSQL 连接串                         |
| `REDIS_URL`                     | 否       | OTP 缓存；缺失时退回进程内存              |
| `ALIYUN_SMS_*`                  | 否       | 短信联调；未配齐时仅开发环境可 mock       |
| `SMTP_*`                        | 否       | 邮件验证码与通知；未配齐时邮件发送跳过    |
| `DEFAULT_*`                     | 否       | `pnpm seed` 生成默认账号所用              |

## 3. 当前正式短信配置口径

当前线上实测可用的阿里云短信参数是：

- 签名：`平台验证码`
- 模板：`100001`
- 场景名：`平台验证码`
- 服务端点：`dypnsapi.aliyuncs.com`

注意：短信签名不是代码里任意改名就能生效，必须使用阿里云已审核通过的签名。

## 4. 本地开发启动

1. 安装依赖：

```bash
pnpm install
```

2. 启动 PostgreSQL 和 Redis：

```bash
pnpm db:up
```

默认端口映射：

- PostgreSQL：`127.0.0.1:5433 -> 5432`
- Redis：`127.0.0.1:6380 -> 6379`

3. 生成 Payload 辅助文件：

```bash
pnpm generate:types
pnpm generate:importmap
```

4. 写入演示数据：

```bash
pnpm seed
```

5. 启动开发环境：

```bash
pnpm dev
```

本地默认地址：

- 公开站点：`http://localhost:3000`
- Dashboard：`http://localhost:3000/dashboard`
- Payload Admin：`http://localhost:3000/admin`
- GraphQL：`http://localhost:3000/api/graphql`

## 5. 生产构建与启动

标准流程：

```bash
pnpm lint
pnpm typecheck
pnpm build
PORT=3005 pnpm start
```

其中：

- `pnpm build` 执行 `next build`
- `postbuild` 执行 `scripts/sync-standalone-assets.mjs`
- `pnpm start` 执行 `scripts/start-standalone.mjs`

## 6. standalone 运行机制

### 6.1 构建产物

`pnpm build` 会生成：

- `.next/standalone/server.js`
- `.next/standalone/.env`
- `.next/standalone/.env.local`
- `.next/standalone/public`
- `.next/standalone/.next/static`

### 6.2 关键运维事实

当前正式环境不是直接读取仓库根目录 `.env` 运行，而是读取构建产物里的 `.next/standalone/.env*` 副本。因此：

- 修改根目录 `.env` / `.env.local` 后，若不重新构建，运行中的服务仍可能拿旧配置
- 短信签名、邮件配置、域名地址、数据库等环境项变更后，必须重新执行 `pnpm build`
- 重新构建后还必须 `sudo systemctl restart innovation-platform.service`

这条规则已经在短信签名回退修复中被实际验证。

## 7. 媒体文件与持久化

当前媒体持久化路径是仓库根目录 `media/`，不是 `.next/standalone/media`。

`scripts/sync-standalone-assets.mjs` 的行为：

- 复制 `.next/static` 到 standalone 目录
- 复制 `public/` 到 standalone 目录
- 如发现旧版本把媒体写到 `.next/standalone/media`，会先合并回根目录 `media/`
- 然后删除 `.next/standalone/media`

部署时必须保留：

- `media/`
- `public/`
- `example.com_nginx/`

## 8. 当前服务器部署约定

仓库内样例：

- systemd：`deploy/systemd/innovation-platform.service`
- nginx：`deploy/nginx/innovation.example.com.conf`

当前推荐线上约定：

- 应用监听：`127.0.0.1:3005`
- 外部域名：`https://innovation.example.com`
- Nginx：监听 `80/443`

当前机器为混部环境，应继续避开：

- `3000`
- `5432`
- `6379`
- `8080`

## 9. 上线后的最小验活

```bash
curl -k -I https://innovation.example.com
curl -I http://127.0.0.1:3005
systemctl is-active innovation-platform.service
docker compose ps
```

建议再手工打开：

1. `/`
2. `/login`
3. `/register`
4. `/dashboard`
5. `/admin`

## 10. 相关文档

- 架构说明：`docs/architecture/system-architecture.md`
- 部署拓扑：`docs/architecture/deployment-topology.md`
- 运维手册：`docs/Ops/runbook.md`
- 发版说明：`docs/Ops/release-and-rollback.md`
