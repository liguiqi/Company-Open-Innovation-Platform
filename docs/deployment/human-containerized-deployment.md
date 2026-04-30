# Human 容器化部署方案说明

更新日期：`2026-04-30`

## 1. 文档定位

本文档面向人工运维人员，描述“将开放创新平台部署为容器化形态”的推荐方案。

边界说明：

1. 当前项目的主运行事实仍然是 `nginx + systemd + .next/standalone`。
2. 本文档描述的是“下一台服务器如何以容器化方式落地”的可执行方案。
3. 容器化方案推荐仍然保留宿主机 `nginx`，只把 `app`、`postgres`、`redis` 放进容器。

## 2. 当前仓库已有容器资产

当前仓库已经包含：

1. 根目录 `Dockerfile`
   用于构建 Next.js / Payload 一体化应用镜像。
2. 根目录 `docker-compose.yml`
   当前只包含 `postgres` 和 `redis`，适合本机开发或半容器化依赖启动。

因此，面向正式人工部署时，推荐在目标服务器上额外准备一份不入库的 `docker-compose.prod.yml`，专门负责：

1. `app`
2. `postgres`
3. `redis`

## 3. 推荐容器化拓扑

```text
Browser
  -> Host nginx :443
  -> 127.0.0.1:3005
  -> app container :3000
  -> postgres container :5432
  -> redis container :6379
  -> host bind mount media/
```

推荐原因：

1. SSL 证书继续由宿主机 `nginx` 管理，符合当前公司域名治理方式。
2. 应用、数据库与 Redis 可整体迁移，界面清晰。
3. `media/` 保持宿主机目录挂载，容器重建后附件不丢失。
4. 出问题时宿主机 `nginx` 与容器日志边界清楚。

## 4. 部署账号要求

### 4.1 推荐账号

统一使用：`deploy`

### 4.2 创建方式

使用已有 sudo 账号执行：

```bash
sudo adduser deploy
sudo usermod -aG sudo deploy
sudo usermod -aG docker deploy
sudo mkdir -p /home/deploy/.ssh
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo passwd deploy
id deploy
sudo -l -U deploy
```

如需复制引导账号公钥：

```bash
sudo cp /home/<bootstrap-user>/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
sudo chown deploy:deploy /home/deploy/.ssh/authorized_keys
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

## 5. 国内网络与代理准备

### 5.1 GitHub SSH 走 443

```bash
sudo -iu deploy
mkdir -p ~/.ssh
chmod 700 ~/.ssh
cat > ~/.ssh/config <<'EOF'
Host github.com
  HostName ssh.github.com
  Port 443
  User git
  ServerAliveInterval 60
  ServerAliveCountMax 3
