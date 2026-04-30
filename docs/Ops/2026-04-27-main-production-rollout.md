# 2026-04-27 main 分支生产部署实操说明

更新日期：`2026-04-27`

> 历史快照说明
>
> 1. 本文记录的是 `2026-04-27` 当次生产覆盖部署的现场过程与当时基线。
> 2. 当前通用部署标准请以 `docs/deployment/deployment.md`、`docs/Ops/runbook.md` 和 `docs/Ops/release-and-rollback.md` 为准。

## 1. 目标与边界

- 本次目标：将生产环境从当前运行基线 `b21d518` 升级到 `main` 最新提交 `1d17b93`
- 本次方式：源码全覆盖更新 + 数据库全量备份 + 运行态重建
- 本次约束：保留生产域名、生产 Nginx / systemd 运行方式、生产环境变量语义，不把本机开发域名覆盖到生产

生产固定保留项：

- 生产访问域名：`https://openinnovation.example.com`
- 本机开发域名：`https://innovation.example.com`
- 生产服务目录：`/home/user/Workprojects/open-innovation-platform`
- 生产 systemd 服务：`innovation-platform.service`
- 生产应用端口：`3005`

## 2. 本次发版范围

生产当前运行基线为 `b21d518`，本次实际部署版本为 `1d17b93`。其中功能与架构增量主要来自以下提交：

1. `a8437b7 feat(dashboard): integrate tech needs workspace management`
2. `11acbc5 feat(media): add modular asset organization and archive upload support`
3. `32a5ba8 fix: restore payload proposal admin flows and media organization`
4. `1d17b93 docs(release): add 2026-04-27 main production rollout guide`

配套影响面：

- Dashboard 新增技术需求工作台能力
- 媒体目录、附件归档、公开媒体访问链路有较大调整
- Proposal / Media / Admin 流程有恢复性修复
- 用户文档、运维文档与架构文档同步更新

由于本次涉及媒体组织方式和后台流转修复，部署前必须做：

1. 仓库外源码备份
2. PostgreSQL 全量备份
3. `media/` 与运行配置备份
4. 构建后重启与冒烟验证

## 3. 发布前核对

本机 `main` 基线结果：

- `pnpm lint`：通过
- `pnpm typecheck`：通过
- `pnpm build`：通过
- `pnpm test`：未完全通过，失败原因为本机缺少 Playwright Chromium 二进制；`test:int` 已通过，`test:e2e` 未执行完

结论：

- 当前代码可进入生产部署流程
- 如需完整执行 E2E，先安装 Playwright 浏览器

## 4. 生产环境现状核对

已核对到的生产环境关键事实：

- 实际 systemd 工作目录为 `/home/user/Workprojects/open-innovation-platform`
- `innovation-platform.service` 当前为 `active (running)`
- 生产 Nginx 站点文件为 `/etc/nginx/sites-available/openinnovation.example.com.conf`
- 生产 PostgreSQL / Redis 通过项目根目录 `docker compose` 运行
- 当前生产仓库工作树存在本地状态，不应直接在未备份前覆盖

本次执行原则：

1. 先备份，再覆盖
2. 先保留生产 `.env*` 与域名配置，再同步最新源码
3. 不将仓库内的开发域名样例配置写入生产 Nginx

## 5. 实际备份路径与对象

本次沿用的备份命名规则：

```bash
/home/user/migration-backups/<timestamp>-main-rollout/
```

实际备份目录：

```bash
/home/user/migration-backups/2026-04-27-210833-main-rollout/
```

实际备份对象：

1. 当前生产仓库源码快照
2. PostgreSQL 全量导出
3. `media/`
4. `.env`、`.env.local`
5. `/etc/systemd/system/innovation-platform.service`
6. `/etc/nginx/sites-available/openinnovation.example.com.conf`

实际落盘文件：

1. `source-repo-before.tgz`
2. `innovation_platform-before.sql.gz`
3. `media-before.tgz`
4. `certs-before.tgz`
5. `.env.before`
6. `.env.local.before`
7. `.env.local.bak.2026-04-24_155504`
8. `.env.local.bak.2026-04-24_160611`
9. `innovation-platform.service.before`
10. `openinnovation.example.com.conf.before`
11. `git-status-before.txt`
12. `git-log-before.txt`
13. `open-innovation-platform-main-20260427-210753.bundle`

## 6. 计划部署步骤

### 6.1 本机准备

1. 在 `main` 上新增本说明文档
2. 提交一次带发版说明和运维文档说明的 commit
3. 推送到远程仓库
4. 生成离线部署包并复制到生产服务器

### 6.2 生产备份

1. 在仓库外创建时间戳备份目录
2. 备份当前项目源码
3. 备份 PostgreSQL
4. 备份 `media/` 与关键配置

### 6.3 生产覆盖更新

1. 保留生产 `.env` / `.env.local`
2. 以最新 `main` 源码覆盖生产目录
3. 恢复生产环境变量与域名相关配置
4. 安装依赖并重新构建
5. 重启 `innovation-platform.service`
6. 校验 Nginx、应用、数据库和静态资源

### 6.4 部署后验证

1. `https://openinnovation.example.com/`
2. `https://openinnovation.example.com/login`
3. `https://openinnovation.example.com/register`
4. `https://openinnovation.example.com/dashboard`
5. `https://openinnovation.example.com/admin`
6. 应用服务状态、Nginx 状态、容器状态

## 7. 实际执行记录

