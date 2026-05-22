# 邮箱验证码与阿里云短信验证码复用开发思路

## 目标

本文档说明 `bothub` 已有的邮箱验证码与阿里云短信验证码能力，如何在当前 `innovation-platform` 项目中复用，以及当前项目已经实际落地了哪些内容。

核心原则不是把验证码逻辑散落到业务接口，而是拆成三层：

1. 业务入口层
   注册、登录、资料维护等接口只负责场景判断和账号状态判断。
2. 验证码中心层
   负责生成验证码、限流、缓存、过期和校验。
3. 通道适配层
   负责真正调用 SMTP 邮件通道和阿里云短信通道。

## 当前两个项目的关系

### 1. `bothub` 提供的可复用经验

`bothub` 已经验证过以下两条通道：

1. 企业邮箱 SMTP 发验证码。
2. 阿里云 `Dypnsapi` 发短信验证码。

### 2. `innovation-platform` 的当前复用结果

当前Open Innovation Platform已经复用了：

1. SMTP 通道接入思路。
2. 阿里云 `Dypnsapi` 接入思路。
3. 发送频控和验证码 TTL 设计。
4. 注册场景和登录场景分离的验证码 key 命名方式。
5. mock 开关与开发联调兜底。

当前Open Innovation Platform没有完整照搬 `bothub` 的点：

1. 没有单独落地 `verification_codes` 表。
2. 没有把验证码哈希后写入 PostgreSQL。
3. 当前验证码主要使用 `Redis` 作为临时存储。

因此，当前项目属于“轻量复用版”，适合当前业务量和一体化部署形态。

## 一、邮箱验证码复用思路

### 1. 通道选型

当前仍然采用 `nodemailer + SMTP`，而不是外部邮件 SaaS 的 HTTP API。

优点：

1. 更容易迁移到不同项目。
2. 只要邮箱服务商支持 SMTP 就能复用。
3. 不依赖某个特定邮件平台的 SDK。

### 2. 当前实际落地

当前项目邮件发送代码位置：

1. `src/services/email.ts`
2. `src/payload.config.ts`
3. `src/lib/env.ts`

当前支持的邮件场景：

1. 邮箱注册链接验证。
2. 注册验证码发送。
3. 登录验证码发送。
4. 提案提交通知。
5. 提案状态更新通知。

### 3. 当前配置抽象

当前项目保留了以下环境变量抽象：

```env
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_USER=
SMTP_PASS=
SMTP_FROM_NAME=
SMTP_FROM_ADDRESS=
SMTP_TLS_REJECT_UNAUTHORIZED=
EMAIL_MOCK=
```

当前行为细节：

1. `SMTP_PORT` 为 `465` 或 `994` 时，若未显式配置 `SMTP_SECURE`，系统会自动推断为 `secure=true`。
2. 若 `EMAIL_MOCK=true` 或 SMTP 配置不完整，邮件接口会走 `skipped` 兜底，不直接抛出未处理异常。
3. 对于验证码链路，生产环境下如果只剩 mock，不应视为真正可用。

### 4. 推荐封装方式

当前 `sendEmail()` 的返回结构是：

1. 成功时返回 `nodemailer.SentMessageInfo`
2. 跳过或失败兜底时返回 `{ skipped: true }`

如果未来要在其他项目进一步抽象，建议统一为：

```json
{
  "success": true,
  "provider": "smtp",
  "requestId": "smtp-1713333333333"
}
```

## 二、阿里云短信验证码复用思路

### 1. 当前必须保留的事实

Open Innovation Platform当前正式可用的短信签名与模板，必须保持为阿里云已审核通过的旧值：

1. 签名：`平台验证码`
2. 模板：`100001`
3. 业务场景名：`平台验证码`

重要说明：

1. 阿里云 `Dypnsapi` 的签名不能只通过代码改名。
2. 若更换短信签名，必须先在阿里云控制台完成审核。
3. 之前尝试直接改为新的签名文案，会导致“签名或者模板无效”。

### 2. 当前通道选型

当前项目采用：

