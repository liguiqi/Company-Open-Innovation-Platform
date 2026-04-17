# 发布与回滚说明

更新日期：`2026-04-17`

## 1. 分支与发布原则

- 当前默认开发分支仍以 `dev-bugfix` 为主
- 未得到明确指令前，不主动 `git push`
- 代码发布与文档更新分开看待：如果只是文档变更，不需要重启应用

## 2. 发布前检查

在仓库根目录执行：

```bash
git status --short
pnpm lint
pnpm typecheck
pnpm build
```

如果本次变更涉及集合结构或 Payload Admin 组件映射，再额外执行：

```bash
pnpm generate:types
pnpm generate:importmap
```

如果要跑 E2E，请确认当前机器已安装 Playwright 浏览器：

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

需要额外确认：

- `innovation-platform.service` 当前为 `active`
- Docker 中 `postgres` / `redis` 正常
- `.env.local` / `.env` 中的必要变量仍存在

## 3. 标准发布流程

```bash
git pull --rebase   # 仅在明确需要同步远程时执行
pnpm install
pnpm lint
pnpm typecheck
pnpm build
sudo systemctl restart innovation-platform.service
curl -k -I https://innovation.example.com
```

## 4. 发布后最小冒烟

1. 打开首页 `/`
2. 打开 `/login`
3. 打开 `/dashboard`
4. 打开 `/admin`
5. 查看最近日志中是否出现持续性的数据库、Redis、附件或邮件异常

建议补充命令：

```bash
systemctl is-active innovation-platform.service
journalctl -u innovation-platform.service -n 100 --no-pager
docker compose ps
```

## 5. 涉及 Nginx 时的额外步骤

```bash
sudo nginx -t
sudo systemctl reload nginx
curl -k -I https://innovation.example.com
```

如果证书文件、监听端口或主配置变更，再执行：

```bash
sudo systemctl restart nginx
```

## 6. 回滚策略

### 6.1 代码回滚

优先采用以下安全方式：

1. 找到最后一个稳定提交
2. 新建临时回滚分支
3. 切换到该提交重新构建
4. 重启应用服务

示例：

```bash
git checkout -b rollback-20260417 <stable_commit>
pnpm build
sudo systemctl restart innovation-platform.service
```

如果只是撤销少量错误提交，优先使用：

```bash
git revert <commit>
```

不建议在日常运维中使用破坏性 `reset --hard`。

### 6.2 配置回滚

- Nginx：回滚 `/etc/nginx/sites-available/innovation-platform-apps.conf`
- systemd：回滚 `/etc/systemd/system/innovation-platform.service`
- 环境变量：回滚 `.env.local` / `.env`

配置回滚后执行：

```bash
sudo nginx -t
sudo systemctl daemon-reload
sudo systemctl restart innovation-platform.service
sudo systemctl reload nginx
```

### 6.3 数据相关注意事项

- 代码回滚不会自动回滚 PostgreSQL 数据
- `media/` 目录也不会因代码切换自动恢复
- 如果发布同时改动了数据库内容或附件文件，需要结合备份恢复策略一起处理

## 7. 发布验收清单

- `curl -k -I https://innovation.example.com` 返回 `200`
- `/login` 可打开
- `/dashboard` 可进入或按预期跳转
- `/admin` 可访问
- 页面样式和品牌资源正常
- 无持续性 `502`
- 无持续性 PostgreSQL / Redis 连接异常
- 无大量 `[email:send-failed]`、`[proposal:create-failed]`
