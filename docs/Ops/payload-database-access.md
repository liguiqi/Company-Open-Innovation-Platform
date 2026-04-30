# Payload 后端数据库连接与数据查看

更新日期：`2026-04-30`

## 1. 先说结论

当前项目里的 Payload 后端不是独立部署的服务，而是嵌在 Next.js 应用里运行。主数据库是 `PostgreSQL`，连接配置定义在：

- `src/payload.config.ts`
- `src/lib/env.ts`

实际使用的连接变量：

- `DATABASE_URI`
- 若未提供，再回退到 `DATABASE_URL`

## 2. 推荐查看顺序

### 2.1 第一优先级：`/admin`

适合：

- 内容维护
- 字段核对
- 附件与关系字段排查
- 用户验证状态与最后访问时间查看
- 评审时间线查看

### 2.2 第二优先级：Payload REST / GraphQL

适合：

- 联调接口
- 快速查公开集合
- 外部脚本读取数据

示例：

```bash
curl http://127.0.0.1:3005/api/tech-needs?limit=5
curl -X POST http://127.0.0.1:3005/api/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"query { TechNeeds(limit: 3) { docs { id title needId status } } }"}'
```

### 2.3 第三优先级：直接 PostgreSQL

适合：

- DBA / 运维排障
- 确认真实表结构
- 看原始数据、关系表、时间线表和 JSON 富文本

## 3. 如何连接 PostgreSQL

### 3.1 从宿主机直接连

默认本地映射：

- Host：`127.0.0.1`
- Port：`5433`
- Database：`innovation_platform`
- User：`payload`
- Password：取自 `DATABASE_URI` 或本地 Docker 的 `POSTGRES_PASSWORD`

### 3.2 通过 Docker 容器进入

```bash
cd /home/deploy/apps/open-innovation-platform
docker compose exec -T postgres psql -U payload -d innovation_platform
```

## 4. 主表与典型含义

| 表名                        | 含义                 |
| --------------------------- | -------------------- |
| `users`                     | 平台用户             |
| `user_groups`               | 用户组               |
| `tech_needs`                | 技术需求             |
| `proposals`                 | 创新方案             |
| `proposals_review_timeline` | 方案评审时间线       |
| `proposals_rels`            | 方案与附件等关系表   |
| `partners`                  | 生态伙伴             |
| `case_studies`              | 联合案例             |
| `media`                     | 图片与文档附件       |
| `payload_migrations`        | Payload 迁移记录     |
| `payload_preferences`       | Payload 偏好设置     |
| `payload_folders`           | Media 文件夹与浏览树 |

进入 `psql` 后先执行：

```sql
\dt
```

## 5. 常用 SQL 查询

### 5.1 查用户与最后访问时间

```sql
SELECT
  id,
  email,
  phone,
  role,
  username,
  name,
  company,
  email_verified_at,
  phone_verified_at,
  last_access_at
FROM users
ORDER BY id DESC
LIMIT 20;
```

### 5.2 查需求

```sql
SELECT id, need_id, title, status, priority, domain, published_at
FROM tech_needs
ORDER BY id DESC
LIMIT 20;
```

### 5.3 查方案

```sql
SELECT id, title, status, submitted_by_id, reviewed_by_id, updated_at
FROM proposals
ORDER BY id DESC
LIMIT 20;
```

### 5.4 查方案评审时间线

```sql
SELECT
  _parent_id AS proposal_id,
  actor_name,
  actor_role,
  occurred_at,
  status,
  notes
FROM proposals_review_timeline
ORDER BY _parent_id DESC, _order ASC;
```

### 5.5 查方案附件

```sql
SELECT
  p.id AS proposal_id,
  p.title,
  m.id AS media_id,
  m.filename,
  m.mime_type,
  m.module,
  m.asset_category,
  m.storage_key
FROM proposals p
LEFT JOIN proposals_rels pr
  ON pr.parent_id = p.id
 AND pr.path = 'attachments'
LEFT JOIN media m
  ON m.id = pr.media_id
ORDER BY p.id DESC, m.id DESC;
```

## 6. 为什么有些字段像“乱码”

不是乱码，而是 Payload 富文本 JSON，例如：

- `proposals.description`
- `proposals.review_notes`
- `tech_needs.description`
- `case_studies.content`

若只是看业务内容，优先使用：

1. `/admin`
2. REST / GraphQL
3. 代码里的 Payload Local API

## 7. 代码里如何查看后端数据

```ts
import { getPayloadClient } from '@/lib/payload'

const payload = await getPayloadClient()

const proposals = await payload.find({
  collection: 'proposals',
  limit: 10,
  overrideAccess: true,
})
```

注意：

- `overrideAccess: true` 只应用于受信任的服务端代码、脚本或运维场景
- 不要把用户输入直接拼到带 `overrideAccess: true` 的查询里

## 8. 直接查库时必须知道的风险

1. 直接 SQL 不会走 Payload 访问控制
2. 不会触发 Hook、邮件通知、短信逻辑、访问记录刷新和附件权限逻辑
3. 直接改表容易破坏关系表、文件关联和时间线完整性

因此：

- 看数据：可以查库
- 改数据：优先 `/admin`，其次 Payload API，再考虑 SQL

## 9. 当前最常用命令

```bash
cd /home/deploy/apps/open-innovation-platform

docker compose exec -T postgres psql -U payload -d innovation_platform

docker compose exec -T postgres psql -U payload -d innovation_platform -c '\dt'

docker compose exec -T postgres psql -U payload -d innovation_platform \
  -c "SELECT id, email, phone, role, username, last_access_at FROM users ORDER BY id DESC LIMIT 20;"
```