### 7.1 本机侧执行

1. 在 `main` 上新增本说明文档并推送到 `origin/main`
2. 生成离线 bundle：

```bash
git bundle create /tmp/open-innovation-platform-main-20260427-210753.bundle main
```

3. 将 bundle 复制到生产服务器备份目录：

```bash
scp /tmp/open-innovation-platform-main-20260427-210753.bundle \
  user@10.0.0.1:/home/user/migration-backups/2026-04-27-210833-main-rollout/
```

### 7.2 生产机备份

在 `/home/user/Workprojects/open-innovation-platform` 内执行：

```bash
tar --exclude='./node_modules' \
    --exclude='./.next' \
    --exclude='./playwright-report' \
    --exclude='./test-results' \
    -czf /home/user/migration-backups/2026-04-27-210833-main-rollout/source-repo-before.tgz .

docker compose exec -T postgres pg_dump -U payload innovation_platform \
  | gzip -1 > /home/user/migration-backups/2026-04-27-210833-main-rollout/innovation_platform-before.sql.gz

tar -czf /home/user/migration-backups/2026-04-27-210833-main-rollout/media-before.tgz media
tar -czf /home/user/migration-backups/2026-04-27-210833-main-rollout/certs-before.tgz example.com_nginx
cp -a .env /home/user/migration-backups/2026-04-27-210833-main-rollout/.env.before
cp -a .env.local /home/user/migration-backups/2026-04-27-210833-main-rollout/.env.local.before
sudo cp /etc/systemd/system/innovation-platform.service \
  /home/user/migration-backups/2026-04-27-210833-main-rollout/innovation-platform.service.before
sudo cp /etc/nginx/sites-available/openinnovation.example.com.conf \
  /home/user/migration-backups/2026-04-27-210833-main-rollout/openinnovation.example.com.conf.before
```

### 7.3 生产机覆盖更新

本次实际覆盖更新步骤如下：

```bash
ln -sf /home/user/migration-backups/2026-04-27-210833-main-rollout/open-innovation-platform-main-20260427-210753.bundle /tmp/main.bundle

sudo systemctl stop innovation-platform.service

git fetch /tmp/main.bundle refs/heads/main:refs/remotes/bundle/main
git reset --hard refs/remotes/bundle/main

export PATH=/home/user/.nvm/versions/node/v24.15.0/bin:$PATH
pnpm generate:types
pnpm generate:importmap
pnpm media:organize
pnpm build

sudo systemctl start innovation-platform.service
sudo nginx -t
```

### 7.4 实际部署结果

- 实际部署提交：`1d17b93661fe1802d13abadcb1a1c2f2c6f29bc4`
- 生产服务目录：`/home/user/Workprojects/open-innovation-platform`
- 生产域名保持不变：`https://openinnovation.example.com`
- 本机开发域名保持不变：`https://innovation.example.com`
- `pnpm media:organize` 实际回填：`25` 条媒体记录
- `docker compose ps` 确认 `postgres` / `redis` 均为运行态

### 7.5 实际验活结果

1. `200 http://127.0.0.1:3005`
2. `200 https://openinnovation.example.com`
3. `200 https://openinnovation.example.com/login`
4. `200 https://openinnovation.example.com/register`
5. `307 https://openinnovation.example.com/dashboard`（符合未登录场景的预期跳转）
6. `200 https://openinnovation.example.com/admin`
7. `innovation-platform.service` 为 `active`
8. `sudo nginx -t` 通过

### 7.6 本次部署中遇到的问题与处理

1. 首次通过交互式 SSH 执行长命令时，TTY 折行把 `git fetch` 截成了 `etch`，导致生产仓库没有真正切到新提交。处理方式：改为 `sshpass + 非交互脚本`，并显式抓取 `refs/heads/main` 到 `refs/remotes/bundle/main` 后再 `git reset --hard`。
2. 首次脚本化执行时，非交互 shell 没有加载 NVM 路径，导致 `pnpm: command not found`。处理方式：显式导出 `PATH=/home/user/.nvm/versions/node/v24.15.0/bin:$PATH` 后重新执行生成、回填、构建与启动。
3. 服务启动后的第一轮即时探测一度返回 `502`，根因是应用刚启动时 `3005` 端口尚未完成监听。处理方式：查看 `systemd` / `journalctl`，确认 Next.js `Ready` 后再次验活，最终首页、登录、注册、Admin 和本机 `3005` 均恢复正常。

### 7.7 部署后状态说明

- 生产仓库当前 `HEAD` 已是 `1d17b93`
- 生产工作树存在运行期生成物变更：
  - `src/payload-types.ts`
  - `src/app/(payload)/admin/importMap.js`
- 生产目录仍保留历史环境备份文件：
  - `.env.local.bak.2026-04-24_155504`
  - `.env.local.bak.2026-04-24_160611`

这些状态不会影响当前线上运行。本次已在本地仓库同步重新生成上述文件，并会与本次部署实录一起纳入后续详细 commit，避免仓库与生产运行态长期漂移。

## 8. 回滚入口

如部署失败，按以下顺序回滚：

1. 停止应用服务
2. 从 `/home/user/migration-backups/2026-04-27-210833-main-rollout/` 恢复备份的生产源码目录
3. 恢复 `.env` / `.env.local`
4. 如有必要恢复 PostgreSQL dump
5. 重启 `innovation-platform.service`
6. 校验 `openinnovation.example.com`
