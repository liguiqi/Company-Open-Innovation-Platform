# Docs Index

当前 `docs/` 目录面向正式版 `v1.0.0`，记录本项目在 `2026-04-20` 时点的真实架构、部署、运维、测试与里程碑状态。

## 文档范围

本目录只描述当前仓库已经落地并可从代码、配置、部署或运行环境中验证到的内容，不记录理想态方案，不记录明文密钥。

## 文档清单

| 路径                                           | 说明                                                           |
| ---------------------------------------------- | -------------------------------------------------------------- |
| `README.md`                                    | 文档总索引与维护范围                                           |
| `architecture/README.md`                       | 架构文档索引                                                   |
| `architecture/system-architecture.md`          | 系统边界、路由、认证、集合、业务流和外部依赖                   |
| `architecture/deployment-topology.md`          | 当前线上拓扑、端口、standalone 运行与持久化方式                |
| `PRD.md`                                       | 当前需求基线与验收范围说明                                     |
| `deployment/deployment.md`                     | 双版本部署文档，覆盖 AI Agent 自动化与 Human 手动部署          |
| `deployment/human-containerized-deployment.md` | 面向 Human 的容器化部署方案，覆盖 Docker Compose、Nginx 与代理 |
| `testing.md`                                   | 自动化测试现状、人工验收口径与已知缺口                         |
| `Ops/README.md`                                | 运维文档索引                                                   |
| `Ops/runbook.md`                               | 日常巡检、故障排查、服务与短信问题定位                         |
| `Ops/release-and-rollback.md`                  | 正式发版、tag、发布与回滚流程                                  |
| `Ops/backup-and-restore.md`                    | 数据、媒体、配置与证书备份恢复说明                             |
| `Ops/payload-database-access.md`               | Payload / PostgreSQL 数据查看方式与风险说明                    |
| `other_project/verification-provider-reuse.md` | bothub 验证能力复用参考与当前短信签名约束                      |
| `progress/2026-04-14.md`                       | 初始化阶段记录                                                 |
| `progress/2026-04-15.md`                       | 品牌、主题、附件与部署调整记录                                 |
| `progress/2026-04-17.md`                       | 文档体系初始化整理记录                                         |
| `progress/2026-04-20.md`                       | 认证完善、设置页可编辑、短信签名回退与正式发版记录             |

## 当前维护原则

1. 代码改动涉及路由、集合、认证、接口、外部服务或部署链路时，必须同步更新 `architecture/`、`deployment/deployment.md` 或 `Ops/`。
2. 涉及正式发版、tag、回滚和 smoke test 的变更，统一同步到 `README.md` 与 `Ops/release-and-rollback.md`。
3. 涉及短信 / 邮件 / 认证体验的用户侧调整，同时更新 `testing.md` 和 `progress/`。
4. 历史进度记录保留原始背景，但最新实际状态以 `README.md` 和当前主文档为准。
