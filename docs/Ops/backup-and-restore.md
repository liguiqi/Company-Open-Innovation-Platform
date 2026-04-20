# 备份与恢复说明

更新日期：`2026-04-20`

## 1. 需要备份的对象

### 1.1 PostgreSQL 业务数据

- 库名：`innovation_platform`
- 主表包括：`users`、`user_groups`、`tech_needs`、`proposals`、`proposals_rels`、`partners`、`case_studies`、`media`

### 1.2 文件与媒体

- `media/`：上传附件和图片
- `public/`：品牌资源与静态文件
- `example.com_nginx/`：证书文件

### 1.3 配置

- `.env.local`
- `.env`
- `/etc/systemd/system/innovation-platform.service`
- `/etc/nginx/sites-available/innovation-platform-apps.conf`

### 1.4 Redis

Redis 当前只用于 OTP 缓存，不承载业务主数据。常规备份时可以不单独备份 Redis。

## 2. PostgreSQL 备份

```bash
docker compose exec -T postgres   pg_dump -U payload innovation_platform > backup-innovation_platform.sql
```

如需压缩：

```bash
gzip -f backup-innovation_platform.sql
```

## 3. PostgreSQL 恢复

```bash
gunzip -c backup-innovation_platform.sql.gz |   docker compose exec -T postgres psql -U payload innovation_platform
```

未压缩文件：

```bash
cat backup-innovation_platform.sql |   docker compose exec -T postgres psql -U payload innovation_platform
```

## 4. 文件备份

```bash
tar -czf backup-media.tar.gz media
tar -czf backup-public.tar.gz public
tar -czf backup-cert.tar.gz example.com_nginx
```

## 5. 配置备份

```bash
cp /etc/systemd/system/innovation-platform.service ./backup-innovation-platform.service
cp /etc/nginx/sites-available/innovation-platform-apps.conf ./backup-innovation-platform-apps.conf
cp .env.local ./.env.local.backup
cp .env ./.env.backup
```

注意：

- 配置备份属于敏感文件，不应进入公共仓库
- `.next/standalone/.env*` 不应被视为配置源文件，它们只是构建产物副本

## 6. 恢复顺序建议

1. 停止应用写入
2. 恢复 PostgreSQL
3. 恢复 `media/`
4. 恢复 `.env.local` / `.env`
5. 如有需要，恢复 Nginx / systemd 配置
6. 重新构建 standalone
7. 重启服务并做冒烟验证

## 7. 恢复后的验证

```bash
pnpm build
sudo systemctl daemon-reload
sudo systemctl restart innovation-platform.service
sudo nginx -t
sudo systemctl reload nginx
curl -k -I https://innovation.example.com
docker compose ps
docker compose exec -T postgres psql -U payload -d innovation_platform -c '\dt'
```

建议再做人工验收：

1. 首页
2. 登录页
3. 注册页
4. Dashboard
5. Admin
6. 任意一条带附件的方案详情页
