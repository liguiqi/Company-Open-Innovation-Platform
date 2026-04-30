# 架构文档索引

当前架构文档记录的是本仓库截至 `2026-04-30` 的真实落地实现，既包含可维护的 Markdown 说明，也包含已生成的 PlantUML / SVG 图和演示用提示词资产。

## 文档清单

| 路径                                                | 说明                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------ |
| `architecture_md/README.md`                         | Markdown 架构文档索引                                              |
| `architecture_md/system-architecture.md`            | 当前系统分层、路由、API、认证、集合模型和关键链路说明              |
| `architecture_md/deployment-topology.md`            | 当前开发环境与生产调试环境的部署拓扑、端口和运行约束               |
| `plantuml-index-20260422-164252.md`                 | 2026-04-22 架构图索引                                              |
| `system-context-20260422-164252.puml/.svg`          | 系统上下文图                                                       |
| `runtime-deployment-20260422-164252.puml/.svg`      | 运行时部署图                                                       |
| `application-layering-20260422-164252.puml/.svg`    | 应用分层图                                                         |
| `auth-verification-flow-20260422-164252.puml/.svg`  | 邮箱 / 短信验证码链路图                                            |
| `proposal-lifecycle-flow-20260422-164252.puml/.svg` | 提案生命周期与附件下载链路图                                       |
| `domain-entity-model-20260422-164252.puml/.svg`     | 领域实体关系图                                                     |
| `image_prompt/demo-20260422-164252/`                | 架构演示图的 GPT-image prompt 素材，统一附带 `Powered by LGQ` 要求 |

## 使用原则

1. 当前系统事实优先以 `architecture_md/` 下 Markdown 文档为准。
2. PlantUML / SVG 属于某一时点的结构快照，若路由、集合或部署方式发生变化，应优先更新 Markdown，再决定是否重绘图。
3. 不在架构文档中记录任何明文凭据，只记录变量名、组件关系和运行约束。
