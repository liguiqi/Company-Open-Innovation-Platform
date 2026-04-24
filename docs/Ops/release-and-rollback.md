# 发布与回滚说明

更新日期：`2026-04-20`

## 1. 分支与版本原则

- 当前默认开发分支：`dev-bugfix`
- 正式 release 使用 semver tag
- 本次正式版：`v1.0.0`
- 未得到明确指令前，不主动推送远程；正式发版需得到用户明确授权

## 2. 发布前检查

```bash
git status --short
pnpm lint
pnpm typecheck
pnpm build
```

如果集合结构或 Payload Admin 映射发生变更，再额外执行：

```bash
pnpm generate:types
pnpm generate:importmap
```

如需跑 E2E：

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

## 3. 标准正式发版流程

### 3.1 代码与文档准备

```bash
git status --short
pnpm lint
pnpm typecheck
pnpm build
```

### 3.2 重启服务并做 smoke test

```bash
sudo systemctl restart innovation-platform.service
curl -k -I https://innovation.example.com
systemctl is-active innovation-platform.service
```

### 3.3 提交正式 release commit

建议提交格式：

```bash
git commit -m "chore(release): v1.0.0"
```

### 3.4 打 tag

```bash
git tag -a v1.0.0 -m "Release v1.0.0"
```

### 3.5 推送代码与 tag

```bash
git push origin dev-bugfix
git push origin v1.0.0
```

## 4. 正式发版前的特别注意事项

当前生产是 `standalone` 运行：

- `.next/standalone/.env*` 会保留构建时环境变量
- 改 `.env` / `.env.local` 后必须重新 `pnpm build`
- 否则重启服务也可能继续跑旧短信签名、旧 SMTP 或旧域名配置

因此，凡是涉及环境变量的 release，必须执行：

```bash
pnpm build
sudo systemctl restart innovation-platform.service
```

## 5. 发布后最小冒烟

1. 打开首页 `/`
2. 打开 `/login`
3. 打开 `/register`
4. 打开 `/dashboard`
5. 打开 `/admin`
6. 验证 `/api/sms/send` 正常
7. 验证 `/dashboard/settings` 可保存当前用户资料

建议命令：

```bash
systemctl is-active innovation-platform.service
journalctl -u innovation-platform.service -n 100 --no-pager
docker compose ps
curl -k -I https://innovation.example.com
```

## 6. 回滚策略

### 6.1 代码回滚

优先采用安全方式：

```bash
git checkout -b rollback-<date> <stable_tag_or_commit>
pnpm build
sudo systemctl restart innovation-platform.service
```

如果只是撤销少量错误提交：

```bash
git revert <commit>
```

不建议日常运维中使用破坏性 `reset --hard`。

### 6.2 配置回滚

- Nginx：回滚 `/etc/nginx/sites-available/innovation-platform-apps.conf`
- systemd：回滚 `/etc/systemd/system/innovation-platform.service`
- 环境变量：回滚 `.env.local` / `.env`
- 如上次 release 改过环境变量，回滚后同样需要重新 build

配置回滚后：

```bash
pnpm build
sudo systemctl daemon-reload
sudo systemctl restart innovation-platform.service
sudo nginx -t
sudo systemctl reload nginx
```

### 6.3 数据相关注意事项

- 代码回滚不会自动回滚 PostgreSQL 数据
- `media/` 不会因代码切换自动恢复
- 如果 release 同时改动了数据库内容或附件文件，必须结合备份恢复策略处理

## 7. 发布验收清单

- `curl -k -I https://innovation.example.com` 返回 `200`
- `/login` 可打开
- `/register` 可打开
- `/dashboard` 可进入或按预期跳转
- `/admin` 可访问
- `/dashboard/settings` 可保存当前用户信息
- 短信接口无 `签名或者模板无效`
- 无持续性 `502`
- 无持续性 PostgreSQL / Redis 连接异常