1. `@alicloud/dypnsapi20170525`
2. `@alicloud/openapi-client`
3. `@alicloud/tea-util`

代码位置：

1. `src/services/aliyun-sms.ts`
2. `src/lib/env.ts`

### 3. 当前实现特点

当前短信发送实现不是旧版 `Dysmsapi`，而是阿里云 `Dypnsapi` 的 `SendSmsVerifyCode`。

当前实现细节：

1. 自动生成 6 位验证码。
2. 发送参数中固定使用 `codeLength=6`、`validTime=300`、`interval=60`。
3. SDK 打开 `returnVerifyCode=true`，优先使用阿里云返回的验证码值。
4. 短信发送失败时会做一次轻量重试。
5. 连接超时、网络抖动等异常会被识别为可重试错误。

### 4. 当前配置抽象

```env
ALIYUN_ACCESS_KEY_ID=
ALIYUN_ACCESS_KEY_SECRET=
ALIYUN_SMS_ACCESS_KEY_ID=
ALIYUN_SMS_ACCESS_KEY_SECRET=
ALIYUN_SMS_COUNTRY_CODE=86
ALIYUN_SMS_ENDPOINT=dypnsapi.aliyuncs.com
ALIYUN_SMS_SIGN=平台验证码
ALIYUN_SMS_TEMPLATE=100001
ALIYUN_SMS_SCHEME_NAME=平台验证码
SMS_MOCK=false
```

说明：

1. 当前代码同时兼容 `ALIYUN_ACCESS_KEY_ID` 和 `ALIYUN_SMS_ACCESS_KEY_ID` 两套命名。
2. `ALIYUN_SMS_SIGN` 与 `ALIYUN_SMS_SIGN_NAME` 也会做兼容读取。
3. 若配置不完整，项目会退回 mock 模式，但生产环境不应依赖该模式。

### 5. 当前返回结构

当前 `sendSMSCode()` 返回两类结构：

1. mock：

```json
{
  "mocked": true,
  "provider": "mock",
  "requestId": "mock-1713333333333",
  "verifyCode": "123456"
}
```

2. 阿里云：

```json
{
  "provider": "aliyun-dypnsapi",
  "requestId": "A1B2C3",
  "verifyCode": "123456",
  "success": true
}
```

失败时会补充：

1. `code`
2. `message`
3. `success=false`

## 三、验证码中心层在当前项目中的实现

### 1. 当前缓存策略

当前Open Innovation Platform主要使用 Redis 保存验证码，而不是数据库表。

当前 key 设计：

1. 注册邮箱验证码：`email:otp:{email}`
2. 注册手机验证码：`sms:otp:{phone}`
3. 登录邮箱验证码：`login:email:otp:{email}`
4. 登录手机验证码：`login:phone:otp:{phone}`

统一特征：

1. TTL 为 `300 秒`
2. 场景隔离，避免注册验证码和登录验证码串用
3. 校验成功后立即删除

### 2. 当前限流策略

当前项目使用 `rate-limiter-flexible` 控制：

1. 单邮箱发送频率。
2. 单手机号发送频率。
3. 单 IP 发送频率。
4. 单验证码校验尝试次数。
5. 注册场景和登录场景的不同前缀。

### 3. 当前与 `bothub` 的差异

| 项目         | `bothub` 思路               | 当前Open Innovation Platform             |
| ------------ | --------------------------- | ---------------------------- |
| 验证码持久化 | Redis + PostgreSQL          | Redis 为主                   |
| 验证码明文   | 不入库，哈希后落库          | 不入库，缓存即用即删         |
| 验证码表     | 推荐有 `verification_codes` | 当前未单独建表               |
| 适用场景     | 更偏通用认证中心            | 更偏当前业务平台的一体化实现 |

结论：

1. 当前平台已经足够支撑注册、登录和基础验证。
2. 若未来验证码业务变复杂，例如要审计每次发送记录、接入更多场景、做风控分析，再考虑升级为 `bothub` 那套“Redis + 数据库”中心化结构。

## 四、当前Open Innovation Platform中的业务场景拆分

### 1. 注册场景

当前注册接口：