EOF
chmod 600 ~/.ssh/config
ssh -T git@github.com
```

### 5.2 Docker 代理或镜像加速

如果公司已提供代理：

```bash
sudo mkdir -p /etc/systemd/system/docker.service.d
sudo tee /etc/systemd/system/docker.service.d/http-proxy.conf >/dev/null <<'EOF'
[Service]
Environment="HTTP_PROXY=http://<proxy-host>:<proxy-port>"
Environment="HTTPS_PROXY=http://<proxy-host>:<proxy-port>"
Environment="NO_PROXY=localhost,127.0.0.1,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16"
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```

如果使用镜像加速：

```bash
sudo tee /etc/docker/daemon.json >/dev/null <<'EOF'
{
  "registry-mirrors": [
    "https://<your-company-or-cloud-mirror>"
  ]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```

### 5.3 npm / pnpm 镜像

```bash
sudo -iu deploy
npm config set registry https://registry.npmmirror.com
pnpm config set registry https://registry.npmmirror.com
```

## 6. 宿主机基础安装

```bash
sudo apt update
sudo apt install -y \
  git \
  curl \
  wget \
  ca-certificates \
  gnupg \
  nginx \
  docker.io \
  docker-compose-plugin
```

启动基础服务：

```bash
sudo systemctl enable --now docker
sudo systemctl enable --now nginx
```

确认版本：

```bash
docker -v
docker compose version
nginx -v
```

## 7. 目录约定

推荐统一使用：

1. 项目目录：`/home/deploy/apps/open-innovation-platform`
2. 媒体目录：`/home/deploy/apps/open-innovation-platform/media`
3. 证书目录：`/home/deploy/apps/open-innovation-platform/example.com_nginx`
4. 生产 compose 文件：`/home/deploy/apps/open-innovation-platform/docker-compose.prod.yml`

首次准备：

```bash
sudo -iu deploy
mkdir -p /home/deploy/apps
cd /home/deploy/apps
git clone git@github.com:your-org/open-innovation-platform.git
cd open-innovation-platform
git fetch --all --tags
git checkout main
mkdir -p media
```

若本次按正式版本部署，请将 `main` 替换为被授权的 tag 或 commit。

## 8. 环境变量准备

```bash
cd /home/deploy/apps/open-innovation-platform
cp .env.example .env.local
vi .env.local
```

至少检查以下变量：

1. `NEXT_PUBLIC_SERVER_URL`
2. `PAYLOAD_ALLOWED_ORIGINS`
3. `PAYLOAD_SECRET`
4. `DATABASE_URI` / `DATABASE_URL`
5. `REDIS_URL`
6. `SMTP_HOST`、`SMTP_PORT`、`SMTP_USER`、`SMTP_PASS`
7. `ALIYUN_SMS_SIGN=平台验证码`
8. `ALIYUN_SMS_TEMPLATE=100001`
9. `ALIYUN_SMS_SCHEME_NAME=平台验证码`
10. `POSTGRES_PASSWORD`
11. `REDIS_PASSWORD`

推荐示例：

```env
NEXT_PUBLIC_SERVER_URL=https://openinnovation.example.com
PAYLOAD_ALLOWED_ORIGINS=https://openinnovation.example.com,https://innovation.example.com
DATABASE_URI=postgresql://payload:${POSTGRES_PASSWORD}@postgres:5432/innovation_platform
REDIS_URL=redis://default:${REDIS_PASSWORD}@redis:6379
```

## 9. 推荐的 `docker-compose.prod.yml`

建议在服务器项目根目录新建：

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    image: open-innovation-platform:2.0.0
    container_name: het-innovation-app
    restart: unless-stopped
    env_file:
      - .env.local
    environment:
      NODE_ENV: production
      HOSTNAME: 0.0.0.0
      PORT: 3000
    depends_on:
      - postgres
      - redis
    ports:
      - '127.0.0.1:3005:3000'
    volumes:
      - ./media:/app/media

  postgres:
    image: postgres:16-alpine
    container_name: het-innovation-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: innovation_platform
      POSTGRES_USER: payload
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: het-innovation-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

关键说明：

1. `app` 容器对外只映射到宿主机 `127.0.0.1:3005`。
2. `nginx` 只需要代理 `127.0.0.1:3005`。
3. `media/` 通过 bind mount 挂到容器内 `/app/media`。
4. 当前示例没有把 `postgres` 与 `redis` 暴露到宿主机，默认更安全。

## 10. 首次构建与启动

### 10.1 拉起生产容器

```bash
cd /home/deploy/apps/open-innovation-platform
docker compose --env-file .env.local -f docker-compose.prod.yml up -d --build
```

### 10.2 检查容器状态

```bash
docker compose --env-file .env.local -f docker-compose.prod.yml ps
docker compose --env-file .env.local -f docker-compose.prod.yml logs app --tail 200
docker compose --env-file .env.local -f docker-compose.prod.yml logs postgres --tail 100
docker compose --env-file .env.local -f docker-compose.prod.yml logs redis --tail 100
```

### 10.3 媒体目录与数据整理

如为迁移旧数据，建议在宿主机源码目录补执行一次媒体归档，再重建应用镜像：

```bash
cd /home/deploy/apps/open-innovation-platform
pnpm media:organize
docker compose --env-file .env.local -f docker-compose.prod.yml up -d --build app
```

说明：

1. 当前生产镜像主要用于运行 standalone 产物，不建议把一次性整理脚本作为常规容器内操作。
2. 对于已经正确写入 `module`、`assetCategory`、`storageKey` 的新媒体记录，不需要频繁执行。

## 11. 宿主机 Nginx 配置

容器化方案下，仍推荐在宿主机托管 `nginx` 与证书。

把证书放入：

```bash
mkdir -p /home/deploy/apps/open-innovation-platform/example.com_nginx
```

然后写入站点配置：

```nginx
server {
    listen 80;
    server_name openinnovation.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name openinnovation.example.com;

    ssl_certificate     /home/deploy/apps/open-innovation-platform/example.com_nginx/example.com_bundle.pem;
    ssl_certificate_key /home/deploy/apps/open-innovation-platform/example.com_nginx/example.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 120M;

    location / {
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /_next/static {
        proxy_pass http://127.0.0.1:3005/_next/static;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

启用并校验：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 12. 发布与升级方式

### 12.1 首次部署

```bash
sudo -iu deploy
cd /home/deploy/apps/open-innovation-platform
git fetch --all --tags
git checkout main
docker compose --env-file .env.local -f docker-compose.prod.yml up -d --build
```

### 12.2 升级到新版本

```bash
sudo -iu deploy
cd /home/deploy/apps/open-innovation-platform
git fetch --all --tags
git checkout <release-tag-or-commit>
docker compose --env-file .env.local -f docker-compose.prod.yml up -d --build app
```

若数据库或 Redis 配置也有变更，则执行整套：

```bash
docker compose --env-file .env.local -f docker-compose.prod.yml up -d --build
```

### 12.3 环境变量变化

如果改动了以下配置，建议重建 `app` 镜像：

1. `NEXT_PUBLIC_SERVER_URL`
2. `PAYLOAD_ALLOWED_ORIGINS`
3. `PAYLOAD_SECRET`
4. `SMTP_*`
5. `ALIYUN_SMS_*`
6. 数据库或 Redis 连接串

执行：

```bash
vi .env.local
docker compose --env-file .env.local -f docker-compose.prod.yml up -d --build app
```

## 13. 备份与持久化

必须重点保护三类对象：

1. PostgreSQL volume：`pgdata`
2. Redis volume：`redisdata`
3. 附件目录：宿主机 `media/`

注意：

1. `docker compose down -v` 会删除卷。
2. `media/` 不是 volume，而是宿主机 bind mount，迁移时必须单独拷贝。
3. 正式环境不要随意执行 `docker system prune -a`。

## 14. 最小验收步骤

命令级检查：

```bash
docker compose --env-file .env.local -f docker-compose.prod.yml ps
curl -I http://127.0.0.1:3005
curl -k -I https://openinnovation.example.com
```

页面级检查：

1. 打开首页 `/`
2. 打开 `/login`
3. 打开 `/register`
4. 打开 `/dashboard`
5. 打开 `/admin`
6. 测试邮箱验证码与短信验证码
7. 测试附件上传与下载
8. 测试 `/dashboard/settings` 资料保存

## 15. 常见故障排查

### 15.1 `docker pull` 或镜像构建极慢

优先排查：

1. Docker 镜像加速是否生效。
2. Docker daemon 代理是否生效。
3. `ssh.github.com:443` 是否可达。
4. npm registry 是否切到了可用镜像。

### 15.2 容器启动后页面 502

优先排查：

```bash
docker compose --env-file .env.local -f docker-compose.prod.yml ps
docker compose --env-file .env.local -f docker-compose.prod.yml logs app --tail 200
curl -I http://127.0.0.1:3005
sudo nginx -t
```

### 15.3 Admin 无法保存或无法登出

优先排查：

1. `NEXT_PUBLIC_SERVER_URL` 是否与当前访问域名一致。
2. `PAYLOAD_ALLOWED_ORIGINS` 是否包含当前域名。
3. 更新环境变量后是否重建过 `app` 镜像。

### 15.4 短信签名或模板异常

优先排查：

1. `ALIYUN_SMS_SIGN` 是否仍为 `平台验证码`。
2. `ALIYUN_SMS_TEMPLATE` 是否为 `100001`。
3. 是否误改为未审核的新签名。

### 15.5 附件丢失

优先排查：

1. `media/` 是否正确挂载到 `/app/media`。
2. 迁移时是否遗漏宿主机 `media/`。
3. 是否需要补执行 `pnpm media:organize`。

## 16. 与当前 standalone 现网方案的关系

两者关系如下：

1. 当前主运行事实：`systemd + standalone + host nginx`
2. 本文方案：`docker compose(app/postgres/redis) + host nginx`

如果后续新服务器采用容器化落地，可优先按照本文执行；当前非容器化基线仍以 [deployment.md](/home/deploy/apps/open-innovation-platform/docs/deployment/deployment.md) 为准。
