# 部署与本地开发说明

## 1. 项目形态

当前仓库是单仓全栈应用，不存在独立的 “Payload 后端服务”：

- 页面层：`Next.js App Router`
- 内容与数据层：嵌入式 `Payload CMS 3`
- 主数据库：`PostgreSQL`
- 验证码缓存：`Redis`
- 媒体文件：仓库根目录 `media/`

这意味着线上访问链路是：

```text
浏览器 -> nginx -> Next.js standalone 进程 -> Payload Local API -> PostgreSQL / Redis
```

## 2. 环境变量与装载顺序

代码入口见 `src/lib/env.ts`，当前优先级如下：

1. 进程环境变量（如 `systemd Environment=` 或 shell 导出）
2. `.env.local`
3. `.env`
4. 代码中的默认值

建议从模板复制：

```bash
cp .env.example .env.local
```

关键变量如下：

| 变量                            | 是否必需 | 说明                                                           |
| ------------------------------- | -------- | -------------------------------------------------------------- |
| `PAYLOAD_SECRET`                | 是       | Dashboard 自定义会话签名与 Payload 配置共用密钥                |
| `NEXT_PUBLIC_SERVER_URL`        | 是       | 生成验证邮件链接、Payload `serverURL`、CSRF 白名单             |
| `DATABASE_URI` / `DATABASE_URL` | 是       | PostgreSQL 连接串，Payload 通过 `@payloadcms/db-postgres` 连接 |
| `POSTGRES_PORT`                 | 否       | 仅本地 `docker-compose.yml` 端口映射使用，默认 `5433`          |
| `REDIS_URL`                     | 否       | 短信验证码缓存连接；缺失时 OTP 回退到进程内存                  |
| `REDIS_PORT`                    | 否       | 仅本地 Docker 端口映射使用，默认 `6380`                        |
| `ALIYUN_SMS_*`                  | 否       | 短信联调；未配齐时自动进入 mock 短信模式                       |
| `SMTP_*`                        | 否       | 邮件发送；未配齐时邮件逻辑跳过，不阻断主流程                   |
| `DEFAULT_*`                     | 否       | `pnpm seed` 生成默认演示账号使用                               |

## 3. 本地开发启动

1. 安装依赖：

```bash
pnpm install
```

2. 启动 PostgreSQL 和 Redis：

```bash
pnpm db:up
```

默认映射如下：

- PostgreSQL：`127.0.0.1:5433 -> 5432`
- Redis：`127.0.0.1:6380 -> 6379`

3. 生成 Payload 辅助文件：

```bash
pnpm generate:types
pnpm generate:importmap
```

只要集合结构、Payload Admin 组件映射发生变更，就应重新执行这两条命令。

4. 写入演示数据：

```bash
pnpm seed
```

5. 启动开发服务器：

```bash
pnpm dev
```

默认开发地址：

- 公开站点：`http://localhost:3000`
- Dashboard：`http://localhost:3000/dashboard`
- Payload Admin：`http://localhost:3000/admin`
- Payload GraphQL：`http://localhost:3000/api/graphql`

## 4. 生产构建与启动

标准流程：

```bash
pnpm lint
pnpm typecheck
pnpm build
PORT=3005 pnpm start
```

其中：

- `pnpm build` 会执行 `next build`
- `postbuild` 会调用 `scripts/sync-standalone-assets.mjs`
- `pnpm start` 会执行 `scripts/start-standalone.mjs`

## 5. standalone 运行方式

当前生产不是直接跑 `next start`，而是使用 `output: 'standalone'`：

1. `pnpm build` 生成 `.next/standalone/server.js`
2. `scripts/sync-standalone-assets.mjs` 把 `.next/static` 和 `public/` 同步到 standalone 目录
3. `scripts/start-standalone.mjs` 设置 `INNOVATION_MEDIA_DIR=<repo>/media`
4. 然后直接启动 `.next/standalone/server.js`

### 媒体文件当前的真实落地方式

这里有一个很重要的实现细节：

- 媒体文件不再以 standalone 目录作为持久化目录
- 运行时统一使用仓库根目录 `media/`
- `sync-standalone-assets.mjs` 只会把历史残留的 `.next/standalone/media/` 合并回根目录 `media/`，用于兼容旧版本目录

因此，部署时必须保留仓库根目录下的 `media/`，而不是只保留 `.next/standalone`。

## 6. 当前服务器部署约定

当前仓库保留了系统级配置样例：

- systemd：`deploy/systemd/innovation-platform.service`
- nginx：`deploy/nginx/innovation.example.com.conf`

当前推荐线上端口与域名：

- 应用监听：`127.0.0.1:3005`
- 外部域名：`https://innovation.example.com`
- Nginx 监听：`80/443`

如果仍在当前混部机器上部署，应继续避开：

- `3000`（被其他项目占用）
- `5432`
- `6379`
- `8080`

## 7. 上线后的最小验活

```bash
curl -k -I https://innovation.example.com
curl -I http://127.0.0.1:3005
systemctl is-active innovation-platform.service
docker compose ps
```

另外建议手工打开：

1. `/`
2. `/login`
3. `/dashboard`
4. `/admin`

## 8. 相关文档

- 架构说明：`docs/architecture/system-architecture.md`
- 部署拓扑：`docs/architecture/deployment-topology.md`
- 运维手册：`docs/Ops/runbook.md`
- Payload 数据库访问：`docs/Ops/payload-database-access.md`
