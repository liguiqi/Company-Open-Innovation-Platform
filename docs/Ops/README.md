# 运维文档

本目录用于记录开放创新平台的日常巡检、服务操作、发布回滚、数据备份以及 Payload / PostgreSQL 数据查看方式。

## 文档清单

- `runbook.md`：日常巡检、服务操作、日志查看与故障排查
- `release-and-rollback.md`：发布流程、上线校验与回滚方式
- `backup-and-restore.md`：数据库、媒体、配置和证书的备份恢复说明
- `payload-database-access.md`：如何连接 PostgreSQL、如何查看 Payload 后端数据

## 运维原则

1. 先确认真实运行状态，再做重启或配置修改。
2. 应用发布前至少完成 `lint / typecheck / build`。
3. 不在仓库文档中记录明文密钥、密码和 token。
4. 当前项目是单仓全栈架构，排障时要同时考虑 Next.js、Payload、数据库、Redis 和本地媒体目录。
