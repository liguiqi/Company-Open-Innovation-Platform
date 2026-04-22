# GPT Image Prompt - 主要实体关系图

参考文件：

- `../../domain-entity-model-20260422-164252.puml`
- `../../domain-entity-model-20260422-164252.svg`

可直接复制以下 prompt：

```text
Generate a refined enterprise data model infographic in Chinese for the HeT Open Innovation Platform. The image should look like a boardroom-ready architecture poster, not a raw ER diagram screenshot. Use HET blue, white, and subtle gray, with polished entity cards and relationship lines in a 16:9 horizontal layout.

Show these entities with concise Chinese labels and key fields: users, user-groups, tech-needs, proposals, media, partners, case-studies. The most important relationships that must be visible are: users to proposals (submittedBy), tech-needs to proposals (relatedNeed), proposals to media (attachments and source proposal), users to media (uploadedBy), users to user-groups, partners to media (logo), case-studies to media (coverImage), and users to media (avatar).

Emphasize that proposal is the core business entity connecting需求, 方案, 附件, 提交人, 评审人, and 状态流转. The chart should be easy for executives to understand even if they are not engineers. Add a small signature in the bottom-right corner: "Power by LGQ".
```
