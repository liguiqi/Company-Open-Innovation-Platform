# Human 容器化部署方案说明

更新日期：`2026-04-20`

## 1. 文档定位

本文档面向 `Human` 手动运维人员，描述“将开放创新平台部署为容器化形态”的推荐方案。

需要先说明边界：

- 当前正式环境的真实生产形态仍然是 `systemd + nginx + .next/standalone`
- 本文档不是对当前现网的复述，而是对“下一台服务器如何以容器化方式部署”的详细操作方案
- 本文档仍要求使用项目专属 sudo 账号 `deploy`，不建议继续用个人账号直接托管生产服务

## 2. 当前仓库已有的容器资产

当前仓库已经存在两类容器化基础资产：

- 根目录 `Dockerfile`：用于构建 Next.js / Payload 应用镜像
- 根目录 `docker-compose.yml`：当前只包含 `postgres` 和 `redis` 两个服务，适合开发和本机依赖启动

因此，面向人工生产部署时，推荐在新服务器上额外准备一份不入库的 `docker-compose.prod.yml`，专门负责：

- `app` 应用容器
- `postgres` 数据库容器
- `redis` 缓存容器

而 `nginx` 继续运行在宿主机上，负责：

- `80/443` 端口监听
- SSL 证书托管
- 域名转发到 `127.0.0.1:3005`

这是当前项目最稳妥、最贴近现网治理方式的容器化方案。

## 3. 推荐容器化拓扑

推荐链路：

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

- 证书继续由宿主机 `nginx` 管理，和公司现有域名 / SSL 管理方式一致
- 应用、数据库、Redis 统一容器化，迁移和备份边界更清晰
- `media/` 仍然走宿主机目录挂载，避免容器重建后附件丢失
- 出问题时可以分别看 `docker compose logs` 和宿主机 `nginx` 日志，排查路径更清楚

## 4. 专属账号要求

### 4.1 推荐账号

统一使用：`deploy`

### 4.2 创建方式

先使用已有 sudo 账号执行：

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

如果需要复制引导账号的公钥：

```bash
sudo cp /home/<bootstrap-user>/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
sudo chown deploy:deploy /home/deploy/.ssh/authorized_keys
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

人工运维模式下，建议保留“有密码的 sudo”，不建议直接开放 `NOPASSWD: ALL`。

## 5. 国内网络与代理准备

容器化部署对网络更敏感，因为会额外经过：

- `git clone` / `git fetch`
- `docker pull`
- 镜像内 `pnpm install`
- 可能的 `apt update`

如果新服务器位于国内网络环境，建议至少处理以下两项。

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

### 5.2 Docker 镜像与代理

如果公司已提供代理，可配置 Docker daemon 代理：

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

如果没有代理，但有镜像加速地址，可写入：

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

如果镜像构建阶段访问 npm 较慢，还建议为 `deploy` 设置：

```bash
sudo -iu deploy
npm config set registry https://registry.npmmirror.com
pnpm config set registry https://registry.npmmirror.com
```

## 6. 宿主机基础安装

使用引导 sudo 账号执行：

```bash
sudo apt update
sudo apt install -y   git   curl   wget   ca-certificates   gnupg   nginx   docker.io   docker-compose-plugin
```

启动并设置开机自启：

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

- 项目目录：`/home/deploy/apps/open-innovation-platform`
- 媒体目录：`/home/deploy/apps/open-innovation-platform/media`
- 证书目录：`/home/deploy/apps/open-innovation-platform/example.com_nginx`
- 生产 compose 文件：`/home/deploy/apps/open-innovation-platform/docker-compose.prod.yml`

首次准备：

```bash
sudo -iu deploy
mkdir -p /home/deploy/apps
cd /home/deploy/apps
git clone git@github.com:your-org/open-innovation-platform.git
cd open-innovation-platform
git fetch --all --tags
git checkout v1.0.0
mkdir -p media
```

## 8. 环境变量准备

```bash
cd /home/deploy/apps/open-innovation-platform
cp .env.example .env.local
vi .env.local
```

至少检查：

- `NEXT_PUBLIC_SERVER_URL=https://innovation.example.com`
- `PAYLOAD_SECRET=...`
- `DATABASE_URI=postgresql://payload:<POSTGRES_PASSWORD>@postgres:5432/innovation_platform`
- `DATABASE_URL=postgresql://payload:<POSTGRES_PASSWORD>@postgres:5432/innovation_platform`
- `REDIS_URL=redis://default:<REDIS_PASSWORD>@redis:6379`
- `SMTP_*`
- `ALIYUN_SMS_ACCESS_KEY_ID=...`
- `ALIYUN_SMS_ACCESS_KEY_SECRET=...`
- `ALIYUN_SMS_SIGN=平台验证码`
- `ALIYUN_SMS_TEMPLATE=100001`
- `ALIYUN_SMS_SCHEME_NAME=平台验证码`
- `POSTGRES_PASSWORD=...`
- `REDIS_PASSWORD=...`

说明：

- `postgres` 和 `redis` 作为 compose 内服务名，容器内应用可以直接通过服务名访问
- 当前项目的关键运行配置仍然建议统一维护在 `.env.local`
- 即便容器运行时会注入环境变量，只要改了关键配置，仍建议重新构建应用镜像

## 9. 推荐的 `docker-compose.prod.yml`

建议在服务器项目根目录新建，不要把生产密码写入仓库：

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    image: open-innovation-platform:v1.0.0
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

