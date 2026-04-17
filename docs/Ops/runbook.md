# 运维 Runbook

更新日期：`2026-04-17`

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
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
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

如监听、证书或主配置有变更，再执行：

```bash
sudo systemctl restart nginx
```

### 3.3 重启数据库与 Redis

在仓库根目录执行：

```bash
docker compose restart postgres redis
docker compose ps
```

## 4. 查看 Payload 后端数据

更完整说明见 `docs/Ops/payload-database-access.md`。日常排查优先顺序建议如下。

### 4.1 首选：Payload Admin

- 地址：`/admin`
- 适用：内容维护、字段核对、关系追踪、上传文件定位
- 优点：会走 Payload 自身权限、字段配置和展示逻辑

### 4.2 其次：Payload REST / GraphQL

公开集合可直接调试，例如：

```bash
curl http://127.0.0.1:3005/api/tech-needs?limit=5
curl -X POST http://127.0.0.1:3005/api/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"query { TechNeeds(limit: 3) { docs { id title needId status } } }"}'
```

注意：

- 这些接口属于 Payload 原生接口
- 受 Payload 权限控制，不等同于 Dashboard 的 `innovation-session`

### 4.3 最后：直接连 PostgreSQL

```bash
docker compose exec -T postgres psql -U payload -d innovation_platform
```

常用查询：

```sql
\dt
SELECT id, email, role, username FROM users ORDER BY id DESC LIMIT 20;
SELECT id, need_id, title, status FROM tech_needs ORDER BY id DESC LIMIT 20;
SELECT id, title, status, submitted_by_id FROM proposals ORDER BY id DESC LIMIT 20;
```

直接 SQL 看到的是原始表，不会自动体现 Payload 访问控制。

## 5. 典型故障处理

### 5.1 域名访问返回 502

排查顺序：

1. `systemctl is-active innovation-platform.service`
2. `curl -I http://127.0.0.1:3005`
3. `journalctl -u innovation-platform.service -n 100 --no-pager`
4. `sudo nginx -t`
5. `sudo journalctl -u nginx -n 100 --no-pager`

已知现象：

- 应用刚重启的瞬间，Nginx 可能短暂返回 `502`
- 如果 `127.0.0.1:3005` 正常，通常只是切换窗口

### 5.2 页面样式丢失 / 静态资源 404

优先检查：

1. 是否执行过 `pnpm build`
2. `pnpm start` 是否通过 `scripts/start-standalone.mjs` 启动
3. `.next/static` 与 `public/` 是否已同步到 `.next/standalone`

### 5.3 Dashboard 登录或跳转异常

排查：

1. 检查浏览器是否存在 `innovation-session`
2. 确认 `PAYLOAD_SECRET` 没有被修改
3. 检查 `src/proxy.ts` 是否误拦截 `/dashboard`
4. 检查 `src/lib/auth.ts` 的 Cookie 签发和校验

### 5.4 数据库连接异常

排查：

```bash
docker compose ps
docker compose exec -T postgres psql -U payload -d innovation_platform -c '\dt'
grep '^DATABASE_' .env.local .env 2>/dev/null
```

如果 PostgreSQL 正常但页面仍报错，继续看：

```bash
journalctl -u innovation-platform.service -n 200 --no-pager
```

### 5.5 手机验证码未收到

排查：

1. 检查 `ALIYUN_SMS_TEMPLATE_CODE` 是否已配置
2. 查看日志是否出现 `[sms:mock]`
3. 检查 Redis 是否正常
4. 注意限流使用内存限流器：手机号 60 秒 1 次，IP 1 小时 20 次

说明：

- 当前模板码为空时，系统进入 mock 模式
- 如果 `REDIS_URL` 缺失，OTP 只存进程内存，重启后会丢失
- 应用重启会清空内存限流器计数

### 5.6 邮件未收到

排查：

1. 检查 `SMTP_*` 是否完整
2. 查看日志中的 `[email:send-failed]`
3. 检查 `NEXT_PUBLIC_SERVER_URL` 是否仍指向正确域名

当前代码策略：

- 邮件发送失败不会中断注册、提案和状态流转
- 如果业务要改成强依赖，必须调整代码策略

### 5.7 附件下载 403 / 404

排查：

1. 确认当前用户是否为管理员、评审员、上传者或方案所有者
2. 检查 `media` 表中的 `proposal_id`、`uploaded_by_id`
3. 检查磁盘文件是否仍在根目录 `media/`
4. 查看 `/api/attachments/[id]` 返回信息

## 6. 配置文件清单

| 文件                                               | 作用                |
| -------------------------------------------------- | ------------------- |
| `/etc/systemd/system/innovation-platform.service`  | 应用服务定义        |
| `/etc/nginx/sites-available/innovation-platform-apps.conf`       | 域名转发配置        |
| `deploy/systemd/innovation-platform.service`       | 仓库内 systemd 样例 |
| `deploy/nginx/innovation.example.com.conf` | 仓库内 nginx 样例   |
| `.env.local` / `.env`                              | 应用环境变量        |

## 7. 高风险注意事项

- `.env` 和 `.env.local` 应视为敏感文件
- `innovation` 与其他项目共用同一台主机，改 Nginx 配置前必须确认不会误伤其他域名
- 当前应用没有独立健康检查接口，运维主要依赖首页、登录页、Dashboard 和 PostgreSQL 连通性做冒烟
- 直接改数据库会绕过 Payload 校验、Hook 与权限控制，除非抢修，否则不建议直接写表
