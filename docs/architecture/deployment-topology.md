# 实际部署拓扑说明

更新日期：`2026-04-17`

## 1. 当前部署目标

当前项目的实际可用部署目标：

- 域名：`innovation.example.com`
- 协议：`HTTPS`
- 应用监听：`127.0.0.1:3005`
- 宿主机：同机还承载其他项目，因此端口必须避让

当前仓库对应的是单机混部场景，不是多服务拆分部署。

## 2. 当前真实链路

```text
浏览器
  -> https://innovation.example.com:443
  -> nginx
  -> proxy_pass http://127.0.0.1:3005
  -> systemd 守护的 pnpm start
  -> .next/standalone/server.js
  -> Payload Local API
  -> PostgreSQL / Redis
```

需要特别注意：

- Payload Admin、REST、GraphQL、公开页面和 Dashboard 都由同一个 Node 进程提供
- 没有额外的 Payload 独立容器或独立后端 API 服务

## 3. 主机内组件与端口

| 组件                | 当前形态     | 端口           | 说明                             |
| ------------------- | ------------ | -------------- | -------------------------------- |
| Nginx               | 系统服务     | `80/443`       | SSL 终止、域名转发、静态资源缓存 |
| innovation-platform | systemd 服务 | `3005`         | 当前项目应用进程                 |
| PostgreSQL          | Docker 容器  | `5433 -> 5432` | Payload 主数据库                 |
| Redis               | Docker 容器  | `6380 -> 6379` | 短信 OTP                         |
| 本地开发服务器      | `pnpm dev`   | `3000`         | 仅开发 / Playwright 联调         |
| bothub 前端         | 其他项目     | `3000`         | 当前线上同机环境已占用           |
| bothub 后端         | 其他项目     | `8080`         | 当前线上同机环境已占用           |

当前可见的本项目容器名：

- `0_kaifang_platform0-postgres-1`
- `0_kaifang_platform0-redis-1`

## 4. 配置文件落点

### 4.1 Nginx

仓库样例：

- `deploy/nginx/innovation.example.com.conf`

核心规则：

- `80 -> 301 -> HTTPS`
- `server_name innovation.example.com`
- `/` 代理到 `http://127.0.0.1:3005`
- `/_next/static` 做长期缓存
- 证书目录指向仓库下 `example.com_nginx/`

### 4.2 systemd

仓库样例：

- `deploy/systemd/innovation-platform.service`

关键配置：

- `User=lgq`
- `WorkingDirectory=/home/deploy/apps/open-innovation-platform`
- `Environment=PORT=3005`
- `ExecStart=... pnpm.js start`
- `Restart=always`

## 5. 构建与启动链路

### 5.1 构建阶段

```bash
pnpm build
```

当前会执行：

1. `next build`
2. `postbuild`
3. `scripts/sync-standalone-assets.mjs`

`sync-standalone-assets.mjs` 的真实行为是：

- 把 `.next/static` 复制到 `.next/standalone/.next/static`
- 把 `public/` 复制到 `.next/standalone/public`
- 如果旧版本曾把媒体写到 `.next/standalone/media`，会先合并回根目录 `media/`
- 然后删除 `.next/standalone/media`

### 5.2 运行阶段

```bash
pnpm start
```

当前会执行：

1. `scripts/start-standalone.mjs`
2. 设置 `INNOVATION_MEDIA_DIR=<repo>/media`
3. 启动 `.next/standalone/server.js`

当前媒体的持久化根目录是仓库根目录 `media/`，而不是 standalone 内部目录。

## 6. 数据与持久化

### 6.1 数据库

- 数据库类型：`PostgreSQL`
- 默认业务库：`innovation_platform`
- 连接变量：`DATABASE_URI` / `DATABASE_URL`
- Docker Volume：`pgdata`

### 6.2 Redis

- 连接变量：`REDIS_URL`
- Docker Volume：`redisdata`
- 当前只用于短信验证码，不承担业务主数据

### 6.3 文件与证书

部署时必须保留以下目录：

- `media/`：上传附件与图片
- `public/`：品牌资源与静态文件
- `example.com_nginx/`：证书文件

## 7. 环境变量来源

当前变量来源分三类：

1. 进程级环境变量（例如 systemd `Environment=`）
2. `.env.local`
3. `.env`

`src/lib/env.ts` 会先读 `.env.local`，再读 `.env`，但不会覆盖已有进程变量。因此线上如果既有 systemd 环境变量又有 `.env.local`，以进程环境变量为准。

## 8. 当前健康检查方式

当前项目没有独立 `/health`，建议组合检查：

```bash
curl -k -I https://innovation.example.com
curl -I http://127.0.0.1:3005
systemctl is-active innovation-platform.service
docker compose ps
```

如果需要更深入地确认 Payload 和数据库链路，可以再补一条：

```bash
docker compose exec -T postgres psql -U payload -d innovation_platform -c '\dt'
```

## 9. 当前部署注意事项

- 重启应用时，Nginx 可能短暂返回 `502`
- 校验 Nginx 配置请使用 `sudo nginx -t`
- 当前是混部环境，不要占用 `3000 / 5432 / 6379 / 8080`
- 短信真实发送依赖完整阿里云模板配置，缺失时只能使用 mock 模式
- 邮件发送失败不会阻断主流程，但需要通过日志观察
- 直接连接 PostgreSQL 查看数据时，看到的是原始表，不会自动体现 Payload 访问控制
