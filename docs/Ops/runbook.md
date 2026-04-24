# 运维 Runbook

更新日期：`2026-04-20`

## 1. 运行对象

| 对象       | 方式           | 主要命令                        |
| ---------- | -------------- | ------------------------------- |
| Web 应用   | systemd        | `innovation-platform.service`   |
| Nginx      | 系统服务       | `nginx.service`                 |
| PostgreSQL | Docker Compose | `docker compose up -d postgres` |
| Redis      | Docker Compose | `docker compose up -d redis`    |

## 2. 常用检查命令

### 2.1 应用状态

```bash
systemctl status innovation-platform.service --no-pager -l
systemctl is-active innovation-platform.service
journalctl -u innovation-platform.service -n 200 --no-pager
```

### 2.2 Nginx 状态

```bash
sudo nginx -t
sudo systemctl status nginx --no-pager -l
sudo journalctl -u nginx -n 200 --no-pager
```

### 2.3 端口与进程

```bash
ss -ltnp | grep -E ':80|:443|:3005|:5433|:6380'
```

### 2.4 容器状态

```bash
docker ps --format 'table {{.Names}}	{{.Image}}	{{.Status}}	{{.Ports}}'
docker compose ps
```

### 2.5 访问验活

```bash
curl -k -I https://innovation.example.com
curl -I http://127.0.0.1:3005
```

## 3. 日常操作

### 3.1 重启应用

```bash
sudo systemctl restart innovation-platform.service
systemctl is-active innovation-platform.service
```

### 3.2 重载 / 重启 Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

如监听、证书或主配置变更，再执行：

```bash
sudo systemctl restart nginx
```

### 3.3 重启数据库与 Redis

```bash
docker compose restart postgres redis
docker compose ps
```

## 4. 数据查看顺序

### 4.1 首选：Payload Admin

- 地址：`/admin`
- 适合：内容维护、字段核对、关系追踪、上传文件定位

### 4.2 其次：Payload REST / GraphQL

```bash
curl http://127.0.0.1:3005/api/tech-needs?limit=5
curl -X POST http://127.0.0.1:3005/api/graphql   -H 'Content-Type: application/json'   -d '{"query":"query { TechNeeds(limit: 3) { docs { id title needId status } } }"}'
```

### 4.3 最后：直接 PostgreSQL

```bash
docker compose exec -T postgres psql -U payload -d innovation_platform
```

## 5. 典型故障处理

### 5.1 域名访问返回 502

排查顺序：

1. `systemctl is-active innovation-platform.service`
2. `curl -I http://127.0.0.1:3005`
3. `journalctl -u innovation-platform.service -n 100 --no-pager`
4. `sudo nginx -t`
5. `sudo journalctl -u nginx -n 100 --no-pager`

### 5.2 页面样式丢失 / 静态资源 404

优先检查：

1. 是否执行过 `pnpm build`
2. 是否通过 `scripts/start-standalone.mjs` 启动
3. `.next/static` 与 `public/` 是否同步到了 `.next/standalone`

### 5.3 Dashboard 登录或跳转异常

排查：

1. 浏览器是否存在 `innovation-session`
2. `PAYLOAD_SECRET` 是否变动
3. `src/lib/auth.ts` 的 Cookie 签发和校验是否正常
4. 最新构建是否已部署到 `standalone`

### 5.4 数据库连接异常

```bash
docker compose ps
docker compose exec -T postgres psql -U payload -d innovation_platform -c '\dt'
grep '^DATABASE_' .env.local .env 2>/dev/null
```

### 5.5 手机验证码未收到或报“签名或者模板无效”

排查顺序：

1. 检查根目录 `.env` / `.env.local` 中的短信配置
2. 检查 `.next/standalone/.env` / `.env.local` 中是否还是旧值
3. 确认正式签名仍为 `平台验证码`
4. 确认模板为 `100001`、场景名为 `平台验证码`
5. 如果刚改过环境变量，执行：

```bash
pnpm build
sudo systemctl restart innovation-platform.service
```

6. 再验证接口：

```bash
curl -k https://innovation.example.com/api/sms/send   -H 'Content-Type: application/json'   -d '{"phone":"13800000000"}'
```

7. 若返回 `验证码发送过于频繁`，先等待 60 秒冷却
8. 若阿里云返回 `biz.FREQUENCY`，说明已触发供应商侧频控

### 5.6 邮件未收到

排查：

1. 检查 `SMTP_*` 是否完整
2. 查看日志中的 `[email:send-failed]`
3. 确认 `NEXT_PUBLIC_SERVER_URL` 是否仍指向正式域名

### 5.7 附件下载 403 / 404

排查：

1. 确认当前用户是否为管理员、评审员、上传者或方案所有者
2. 检查 `media` 表里的关联字段
3. 检查磁盘文件是否仍在根目录 `media/`
4. 查看 `/api/attachments/[id]` 返回信息

## 6. 配置文件清单

| 文件                                               | 作用                       |
| -------------------------------------------------- | -------------------------- |
| `/etc/systemd/system/innovation-platform.service`  | 应用服务定义               |
| `/etc/nginx/sites-available/innovation-platform-apps.conf`       | 域名转发配置               |
| `deploy/systemd/innovation-platform.service`       | 仓库内 systemd 样例        |
| `deploy/nginx/innovation.example.com.conf` | 仓库内 nginx 样例          |
| `.env.local` / `.env`                              | 环境变量源文件             |
| `.next/standalone/.env*`                           | 构建后的运行态环境变量副本 |

## 7. 高风险注意事项

- `.env`、`.env.local` 和 `.next/standalone/.env*` 都应视为敏感文件
- 当前项目与其他项目同机混部，改 Nginx 配置前必须确认不会误伤其他域名
- 当前没有独立健康检查接口，运维主要依赖首页、登录页、Dashboard 和 API 验活
- 直接改数据库会绕过 Payload 校验、Hook 与权限控制，除非抢修，不建议直接写表
