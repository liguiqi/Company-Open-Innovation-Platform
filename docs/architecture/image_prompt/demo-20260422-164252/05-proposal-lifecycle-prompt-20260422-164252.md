# GPT Image Prompt - 方案提交流转图

参考文件：

- `../../proposal-lifecycle-flow-20260422-164252.puml`
- `../../proposal-lifecycle-flow-20260422-164252.svg`

可直接复制以下 prompt：

```text
Create a premium business-process architecture slide in Chinese for the Open Innovation Platform, focused on proposal submission and review lifecycle. Use a high-end enterprise style, Open Innovation Platform blue visual identity, 16:9 widescreen composition, and clean layered process arrows.

The process must include three stages: 提交阶段, 评审阶段, 下载附件阶段. Include these participants: 合作伙伴, 评审员 / 管理员, 提交方案页, 方案创建 API, 状态更新 API, 附件下载 API, 认证与会话, Payload Local API, 提案通知 Hook, 状态通知 Hook, 邮件服务, PostgreSQL, media 文件存储.

Show that a partner submits a proposal with multiple attachments, the API creates proposal and media records, hooks trigger reviewer notification, reviewers update status and review notes, hooks notify the partner, and authorized users can later download attachments through a controlled API.

The result should feel like an executive explanation of the business loop from submission to review to controlled file delivery. Add a bottom-right mark reading "Open Innovation Platform".
```
