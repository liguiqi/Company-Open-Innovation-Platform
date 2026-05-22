# Docs Index

当前 `docs/` 目录记录的是本仓库截至 `2026-04-30` 的真实落地状态，覆盖公开站、认证中心、Innovation Workspace、Payload Admin、部署拓扑、运维流程、测试验收和版本进度。

## 文档范围

1. 只记录当前仓库、当前构建产物、当前部署脚本和当前已确认环境中可以验证的事实。
2. 不在文档中记录明文密钥、密码、AK/SK、短信验证码或其他敏感凭据。
3. 生产环境口径默认指 `https://openinnovation.example.com`，本机开发环境口径默认指 `https://innovation.example.com`。
4. 若生产环境尚未同步本仓库最新提交，差异统一在 `user_doc/local-vs-production-differences.md` 中说明。

## 文档清单

| 路径                                                  | 说明                                                                  |
| ----------------------------------------------------- | --------------------------------------------------------------------- |
| `README.md`                                           | 文档总索引与维护边界                                                  |
| `PRD.md`                                              | 需求与总体设计说明，已补充当前实现口径                                |
| `testing.md`                                          | 自动化测试现状、人工验收路径、附件上传和角色链路验证点                |
| `user_doc/README.md`                                  | 用户文档索引                                                          |
| `user_doc/production-user-guide.md`                   | 生产环境用户操作手册，覆盖访客、合作伙伴、评审员、管理员              |
| `user_doc/local-vs-production-differences.md`         | 本机开发与生产部署差异矩阵，重点说明中台需求发布和最新本地增强项      |
| `architecture/README.md`                              | 架构文档总索引，汇总 Markdown、PlantUML 和演示图提示词                |
| `architecture/architecture_md/system-architecture.md` | 当前系统边界、路由、API、认证、集合模型和关键业务流                   |
| `architecture/architecture_md/deployment-topology.md` | 当前本机开发环境与生产调试环境的真实部署拓扑与运行约束                |
| `architecture/plantuml-index-20260422-164252.md`      | 已生成的 PlantUML 架构图索引                                          |
| `deployment/deployment.md`                            | AI Agent / Human 双版本部署文档，覆盖本机、迁移和新服务器落地         |
| `deployment/human-containerized-deployment.md`        | 面向 Human 的容器化部署方案，覆盖 Docker Compose、宿主机 Nginx 和代理 |
| `deployment/server-resource-requirements.md`          | 服务器资源申请建议与容量评估                                          |
| `Ops/README.md`                                       | 运维文档索引                                                          |
| `Ops/runbook.md`                                      | 日常巡检、重启、日志查看、短信/邮件/上传/附件问题排查                 |
| `Ops/release-and-rollback.md`                         | 本地发版、远程推送、生产授权发布与回滚流程                            |
| `Ops/backup-and-restore.md`                           | 数据、媒体、配置、证书、Payload 相关表的备份恢复说明                  |
| `Ops/payload-database-access.md`                      | Payload / PostgreSQL 数据查看方式、SQL 查询模板与风险说明             |
| `Ops/2026-04-27-main-production-rollout.md`           | 2026-04-27 生产覆盖部署历史记录，保留备份与回滚参考                   |
| `other_project/verification-provider-reuse.md`        | bothub 验证能力复用参考与当前 innovation 平台的复用落地点             |
| `progress/2026-04-14.md`                              | 初始化阶段记录                                                        |
| `progress/2026-04-15.md`                              | 品牌、主题、附件与部署调整记录                                        |
| `progress/2026-04-17.md`                              | 文档体系初始化整理记录                                                |
| `progress/2026-04-20.md`                              | 正式发版前后认证、设置页、短信链路完善记录                            |
| `progress/2026-04-30.md`                              | 当前版本综合能力、100MB 上传、访问记录字段和文档体系刷新记录          |

## 当前维护原则

1. 涉及路由、角色、认证、集合字段、API、上传能力或外部服务接入的改动，必须同步更新 `architecture/`、`user_doc/` 和 `testing.md`。
2. 涉及部署链路、域名、Nginx、systemd、Docker、构建方式或环境变量加载行为的改动，必须同步更新 `deployment/` 和 `Ops/`。
3. 涉及正式版、远程推送、生产覆盖部署、回滚或 tag 的改动，必须同步更新 `Ops/release-and-rollback.md` 与相应 `progress/` 记录。
4. 历史记录文件保留当时语境，但最新系统状态以本索引、当前主文档和代码实现为准。
5. 本机开发环境领先生产环境的功能，不得直接写成生产既有能力，必须在差异文档中明确标注。
