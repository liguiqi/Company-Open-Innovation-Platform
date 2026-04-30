# 运维文档

当前运维文档面向 `2026-04-30` 版本仓库状态，覆盖开放创新平台在本机开发环境与生产调试环境中的巡检、故障处理、发版、回滚、备份恢复与 Payload / PostgreSQL 数据查看方式。

## 文档清单

- `2026-04-27-main-production-rollout.md`：2026-04-27 生产覆盖部署的历史实操记录，包含备份、上线、验证与回滚入口
- `runbook.md`：日常巡检、服务操作、日志查看、上传失败、验证码与附件问题排查
- `release-and-rollback.md`：本地发版、远程推送、生产授权部署与回滚流程
- `backup-and-restore.md`：数据库、媒体、配置、证书与 Payload 关键表备份恢复说明
- `payload-database-access.md`：如何查看 Payload 后端数据、如何连接 PostgreSQL、如何查访问记录和评审时间线

## 运维原则

1. 先确认真实运行状态，再决定是否重启服务、回滚代码或修改 Nginx / systemd 配置。
2. 本地仓库推送远程与生产部署是两个动作；生产覆盖更新必须获得明确授权。
3. 涉及环境变量的变更，至少执行 `pnpm build`、重启 `innovation-platform.service`，必要时再 reload Nginx。
4. 上传链路的有效上限由三层共同决定：业务接口 `100MB`、Next `120mb`、Nginx `120M`。
5. 不在仓库运维文档中记录任何明文密钥、账号密码或 token。
