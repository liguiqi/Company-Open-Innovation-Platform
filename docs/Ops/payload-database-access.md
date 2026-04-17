# Payload 后端数据库连接与数据查看

## 1. 先说结论

当前项目里的 “Payload 后端” 不是单独部署的服务，而是嵌在 Next.js 应用里运行。它连接的主数据库是 `PostgreSQL`，连接方式定义在：

- `src/payload.config.ts`
- `src/lib/env.ts`

Payload 实际使用的连接变量为：

- `DATABASE_URI`
- 若未提供，再回退到 `DATABASE_URL`

## 2. 推荐的查看顺序

### 2.1 第一优先级：`/admin`

适合：

- 运营查看内容
- 管理员核对字段
- 排查关系字段、上传文件和状态流转

优点：

- 走 Payload 自身权限
- 能正确显示关系字段和富文本字段
- 不需要手写 SQL

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

注意：

- 这些接口属于 Payload 原生接口
- 其鉴权逻辑是 Payload 自身认证，不等同于 Dashboard 的 `innovation-session`
- 公开集合（如 `tech-needs`、`partners`、`case-studies`）更适合这样查看

### 2.3 第三优先级：直接连 PostgreSQL

适合：

- DBA / 运维排障
- 确认真实表结构
- 看原始数据、关系表、JSONB 字段

## 3. 如何连接 PostgreSQL

### 3.1 从宿主机直接连

当前默认本地映射是：

- Host：`127.0.0.1`
- Port：`5433`
- Database：`innovation_platform`
- User：`payload`
- Password：以 `DATABASE_URI` 里的密码段为准；如果使用本地 Docker 默认配置，也会受 `POSTGRES_PASSWORD` 控制

如果沿用 `.env.example` 默认格式，连接串类似：

```text
postgresql://payload:<POSTGRES_PASSWORD>@127.0.0.1:5433/innovation_platform
```

### 3.2 通过 Docker 容器进入

```bash
cd /home/deploy/apps/open-innovation-platform
docker compose exec -T postgres psql -U payload -d innovation_platform
```

### 3.3 用图形化工具连接

如果你使用 DBeaver、DataGrip、Navicat、pgAdmin，可按下表填写：

| 项       | 值                                                                 |
| -------- | ------------------------------------------------------------------ |
| Host     | `127.0.0.1`                                                        |
| Port     | `5433`                                                             |
| Database | `innovation_platform`                                              |
| Username | `payload`                                                          |
| Password | 取自 `DATABASE_URI` 中的密码，或本地 Docker 的 `POSTGRES_PASSWORD` |

## 4. 数据库里有哪些主表

当前库里能直接看到的主表包括：

| 表名                        | 对应含义             |
| --------------------------- | -------------------- |
| `users`                     | 平台用户             |
| `user_groups`               | 用户组               |
| `tech_needs`                | 技术需求             |
| `proposals`                 | 创新方案             |
| `proposals_rels`            | 方案与附件等关系表   |
| `partners`                  | 生态伙伴             |
| `case_studies`              | 联合案例             |
| `media`                     | 图片与文档附件       |
| `payload_migrations`        | Payload 迁移记录     |
| `payload_preferences`       | Payload 偏好设置     |
| `payload_locked_documents*` | Admin 锁定文档相关表 |

进入 `psql` 后可先执行：

```sql
\dt
```

## 5. 常用 SQL 查询

### 5.1 查用户

```sql
SELECT id, email, role, username
FROM users
ORDER BY id DESC
LIMIT 20;
```

### 5.2 查需求

```sql
SELECT id, need_id, title, status
FROM tech_needs
ORDER BY id DESC
LIMIT 20;
```

### 5.3 查方案

```sql
SELECT id, title, status, submitted_by_id
FROM proposals
ORDER BY id DESC
LIMIT 20;
```

### 5.4 查方案附件

```sql
SELECT
  p.id AS proposal_id,
  p.title,
  m.id AS media_id,
  m.filename,
  m.mime_type
FROM proposals p
LEFT JOIN proposals_rels pr
  ON pr.parent_id = p.id
 AND pr.path = 'attachments'
LEFT JOIN media m
  ON m.id = pr.media_id
ORDER BY p.id DESC, m.id DESC;
```

### 5.5 查单个附件归属

```sql
SELECT id, filename, purpose, proposal_id, uploaded_by_id
FROM media
ORDER BY id DESC
LIMIT 20;
```

## 6. 为什么有些字段看起来像“乱码”

不是乱码，而是 Payload 富文本 JSON：

- `proposals.description`
- `proposals.review_notes`
- `tech_needs.description`
- `case_studies.content`

这些字段在 PostgreSQL 中以 `jsonb` 保存。若只是想看业务内容，优先用：

1. `/admin`
2. REST / GraphQL
3. 代码里的 Payload Local API

## 7. 代码里如何查看后端数据

当前项目代码主要通过 `src/lib/payload.ts` 里的 `getPayloadClient()` 读取数据，例如：

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

- `overrideAccess: true` 只能用于受信任的服务端代码、脚本或运维场景
- 不要把用户输入直接拼到带 `overrideAccess: true` 的查询里

## 8. 直接查库时必须知道的风险

1. 直接 SQL 不会走 Payload 的访问控制
2. 直接 SQL 不会触发 Hook、邮件通知、附件权限逻辑
3. 直接改表容易破坏富文本 JSON、关系表和文件关联

因此：

- **看数据**：可以直接查库
- **改数据**：优先 `/admin`，其次 Payload REST / GraphQL，再考虑 SQL

## 9. 你现在最常用的几条命令

```bash
cd /home/deploy/apps/open-innovation-platform

# 进入 PostgreSQL
docker compose exec -T postgres psql -U payload -d innovation_platform

# 查看所有表
docker compose exec -T postgres psql -U payload -d innovation_platform -c '\dt'

# 看用户
docker compose exec -T postgres psql -U payload -d innovation_platform \
  -c "SELECT id, email, role, username FROM users ORDER BY id DESC LIMIT 20;"

# 看方案
docker compose exec -T postgres psql -U payload -d innovation_platform \
  -c "SELECT id, title, status, submitted_by_id FROM proposals ORDER BY id DESC LIMIT 20;"
```
