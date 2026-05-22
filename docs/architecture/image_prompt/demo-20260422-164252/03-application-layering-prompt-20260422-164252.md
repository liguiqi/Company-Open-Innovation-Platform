# GPT Image Prompt - 应用分层图

参考文件：

- `../../application-layering-20260422-164252.puml`
- `../../application-layering-20260422-164252.svg`

可直接复制以下 prompt：

```text
Create a polished software architecture layering infographic in Chinese for "Open Innovation Platform". The style should look like an executive technical presentation, not like raw UML. Use layered translucent panels, Open Innovation Platform blue branding, crisp typography, and a clean 16:9 composition.

The diagram must visually separate these layers from top to bottom: 表示层 / Route Groups, 接口层 / Route Handlers, 领域层 / Payload Domain, 应用服务层, 共享基础设施代码, and runtime resources including PostgreSQL, Redis, media 文件目录, SMTP / 阿里云短信.

Inside the layers, include these concrete modules: 公开门户, 认证注册, 工作台, Payload Admin, 认证接口, 短信接口, 提案接口, 附件接口, 账号资料接口, Collections, Access Control, Hooks, Email Service, Aliyun SMS Service, Redis Cache, Rate Limit, auth.ts, payload.ts, validators.ts, env.ts, media.ts, lexical.ts.

The visual goal is to explain that this is a monorepo full-stack application with clear internal layering and direct local data access. Use arrows that clearly show dependency direction. Add a small, tasteful "Open Innovation Platform" mark in the bottom-right corner.
```