1. `POST /api/auth/email-code`
2. `POST /api/sms/send`
3. `POST /api/auth/register`

逻辑特点：

1. 基础信息先填。
2. 邮箱或手机号至少完成一种验证。
3. 校验通过后创建 `partner` 角色用户。
4. 注册完成后跳转回登录页。

### 2. 验证码登录场景

当前登录接口：

1. `POST /api/auth/login-code/send`
2. `POST /api/auth/login-code/verify`

逻辑特点：

1. 自动识别邮箱或手机号。
2. 验证码校验成功后，查询 `users` 集合。
3. 只有已有账号才允许登录。
4. 若账号不存在，返回 `redirectTo=/register?...` 给前端弹窗使用。

### 3. 个人资料变更场景

当前资料接口：

1. `PATCH /api/account/profile`

逻辑特点：

1. 用户修改邮箱或手机号后，会重置对应验证状态。
2. 非管理员账号必须至少保留一个已验证通道。
3. 这是当前项目对“账号安全性”的额外补充，不属于 `bothub` 原始复用范围。

## 五、对外接口建议

如果另一个项目要复用当前实现思路，建议至少保留以下接口拆分：

### 1. 发送注册邮箱验证码

`POST /api/auth/email-code`

### 2. 发送注册短信验证码

`POST /api/sms/send`

### 3. 注册

`POST /api/auth/register`

### 4. 发送登录验证码

`POST /api/auth/login-code/send`

### 5. 验证登录验证码

`POST /api/auth/login-code/verify`

为什么这样拆：

1. 注册和登录是不同业务语义，不能共享同一组 key。
2. 登录验证码通过并不代表允许自动注册。
3. 注册场景与登录场景的错误提示、跳转和限流策略都不同。

## 六、安全注意事项

### 1. 不在仓库或文档中记录明文凭据

正确做法：

1. 本地开发放 `.env.local`
2. 服务器放系统环境变量或密文配置
3. Markdown 文档只记录变量名，不记录明文 AK/SK、邮箱密码和 token

### 2. 验证码不要长期保留

当前项目做法：

1. TTL 统一 5 分钟
2. 校验成功即删除
3. 不做长期业务表持久化

### 3. 验证码登录不能自动注册

这是本项目已经踩过并修正的重点：

1. 验证码登录只做“已有用户快速登录”
2. 若用户不存在，必须让其主动走注册流程

### 4. 生产环境不能依赖 mock

`EMAIL_MOCK` 和 `SMS_MOCK` 只适合：

1. 本地联调
2. 内部开发测试

不适合生产正式验证链路。

## 七、推荐的最小复用方案

若另一个项目需要快速复用当前能力，最低建议复制以下内容：

1. `src/services/email.ts`
2. `src/services/aliyun-sms.ts`
3. `src/services/redis.ts`
4. `src/services/rate-limit.ts`
5. `src/lib/env.ts`
6. 注册验证码与登录验证码分场景的 key 设计
7. 注册接口与登录接口分离的业务规则

## 八、何时要升级为更重的验证码中心

当出现以下需求时，应考虑从当前轻量方案升级到 `bothub` 那种更完整的验证码中心：

1. 需要审计每一次发送和验证结果。
2. 需要追踪失败次数与风控命中原因。
3. 需要接入更多通道，例如企业微信、WhatsApp 或语音验证码。
4. 需要跨多个业务系统共享同一套验证码中心。

## 九、总结

当前Open Innovation Platform已经成功复用了 `bothub` 中最有价值的两项基础能力：

1. SMTP 邮箱验证码发送。
2. 阿里云 `Dypnsapi` 短信验证码发送。

同时，当前项目根据自身业务做了更贴近实际的平台化裁剪：

1. 注册与登录场景严格分离。
2. 验证码登录不自动注册。
3. Redis 轻量缓存替代数据库验证码表。
4. 邮箱和短信配置都保留 mock 兜底与生产禁用约束。

如果后续另一个项目时间紧，直接复用当前这套“Redis + SMTP + Dypnsapi + 场景分离”的结构，已经足够支撑大多数验证码业务。
