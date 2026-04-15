# 部署说明

## 本地开发

1. 复制环境变量模板：

```bash
cp .env.example .env.local
```

2. 启动基础设施：

```bash
pnpm db:up
```

默认使用 `5433/6380`，避免与当前机器上已存在的 PostgreSQL / Redis 冲突；部署到正式环境时可改回标准 `5432/6379`。

3. 生成 Payload 类型与 import map：

```bash
pnpm generate:types
pnpm generate:importmap
```

4. 注入演示数据：

```bash
pnpm seed
```

5. 启动开发服务器：

```bash
pnpm dev
```

6. 生产模式本地验收：

```bash
PORT=3005 pnpm start
```

`pnpm start` 现在会先自动同步 `.next/static`、`public/` 和 `media/` 到 `standalone` 运行目录，再启动 Next.js 生产服务，避免样式、字体和上传文件在生产模式下丢失。

## 当前环境状态（2026-04-15）

- 当前机器的 `3000` 端口由 `bothub` 项目占用。
- 当前项目 `innovation-platform` 已通过 `systemd` 服务固定运行在 `3005` 端口：

```bash
sudo systemctl status innovation-platform.service
```

- `pnpm start` 现在会先自动同步 `.next/static` 和 `public/` 到 `standalone` 运行目录，再启动 Next.js 生产服务，避免样式与字体资源 404。
- `nginx` 已安装并接管 `80/443`：
  - `innovation.example.com` -> `127.0.0.1:3005`
  - `bothub.example.com` -> `127.0.0.1:3000`
- 当前系统配置文件：
  - `systemd`：`/etc/systemd/system/innovation-platform.service`
  - `nginx`：`/etc/nginx/sites-available/innovation-platform-apps.conf`

## 域名与证书

- 统一域名：`innovation.example.com`
- bothub 域名：`bothub.example.com`
- 现有证书文件目录：`./example.com_nginx`
- Nginx 参考配置：`./deploy/nginx/innovation.example.com.conf`
- bothub 参考配置：`./deploy/nginx/bothub.example.com.conf`
- systemd 参考配置：`./deploy/systemd/innovation-platform.service`

## 生产建议

- 使用 `pm2` 或 `systemd` 守护 `pnpm start`
- 反向代理由 Nginx 负责 SSL 终止和静态资源缓存
- 数据库与 Redis 建议仅监听本机或内网地址
- 建议将 `.env.local` 改为服务器环境变量或受限权限文件