- `app` 容器暴露 `3000`，并映射到宿主机 `127.0.0.1:3005`
- `nginx` 只需要反代 `127.0.0.1:3005`
- `media/` 通过 bind mount 挂到容器内 `/app/media`
- 当前示例没有把 `postgres` / `redis` 暴露到宿主机，默认更安全
- 如果需要从宿主机直连数据库排查，可临时加端口映射，但正式环境不建议长期暴露

## 10. 首次构建与启动

### 10.1 拉起生产容器

在项目根目录执行：

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

### 10.3 应用连通性检查

```bash
curl -I http://127.0.0.1:3005
```

如果这里还不通，不要急着看域名，先确认 `app` 容器已经真正跑起来。

## 11. Host Nginx 配置

容器化方案下，仍然推荐在宿主机上托管 `nginx` 和证书。

证书目录建议沿用项目根目录：

```bash
mkdir -p /home/deploy/apps/open-innovation-platform/example.com_nginx
```

把以下文件放进去：

- `example.com_bundle.pem`
- `example.com.key`

然后写入：

```bash
sudo tee /etc/nginx/sites-available/innovation.example.com.conf >/dev/null <<'EOF'
server {
    listen 80;
    server_name innovation.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name innovation.example.com;

    ssl_certificate     /home/deploy/apps/open-innovation-platform/example.com_nginx/example.com_bundle.pem;
    ssl_certificate_key /home/deploy/apps/open-innovation-platform/example.com_nginx/example.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 25M;

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
EOF

sudo ln -sf /etc/nginx/sites-available/innovation.example.com.conf /etc/nginx/sites-enabled/innovation.example.com.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 12. 发布与升级方式

### 12.1 首次部署

```bash
sudo -iu deploy
cd /home/deploy/apps/open-innovation-platform
git fetch --all --tags
git checkout v1.0.0
docker compose --env-file .env.local -f docker-compose.prod.yml up -d --build
```

### 12.2 后续升级到新 tag

```bash
sudo -iu deploy
cd /home/deploy/apps/open-innovation-platform
git fetch --all --tags
git checkout <new-tag>
docker compose --env-file .env.local -f docker-compose.prod.yml up -d --build app
```

如果本次升级同时改动了数据库容器版本、Redis 参数或 compose 结构，就执行整套：

```bash
docker compose --env-file .env.local -f docker-compose.prod.yml up -d --build
```

### 12.3 环境变量更新

如果修改了 `.env.local` 中的关键值，例如：

- `NEXT_PUBLIC_SERVER_URL`
- `PAYLOAD_SECRET`
- `SMTP_*`
- `ALIYUN_SMS_*`
- 数据库 / Redis 连接串

建议执行：

```bash
vi .env.local
docker compose --env-file .env.local -f docker-compose.prod.yml up -d --build app
```

原因：当前项目仍然使用 Next.js standalone 产物，镜像构建阶段会固化一部分构建期环境和静态产物。保守做法是统一重建 `app` 镜像，不要只重启容器。

## 13. 备份与持久化

容器化部署必须关注三类持久化对象：

- PostgreSQL volume：`pgdata`
- Redis volume：`redisdata`
- 附件目录：宿主机 `media/`

注意：

- 删除容器本身不会自动删除 volume，但执行 `docker compose down -v` 会删掉卷
- `media/` 不是 docker volume，而是宿主机 bind mount，迁移时必须单独拷贝
- 生产环境不要随意执行 `docker system prune -a`

## 14. 最小验收步骤

命令级检查：

```bash
docker compose --env-file .env.local -f docker-compose.prod.yml ps
curl -I http://127.0.0.1:3005
curl -k -I https://innovation.example.com
```

页面级检查：

1. 打开首页 `/`
2. 打开 `/login`
3. 打开 `/register`
4. 打开 `/dashboard`
5. 打开 `/admin`
6. 测试短信发送 `/api/sms/send`
7. 测试邮箱验证码链路
8. 测试附件上传与下载
9. 测试 `/dashboard/settings` 个人信息保存

## 15. 常见故障排查

### 15.1 `docker pull` 或镜像构建极慢

优先排查：

- Docker mirror 是否已配置
- Docker daemon 代理是否生效
- `ssh.github.com:443` 是否可达
- npm registry 是否需要换成 `npmmirror`

### 15.2 容器启动后页面 502

优先排查：

```bash
docker compose --env-file .env.local -f docker-compose.prod.yml ps
docker compose --env-file .env.local -f docker-compose.prod.yml logs app --tail 200
curl -I http://127.0.0.1:3005
sudo nginx -t
```

### 15.3 短信签名或模板异常

优先排查：

- `.env.local` 中 `ALIYUN_SMS_SIGN` 是否仍为 `平台验证码`
- 是否重新执行了 `docker compose ... up -d --build app`
- 是否误把新签名写成阿里云未审核通过的值

### 15.4 附件丢失

优先排查：

- `media/` 是否正确挂载到 `/app/media`
- 迁移时是否遗漏宿主机 `media/` 目录
- 是否误执行了清理目录或错误覆盖挂载点

## 16. 与当前 standalone 现网方案的关系

两者关系如下：

- 当前正式现网：`systemd + standalone + host nginx`
- 本文方案：`docker compose(app/postgres/redis) + host nginx`

如果后续你决定把另一台服务器作为新正式环境，建议优先采用本文这套容器化方案；而当前主文档 [deployment.md](/home/deploy/apps/open-innovation-platform/docs/deployment/deployment.md) 继续作为非容器化部署基线。
