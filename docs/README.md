# Docs Index

本目录用于沉淀开放创新平台的当前实现、部署、运维和联调信息。当前仓库不是前后端分离的多仓项目，而是一个单仓全栈应用：`Next.js 16` 提供页面和业务 API，`Payload CMS 3` 作为嵌入式后台与数据访问层，`PostgreSQL + Redis` 提供存储与验证码能力。

## 文档清单

| 路径                                  | 说明                                                     |
| ------------------------------------- | -------------------------------------------------------- |
| `architecture/README.md`              | 架构文档索引                                             |
| `architecture/system-architecture.md` | 系统边界、路由分组、集合模型、认证方式、数据流与外部依赖 |
| `architecture/deployment-topology.md` | 当前运行拓扑、端口、systemd / nginx / Docker 落地方式    |
| `deployment.md`                       | 本地开发、环境变量、构建与服务器启动说明                 |
| `testing.md`                          | 自动化测试现状、人工验收路径、测试前提与已知缺口         |
| `Ops/README.md`                       | 运维文档索引                                             |
| `Ops/runbook.md`                      | 日常巡检、服务操作、日志查看与故障排查                   |
| `Ops/release-and-rollback.md`         | 发布、回滚、版本切换与上线核验                           |
| `Ops/backup-and-restore.md`           | PostgreSQL、媒体文件、配置与证书备份恢复                 |
| `Ops/payload-database-access.md`      | Payload 后端如何连接 PostgreSQL、如何查看后台数据        |
| `progress/2026-04-14.md`              | 初始化开发记录                                           |
| `progress/2026-04-15.md`              | 品牌、暗色主题、附件与部署调整记录                       |
| `progress/2026-04-17.md`              | 本轮项目梳理与文档全面刷新记录                           |

## 维护原则

1. 涉及路由、集合、认证、外部服务或部署链路的代码变更，都要同步更新 `architecture/` 或 `deployment.md`。
2. 涉及服务操作、备份恢复、发布回滚、数据库查看方式的变更，都要同步更新 `Ops/`。
3. 自动化测试范围、验收口径、联调账号和当前限制统一收敛到 `testing.md`。
4. 关键里程碑和现场变更记录写入 `progress/`，历史记录只追加，不覆盖既有背景。
