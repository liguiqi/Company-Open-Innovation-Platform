# GPT Image Prompt - 认证与验证码业务流图

参考文件：

- `../../auth-verification-flow-20260422-164252.puml`
- `../../auth-verification-flow-20260422-164252.svg`

可直接复制以下 prompt：

```text
Generate a sophisticated user authentication and verification flow infographic in Chinese for the Open Innovation Platform. The style should be presentation-grade enterprise process design, with high clarity, restrained blue motion lines, and a 16:9 horizontal layout.

Show two connected business flows: 注册阶段 and 已有账号验证码登录. Include these nodes with clear Chinese labels: 用户, 登录页 / 注册页, 邮箱验证码 API, 短信验证码 API, 注册 API, 登录验证码发送 API, 登录验证码校验 API, 限流服务, SMTP 邮件服务, 阿里云短信, Redis OTP Cache, Payload Local API, innovation-session Cookie.

The registration part must show sending email and SMS verification codes, storing OTP in Redis, checking uniqueness in users, and creating a partner account only after at least one channel is verified. The login part must show sending email or SMS login code, verifying the OTP, checking users by email or phone, setting the session cookie if the account exists, and redirecting to register if the account does not exist.

Use elegant sequence or process-flow visual metaphors, but make it look like a premium product architecture slide rather than code documentation. Add the visible signature "Open Innovation Platform" in the bottom-right corner.
```
