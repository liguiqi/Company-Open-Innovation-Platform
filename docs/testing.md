# 验收测试文档

## 1. 验收目标

本文档用于对Open Innovation Platform当前交付版本做业务验收，覆盖以下范围：

- 公共门户展示
- 账号注册、邮箱验证、登录与退出
- 合作伙伴方案提交
- 管理员 / 评审员方案审核
- Payload Admin 后台可用性
- 当前已知限制与外部依赖阻塞项

## 2. 验收环境

- 正式验收入口：`https://innovation.example.com`
- 应用直连入口：`http://127.0.0.1:3005`
- 管理后台入口：`https://innovation.example.com/admin`
- 建议浏览器：Chrome / Firefox 最新版

## 3. 验收前准备

1. 先打开首页，确认左上角显示为Open Innovation PNG Logo 图片，而非纯文本 `H&T`。
2. 如浏览器缓存了旧资源，先执行一次强制刷新：`Ctrl+Shift+R`。
3. 如需校验登录、方案和后台数据，请确保已执行过 `seed`。

## 4. 验收账号

- 管理员：使用 `.env.local` 中 `DEFAULT_ADMIN_USERNAME` / `DEFAULT_ADMIN_PASSWORD`
- 评审员：使用 `.env.local` 中 `DEFAULT_REVIEWER_EMAIL` / `DEFAULT_REVIEWER_PASSWORD`
- 合作伙伴：可使用用户名 `lgq`，或 `.env.local` 中的 `DEFAULT_PARTNER_EMAIL` / `DEFAULT_PARTNER_PASSWORD`
- 合作伙伴手机号：使用 `.env.local` 中 `DEFAULT_PARTNER_PHONE`

## 5. 验收项与通过标准

### 5.1 公共门户

1. 打开 `/`
   预期结果：页面样式完整加载，左上角为 Logo 图形字标，导航包含首页、技术需求大厅、生态伙伴目录、联合创新案例、合作流程。

2. 点击 `/needs`
   预期结果：可看到需求列表，至少包含 `RD-2026-001`、`RD-2026-005`、`RD-2026-008` 三条演示需求。

3. 打开 `/needs/RD-2026-001`
   预期结果：能查看需求详情，并看到“针对该需求提交方案”按钮。

4. 打开 `/ecosystem`
   预期结果：可看到生态伙伴目录，至少包含 `Partner A`、`Partner B`、`Partner C`。

5. 打开 `/cases`
   预期结果：可看到联合创新案例列表。

6. 打开 `/cases/foc-washing-machine`
   预期结果：可查看案例详情，并看到“下载技术白皮书”按钮。

7. 打开 `/process`
   预期结果：可查看合作流程说明页。

### 5.2 访问控制

1. 未登录直接访问 `/dashboard`
   预期结果：自动跳转到 `/login`。

2. 打开 `/admin`
   预期结果：可看到 Payload Admin 登录界面。

### 5.3 合作伙伴账号登录

1. 打开 `/login`
2. 使用用户名 `lgq` 或合作伙伴邮箱登录
   预期结果：登录成功后跳转到 `/dashboard`。

3. 打开 `/dashboard`
   预期结果：可看到概览卡片、最近方案列表。

4. 打开 `/dashboard/proposals`
   预期结果：合作伙伴仅能看到自己提交的方案，不应看到其他用户方案。

5. 打开 `/dashboard/settings`
   预期结果：可看到个人信息只读视图，页面明确提示完整维护需通过 `/admin` 完成。

### 5.4 合作伙伴提交方案

1. 登录合作伙伴账号后，打开 `/dashboard/proposals/new`
2. 选择一种方案类型，可选择关联某个公开需求
3. 填写标题、技术描述、联系人、邮箱、公司
4. 可选上传 PDF / PPT / Word 附件
5. 提交
   预期结果：提交成功后跳转到方案详情页，并生成新方案记录。

6. 返回 `/dashboard/proposals`
   预期结果：新提交方案出现在列表中，状态初始为待评审或评审中。

### 5.5 管理员 / 评审员审核方案

1. 退出当前账号
2. 使用管理员账号登录
3. 打开 `/dashboard/proposals`
   预期结果：管理员可查看全量方案。

4. 打开任一方案详情页
5. 修改状态为 `reviewing`、`approved` 或 `rejected`
6. 填写评审意见并保存
   预期结果：保存成功，详情页状态和评审意见更新。

7. 打开 `/dashboard/users`
   预期结果：管理员可查看用户视图，并能跳转到 `/admin/collections/users/:id` 编辑。

8. 打开 `/dashboard/partners`
   预期结果：管理员可查看伙伴视图。

### 5.6 Payload Admin 后台

1. 打开 `/admin`
2. 使用管理员账号登录
   预期结果：可进入后台并看到以下 Collections：

- `Users`
- `UserGroups`
- `TechNeeds`
- `Proposals`
- `Partners`
- `CaseStudies`
- `Media`

3. 随机打开一条 `Proposals` 或 `TechNeeds`
   预期结果：表单可正常加载与保存。

### 5.7 注册与邮箱验证

1. 打开 `/register`
2. 使用一个未注册邮箱完成注册
   预期结果：页面返回“注册成功，请前往邮箱完成验证”。

3. 收到验证邮件后点击验证链接
   预期结果：邮箱验证成功，并自动写入登录态。

备注：若企业邮箱 SMTP 服务端发生连接重置，注册接口仍可能返回成功，但邮件不会真正发出，此时该项属于外部邮件服务阻塞。

### 5.8 手机短信登录

1. 打开 `/login`
2. 切换到“手机短信”
3. 输入手机号后点击“发送验证码”
   预期结果：若短信服务已配置正式签名和模板，应收到真实短信验证码。

当前状态说明：

- 代码链路已支持短信发送与校验
- 当前阿里云短信账号下无可用签名、无可用模板
- 在该外部条件未补齐前，真实手机验证码验收暂不可通过

## 6. 回归检查

- 首页样式资源正常加载，不出现纯文本裸页
- 顶部 Logo 在首页、登录页、工作台、页脚展示一致
- 未登录访问受保护页面时会被拦截
- 登录后 Cookie 生效，刷新页面后保持登录态
- 方案状态变更后，列表和详情页状态一致
- `/admin` 与公共工作台可并行使用，不互相覆盖登录态

## 7. 当前已知限制

- `settings` 当前为只读页
- 真实手机短信验证码受阿里云签名 / 模板缺失阻塞
- 邮件发送受企业邮箱 SMTP 稳定性影响，当前为 best-effort
- `bothub.example.com` 反向代理已接通，但上游应用尚未放行该 Host
