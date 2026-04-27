# 2026-04-27 main 分支生产部署实操说明

更新日期：`2026-04-27`

## 1. 目标与边界

- 本次目标：将生产环境从当前运行基线 `b21d518` 升级到 `main` 最新提交 `32a5ba8`
- 本次方式：源码全覆盖更新 + 数据库全量备份 + 运行态重建
- 本次约束：保留生产域名、生产 Nginx / systemd 运行方式、生产环境变量语义，不把本机开发域名覆盖到生产

生产固定保留项：

- 生产访问域名：`https://openinnovation.example.com`
- 本机开发域名：`https://innovation.example.com`
- 生产服务目录：`/home/user/Workprojects/open-innovation-platform`
- 生产 systemd 服务：`innovation-platform.service`
- 生产应用端口：`3005`

## 2. 本次发版范围

生产当前运行基线为 `b21d518`，本次目标版本为 `32a5ba8`。主干相对生产基线包含以下关键更新：

1. `a8437b7 feat(dashboard): integrate tech needs workspace management`
2. `11acbc5 feat(media): add modular asset organization and archive upload support`
3. `32a5ba8 fix: restore payload proposal admin flows and media organization`

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

## 5. 计划备份路径与对象

建议统一备份根目录：

```bash
/home/user/migration-backups/2026-04-27-main-rollout/
```

计划备份对象：

1. 当前生产仓库源码快照
2. PostgreSQL 全量导出
3. `media/`
4. `.env`、`.env.local`
5. `/etc/systemd/system/innovation-platform.service`
6. `/etc/nginx/sites-available/openinnovation.example.com.conf`

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

> 本节将在完成真实生产部署后按实际执行结果回填，包含：
>
> - 实际备份目录
> - 实际执行命令
> - 实际部署到的提交 SHA
> - 实际验证结果
> - 遇到的问题与处理方式

## 8. 回滚入口

如部署失败，按以下顺序回滚：

1. 停止应用服务
2. 恢复备份的生产源码目录
3. 恢复 `.env` / `.env.local`
4. 如有必要恢复 PostgreSQL dump
5. 重启 `innovation-platform.service`
6. 校验 `openinnovation.example.com`
