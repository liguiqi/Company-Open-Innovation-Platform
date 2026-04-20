# 邮箱验证码与阿里云短信验证码复用开发思路

## 目标

本文档用于说明 `bothub` 当前邮箱验证码与阿里云短信验证码的实现思路，方便在其他项目中复用同一套能力。

设计目标不是把短信和邮箱发送逻辑直接写死在业务接口里，而是拆成以下三层：

1. 业务入口层：注册、登录、重置密码等接口负责判断场景与账号状态。
2. 验证码中心层：负责生成验证码、频控、落库、验证、过期和错误次数控制。
3. 通道适配层：负责真正调用 SMTP 邮件服务和阿里云短信服务。

## 当前 bothub 的落地结构

相关代码位置：

- `bothub/src/routes/auth.js`
- `bothub/src/services/codeService.js`
- `bothub/src/services/emailService.js`
- `bothub/src/services/smsService.js`
- `bothub/src/db/schema.sql`

核心思路：

- `auth.js` 不直接处理第三方平台细节，只负责选择 `phone` 或 `email` 通道。
- `codeService.js` 统一生成 6 位验证码，并使用 `Redis + PostgreSQL` 管理发送频率、验证码状态和验证次数。
- `emailService.js` 只做邮件发送。
- `smsService.js` 只做阿里云短信发送。
- 实际验证码明文不入库，只保存 `sha256(code + JWT_SECRET)` 后的哈希值。

## 一、邮箱验证码复用思路

### 1. 通道选型

`bothub` 当前使用的是 `nodemailer + SMTP`，而不是调用某个邮件 SaaS 的 HTTP API。

这样做的优点：

- 更容易迁移到不同项目。
- 只要邮箱服务商支持 SMTP，就能复用。
- 与业务代码解耦，不依赖某一个邮件平台 SDK。

### 2. 当前 bothub 的实际落地

当前运行态使用的是：

- SMTP 主机：`smtp.example.com`
- SMTP 端口：`994`
- `secure=true`
- 发件账号：`confluence@example.com`
- 发件地址：`confluence@example.com`
- 发件显示名：`BotHub`
- `EMAIL_MOCK=false`

注意：

- `bothub` 实际使用的是 `994 + SSL`。
- 你之前提供的 `25` 端口并不是当前 bothub 运行态落地值。
- IMAP 只用于收件，不参与 bothub 验证码发送流程，所以另一个项目如果只是做验证码下发，不需要 IMAP。

### 3. 复用时建议的配置项

建议另一个项目至少保留下面这些环境变量：

```env
SMTP_HOST=
SMTP_PORT=994
SMTP_SECURE=true
SMTP_USER=
SMTP_PASS=
SMTP_FROM_NAME=BotHub
SMTP_FROM_ADDRESS=
SMTP_TLS_REJECT_UNAUTHORIZED=true
EMAIL_MOCK=false
```

### 4. 推荐封装方式

建议保留一个独立的 `emailService`：

- 输入：`toEmail`、`code`
- 输出：`{ success, provider, requestId, error }`

推荐返回结构：

```json
{
  "success": true,
  "provider": "smtp",
  "requestId": "smtp-1713333333333"
}
```

这样做的好处是：

- 业务层不需要知道底层是 SMTP 还是其他邮件网关。
- 后续如果切换腾讯云邮件、SendCloud、阿里云邮件推送，只要替换适配层。

## 二、阿里云短信验证码复用思路

### 1. 通道选型

`bothub` 当前使用的是阿里云 `Dypnsapi` 的 `SendSmsVerifyCode` 接口，而不是旧版 `Dysmsapi`。

当前 Node 依赖：

- `@alicloud/dypnsapi20170525`
- `@alicloud/openapi-client`
- `@alicloud/credentials`
- `@alicloud/tea-util`

### 2. 当前 bothub 的实际落地

当前运行态短信配置是：

- 短信服务端点：`dypnsapi.aliyuncs.com`
- 国家码：`86`
- 短信签名：`平台验证码`
- 模板编码：`100001`
- 业务场景名：`平台验证码`
- `SMS_MOCK=false`

AK/SK 当前确实是通过环境变量注入到容器里运行，但不建议在任何项目文档、仓库文件或前端代码中明文保存。

### 3. 复用时建议的配置项

建议另一个项目保留这些环境变量：

```env
ALIYUN_ACCESS_KEY_ID=
ALIYUN_ACCESS_KEY_SECRET=
ALIYUN_SMS_SIGN=
ALIYUN_SMS_TEMPLATE=
ALIYUN_SMS_SCHEME_NAME=
ALIYUN_SMS_COUNTRY_CODE=86
ALIYUN_SMS_ENDPOINT=dypnsapi.aliyuncs.com
SMS_MOCK=false
```

### 4. 推荐封装方式

建议保留一个独立的 `smsService`：

- 输入：`phone`、`code`
- 输出：`{ success, provider, requestId, error }`

