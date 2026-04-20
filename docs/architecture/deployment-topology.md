# 实际部署拓扑说明

更新日期：`2026-04-20`

## 1. 当前部署目标

当前项目正式对外提供：

- 域名：`innovation.example.com`
- 协议：`HTTPS`
- 应用监听：`127.0.0.1:3005`
- 宿主机：`10.0.0.2`

当前环境是单机混部，不是多服务拆分部署。

## 2. 当前真实链路

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

## 3. 主机内组件与端口

| 组件                | 形态         | 端口           | 说明                             |
| ------------------- | ------------ | -------------- | -------------------------------- |
| Nginx               | 系统服务     | `80/443`       | SSL 终止、域名转发、静态资源缓存 |
| innovation-platform | systemd 服务 | `3005`         | 当前项目应用进程                 |
| PostgreSQL          | Docker 容器  | `5433 -> 5432` | Payload 主数据库                 |
| Redis               | Docker 容器  | `6380 -> 6379` | 验证码缓存                       |
| 本地开发服务器      | `pnpm dev`   | `3000`         | 仅开发 / Playwright 联调         |
| bothub 项目         | 其他项目     | `3000 / 8080`  | 当前同机环境已占用               |

## 4. 配置文件落点

### 4.1 Nginx

当前系统生效配置：

- `/etc/nginx/sites-enabled/innovation-platform-apps.conf`

仓库样例：

- `deploy/nginx/innovation.example.com.conf`

核心规则：

- `80 -> 301 -> HTTPS`
- `server_name innovation.example.com`
- `/` 代理到 `http://127.0.0.1:3005`
- `/_next/static` 走长期缓存
- 证书目录指向仓库下 `example.com_nginx/`

### 4.2 systemd

系统生效配置：

- `/etc/systemd/system/innovation-platform.service`

仓库样例：

- `deploy/systemd/innovation-platform.service`

关键项：

- `User=lgq`
- `WorkingDirectory=/home/deploy/apps/open-innovation-platform`
- `Environment=PORT=3005`
- `ExecStart=... pnpm.js start`
- `Restart=always`

## 5. 构建与运行链路

### 5.1 构建

```bash
pnpm build
```

执行后会生成 `.next/standalone`，并把：

- `.next/static`
- `public/`
- `.env`
- `.env.local`

一并带入 standalone 运行目录。

### 5.2 运行

```bash
pnpm start
```

执行链路：

1. `scripts/start-standalone.mjs`
2. 设置 `INNOVATION_MEDIA_DIR=<repo>/media`
3. 动态加载 `.next/standalone/server.js`

### 5.3 关键运维经验

正式环境已经验证：

- 仅修改仓库根目录 `.env` 不足以改变线上运行配置
- 由于 `.next/standalone/.env*` 是构建时副本，环境变量变化后必须重新 `pnpm build`
- 重新构建后仍需 `sudo systemctl restart innovation-platform.service`

这条规则尤其影响短信签名、邮件配置、域名与数据库连接等项。

## 6. 数据与持久化

### 6.1 数据库

- 类型：`PostgreSQL`
- 业务库：`innovation_platform`
- 连接变量：`DATABASE_URI` / `DATABASE_URL`
- Docker Volume：`pgdata`

### 6.2 Redis

- 连接变量：`REDIS_URL`
- Docker Volume：`redisdata`
- 当前用途：邮箱 / 短信验证码缓存与读取

### 6.3 文件与证书

部署时必须保留：

- `media/`：上传附件与图片
- `public/`：品牌与静态文件
- `example.com_nginx/`：SSL 证书文件

## 7. 当前健康检查方式

当前没有独立 `/health`，推荐组合检查：

```bash
curl -k -I https://innovation.example.com
curl -I http://127.0.0.1:3005
systemctl is-active innovation-platform.service
docker compose ps
```

如需进一步确认短信环境：

```bash
curl -k https://innovation.example.com/api/sms/send   -H 'Content-Type: application/json'   -d '{"phone":"13800000000"}'
```

## 8. 当前部署注意事项

- 应用重启瞬间，Nginx 可能短暂返回 `502`
- 校验 Nginx 配置请使用 `sudo nginx -t`
- 当前是混部环境，不要占用 `3000 / 5432 / 6379 / 8080`
- 正式短信签名必须使用阿里云已审核通过的 `平台验证码`
- 环境变量变更后必须 rebuild，否则 standalone 会继续读旧值
