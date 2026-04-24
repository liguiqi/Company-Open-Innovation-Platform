# 运维文档

当前运维文档面向正式版 `v1.0.0`，覆盖开放创新平台的巡检、故障处理、发版、回滚、备份恢复与 Payload / PostgreSQL 数据查看方式。

## 文档清单

- `runbook.md`：日常巡检、服务操作、日志查看与短信问题排查
- `release-and-rollback.md`：正式发版、tag、推送、发布与回滚流程
- `backup-and-restore.md`：数据库、媒体、配置和证书备份恢复说明
- `payload-database-access.md`：如何连接 PostgreSQL、如何查看 Payload 后端数据

## 运维原则

1. 先确认真实运行状态，再做重启或配置修改。
2. 应用发布前至少完成 `lint / typecheck / build`。
3. standalone 环境变量变更后必须重新构建。
4. 不在仓库文档中记录明文密钥、密码和 token。
