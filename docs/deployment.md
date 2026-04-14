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

## 域名与证书

- 统一域名：`innovation.example.com`
- 现有证书文件目录：`./example.com_nginx`
- Nginx 参考配置：`./deploy/nginx/innovation.example.com.conf`

## 生产建议

- 使用 `pm2` 或 `systemd` 守护 `pnpm start`
- 反向代理由 Nginx 负责 SSL 终止和静态资源缓存
- 数据库与 Redis 建议仅监听本机或内网地址
- 建议将 `.env.local` 改为服务器环境变量或受限权限文件
