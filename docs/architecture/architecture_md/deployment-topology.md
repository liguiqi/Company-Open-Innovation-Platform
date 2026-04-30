# 实际部署拓扑说明

更新日期：`2026-04-30`

## 1. 当前部署目标

当前需要同时区分两套环境口径：

| 环境         | 域名                                         | 角色说明                                      |
| ------------ | -------------------------------------------- | --------------------------------------------- |
| 本机开发环境 | `https://innovation.example.com`     | 当前仓库所在主环境，承载日常开发、联调与验收  |
| 生产调试环境 | `https://openinnovation.example.com` | 10.0.0.1 上的部署实例，生产更新需显式授权 |

两套环境都使用：

- `HTTPS`
- Node 应用监听 `127.0.0.1:3005`
- `nginx + systemd + standalone`
- `PostgreSQL + Redis + media/`

## 2. 当前真实链路

### 2.1 本机开发环境

```text
Browser
  -> https://innovation.example.com:443
  -> nginx
  -> proxy_pass http://127.0.0.1:3005
  -> innovation-platform.service
  -> pnpm start
  -> scripts/start-standalone.mjs
  -> .next/standalone/server.js
  -> Next.js App Router / Payload Local API
  -> PostgreSQL / Redis / media/
```

### 2.2 生产调试环境

```text
Browser
  -> https://openinnovation.example.com:443
  -> nginx
  -> proxy_pass http://127.0.0.1:3005
  -> innovation-platform.service
  -> pnpm start
  -> .next/standalone/server.js
  -> PostgreSQL / Redis / media/
```

## 3. 主机内组件与端口

| 组件                | 形态         | 端口           | 说明                                              |
| ------------------- | ------------ | -------------- | ------------------------------------------------- |
| Nginx               | 系统服务     | `80/443`       | SSL 终止、域名分发、静态资源缓存、请求体大小控制  |
| innovation-platform | systemd 服务 | `3005`         | 当前项目应用进程                                  |
| PostgreSQL          | Docker 容器  | `5433 -> 5432` | Payload 主数据库（本机开发环境）                  |
| Redis               | Docker 容器  | `6380 -> 6379` | 验证码缓存与限流辅助（本机开发环境）              |
| 本地开发服务器      | `pnpm dev`   | `3000`         | 仅用于开发态 HMR / Playwright，不属于正式运行拓扑 |

## 4. 配置文件落点

### 4.1 Nginx

本机当前生效配置：

- `/etc/nginx/sites-available/innovation-platform-apps.conf`

仓库模板：

- `deploy/nginx/innovation.example.com.conf`

当前关键规则：

- `80 -> 301 -> HTTPS`
- `server_name innovation.example.com`
- `/` 代理到 `http://127.0.0.1:3005`
- `/_next/static` 走长期缓存
- `client_max_body_size 120M`
- 证书目录指向仓库下 `example.com_nginx/`

生产调试环境的站点配置应使用：

- `/etc/nginx/sites-available/openinnovation.example.com.conf`

### 4.2 systemd

本机当前生效配置：

- `/etc/systemd/system/innovation-platform.service`

仓库模板：

- `deploy/systemd/innovation-platform.service`

关键项：

- `WorkingDirectory=/home/deploy/apps/open-innovation-platform`
- `Environment=PORT=3005`
- `ExecStart=... pnpm.js start`
- `Restart=always`

## 5. 构建与运行链路

### 5.1 构建

```bash
pnpm build
```

构建时会生成 `.next/standalone`，同时同步：

- `.next/static`
- `public/`
- `.env`
- `.env.local`

### 5.2 运行

```bash
pnpm start
```

执行链路：

1. `scripts/start-standalone.mjs`
2. 设置 `INNOVATION_MEDIA_DIR=<repo>/media`
3. 动态加载 `.next/standalone/server.js`

### 5.3 关键运行约束

1. 当前正式运行不直接读取仓库根目录 `.env`，而是读取 standalone 目录中的构建产物副本。
2. 只改环境变量而不重新 `pnpm build`，服务仍可能使用旧的短信、邮件、域名或数据库配置。
3. `next.config.ts` 当前启用了 `experimental.proxyClientMaxBodySize = 120mb`，用于给 100MB 单文件附件上传留出 multipart 头部冗余空间。

## 6. 数据与持久化

### 6.1 数据库

- 类型：`PostgreSQL`
- 业务库：`innovation_platform`
- 连接变量：`DATABASE_URI` / `DATABASE_URL`
- Docker Volume：`pgdata`

### 6.2 Redis

- 连接变量：`REDIS_URL`
- Docker Volume：`redisdata`
- 当前用途：邮箱 / 短信验证码缓存与频控辅助

### 6.3 文件与证书

必须保留：

- `media/`：上传附件与图片
- `public/`：品牌资源与站点静态文件
- `example.com_nginx/`：SSL 证书文件

## 7. 当前健康检查方式

当前没有独立 `/health`，建议使用组合验活：

```bash
curl -k -I https://innovation.example.com
curl -k -I https://openinnovation.example.com
curl -I http://127.0.0.1:3005
systemctl is-active innovation-platform.service
docker compose ps
```

如需进一步确认验证码或上传链路：

```bash
curl -sk -H 'Content-Type: application/json' \
  -d '{"phone":"13800000000"}' \
  https://innovation.example.com/api/sms/send
```

## 8. 当前部署注意事项

1. 生产环境同步必须获得明确授权，不能把“本机推送到远程仓库”误当成“已部署生产”。
2. 当前本机 Nginx 与系统服务都在混部主机上运行，修改站点配置前必须确认不会影响其他域名。
3. 上传链路涉及三层限制：业务接口 `100MB`、Next `120mb`、Nginx `120M`，任一层未更新都可能导致 `413` 或上传失败。
4. 当前短信签名必须使用阿里云已审核通过的 `平台验证码`，不能只改代码前缀。
5. `media/` 与数据库必须成对迁移；只恢复其中一项会出现提案附件、案例图片或伙伴 Logo 丢失。
