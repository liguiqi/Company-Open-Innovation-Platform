# 发布与回滚说明

更新日期：`2026-04-30`

## 1. 分支与版本原则

- 当前仓库主线：`main`
- `package.json` 当前版本：`2.0.0`
- 正式 release 推荐使用 semver tag
- 本地提交、推送远程仓库、覆盖生产部署是三个独立动作
- 未得到明确指令前，不主动更新生产环境；生产发版需得到用户明确授权

## 2. 发布前检查

```bash
git status --short
pnpm lint
pnpm typecheck
pnpm build
```

如果集合结构、Payload 类型或 import map 发生变更，再额外执行：

```bash
pnpm generate:types
pnpm generate:importmap
```

如需跑 E2E：

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

## 3. 标准本地发版流程

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

### 3.3 提交本地 release commit

建议提交格式：

```bash
git commit -m "chore(release): <semver-or-baseline-note>"
```

### 3.4 打 tag

```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z"
```

### 3.5 推送代码与 tag

```bash
git push origin main
git push origin vX.Y.Z
```

## 4. 生产覆盖部署前的特别注意事项

1. 当前生产调试环境域名是 `https://openinnovation.example.com`。
2. 生产更新属于单独动作，不等同于 `git push origin main`。
3. 任何需要连接 `10.0.0.1` 的部署行为，都必须获得用户明确授权。
4. 当前运行方式是 `standalone`：
   - `.next/standalone/.env*` 会保留构建时环境变量
   - 修改 `.env` / `.env.local` 后必须重新 `pnpm build`
   - 否则即使重启服务，也可能继续跑旧短信签名、旧 SMTP、旧域名配置

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
8. 验证附件上传 / 下载至少一次
9. 验证后台 `users` 列表中的“最后访问时间”可刷新

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

- Nginx：回滚 `/etc/nginx/sites-available/innovation-platform-apps.conf` 或生产站点文件
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
- `proposals_review_timeline`、`media.storage_key`、`users.last_access_at` 等结构若已写入数据库，也需要与代码版本匹配
- 如果 release 同时改动了数据库内容或附件文件，必须结合备份恢复策略处理

## 7. 发布验收清单

- `curl -k -I https://innovation.example.com` 返回 `200`
- `/login` 可打开
- `/register` 可打开
- `/dashboard` 可进入或按预期跳转
- `/admin` 可访问
- `/dashboard/settings` 可保存当前用户信息
- 附件可上传至少一个 `30MB` 文件
- 短信接口无 `签名或者模板无效`
- `users.lastAccessAt` 能在后台列表中更新
- 无持续性 `502`
- 无持续性 PostgreSQL / Redis 连接异常