推荐返回结构：

```json
{
  "success": true,
  "provider": "aliyun-dypnsapi",
  "requestId": "A1B2C3..."
}
```

这样可以让业务层完全不依赖阿里云 SDK 的返回字段格式。

## 三、验证码中心层的复用建议

### 1. 不要把验证码直接存在 Redis 明文

`bothub` 当前做法是：

- Redis 只存频控信息
- PostgreSQL 存验证码记录
- 验证码入库前先做哈希

推荐保留的能力：

- 发送冷却时间，例如 60 秒
- 每日发送上限，例如 10 次
- 验证码有效期，例如 5 分钟
- 最大输错次数，例如 5 次
- 发送记录状态：`pending/sent/verified/expired/failed/superseded`

### 2. 推荐数据表设计

另一个项目如果也走公网正式验证，建议保留类似 `verification_codes` 表。

核心字段建议保留：

- `channel`
- `identifier`
- `scene`
- `code_hash`
- `status`
- `provider`
- `provider_request_id`
- `attempts`
- `error_message`
- `expires_at`
- `sent_at`
- `verified_at`

### 3. 业务接口不要直接信任通道返回成功

推荐顺序：

1. 业务接口先做账号状态校验。
2. 验证码中心先做频控校验。
3. 生成验证码并创建数据库记录。
4. 调用邮件或短信适配器发送。
5. 根据发送结果回写数据库状态。

这样做的好处是：

- 发送失败也有审计记录。
- 后面查问题时能定位到底是业务拦截、频控拦截还是第三方通道失败。

## 四、另一个项目复用时的推荐拆分

建议按下面 4 个模块拆：

### 1. `verificationService`

负责：

- 生成验证码
- 哈希验证码
- Redis 频控
- PostgreSQL 落库
- 校验验证码
- 失败次数累加

### 2. `emailService`

负责：

- 初始化 SMTP transporter
- 发送邮件模板
- 返回统一结果结构

### 3. `smsService`

负责：

- 初始化阿里云客户端
- 发送短信验证码
- 解析阿里云返回结构
- 返回统一结果结构

### 4. `auth/usecase`

负责：

- 注册场景是否允许发码
- 登录场景是否允许发码
- 重置密码场景是否允许发码
- 选择 `phone` 或 `email` 通道

## 五、对外接口建议

另一个项目如果复用 same pattern，建议接口保持简单：

### 1. 发送验证码

`POST /api/auth/send-code`

请求体：

```json
{
  "type": "email",
  "identifier": "dev@example.com",
  "scene": "register"
}
```

### 2. 校验验证码并完成注册/绑定/重置

不要额外提供一个“裸 verify-code”接口给前端长期暴露，推荐直接在业务接口里完成校验并落业务状态。

原因：

- 减少验证码可重放风险
- 降低前端状态管理复杂度
- 让验证码生命周期更贴近业务动作

## 六、复用到另一个项目时的注意事项

### 1. 不要复用明文密钥写进仓库

正确做法：

- 本地开发放 `.env.local`
- 服务器放系统环境变量或部署平台密文配置
- 不在 Markdown、源码、前端配置里保存 AK/SK 和邮箱密码

### 2. 邮箱端口优先按实测值走

虽然供应商文档可能给出多个端口，但 `bothub` 当前实测可用的是：

- `smtp.example.com:994`
- `secure=true`

如果另一个项目要快速复用，优先直接照这个组合测试。

### 3. 短信通道要区分“模板、签名、业务名”

这三项缺一不可：

- `ALIYUN_SMS_SIGN`
- `ALIYUN_SMS_TEMPLATE`
- `ALIYUN_SMS_SCHEME_NAME`

很多项目短信调不通，不是 AK/SK 有问题，而是模板或业务场景名没有配齐。

### 4. 统一 mock 开关

建议两个通道都保留 mock 开关：

- `EMAIL_MOCK`
- `SMS_MOCK`

这样本地联调时可以先走假发送，不必每次都真实触发第三方。

## 七、推荐的最小复用方案

如果另一个项目时间紧，不需要完整复制 `bothub` 全部认证体系，最低建议复用下面这套：

1. `emailService`
2. `smsService`
3. `verification_codes` 表
4. `Redis` 冷却时间控制
5. `send-code` 接口
6. 在注册/登录/重置接口内部完成验证码校验

这 6 项足够支撑大部分公网验证码业务。

## 八、总结

`bothub` 当前的做法本质上是“验证码中心 + 多通道适配器”的结构，而不是把验证码发送逻辑散落在各个业务接口里。另一个项目如果要复用，建议直接复制这种分层方式：

- 业务层只关心场景与账号状态
- 验证码中心层统一做频控、哈希、落库、校验
- 邮件和短信各自做通道适配
- 所有敏感配置只通过环境变量注入

这样后续即使替换邮箱服务商、替换短信平台、增加 WhatsApp 或企业微信验证码通道，也不需要重写业务主流程。
