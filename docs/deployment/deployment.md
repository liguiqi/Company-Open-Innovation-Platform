# 部署说明（AI Agent / Human 双版本）

更新日期：`2026-04-30`

## 1. 文档用途

本文档同时覆盖两类部署场景：

1. `AI Agent 自动化落地版`
   适合服务器基础环境已经准备好，由 AI Agent 按明确授权执行代码同步、构建、重启和验活。
2. `Human 手动运维版`
   适合人工从零准备新服务器、创建专属账号、处理代理、安装依赖并完成正式部署。

本文档默认描述的是当前仓库主线的真实落地方式，而不是理想化架构。

## 2. 当前仓库部署事实

| 项目             | 当前事实                                                                   |
| ---------------- | -------------------------------------------------------------------------- |
| 仓库版本         | `package.json -> 2.0.0`                                                    |
| 主框架           | `Next.js 16.2.3 + Payload CMS 3.82.1 + React 19.2.4 + Tailwind CSS 4.1.14` |
| 运行模式         | `pnpm build` 产出 `.next/standalone`，再由 `pnpm start` 拉起               |
| 正式运行端口     | `127.0.0.1:3005`                                                           |
| 本机开发域名     | `https://innovation.example.com`                                   |
| 生产调试域名     | `https://openinnovation.example.com`                               |
| 反向代理         | `nginx`                                                                    |
| 进程守护         | `systemd`                                                                  |
| 数据存储         | `PostgreSQL + Redis + media/`                                              |
| 单文件业务上限   | `100MB`                                                                    |
| Next 请求体上限  | `120mb`                                                                    |
| Nginx 请求体上限 | `120M`                                                                     |

关键事实：

1. 公开站、注册登录、工作台和 Payload Admin 运行在同一 Node 进程内。
2. 当前没有单独的 Java 或 Python 后端服务。
3. 只要环境变量发生变化，就必须重新执行 `pnpm build`，因为 standalone 运行目录会复制 `.env` 与 `.env.local`。

## 3. 环境矩阵

| 环境         | 访问域名                                     | 说明                        |
| ------------ | -------------------------------------------- | --------------------------- |
| 本机开发环境 | `https://innovation.example.com`     | 日常开发、联调、验收主环境  |
| 生产调试环境 | `https://openinnovation.example.com` | `10.0.0.1` 上的部署实例 |

共通约束：

1. `nginx -> 127.0.0.1:3005 -> innovation-platform.service`
2. `Payload CORS / CSRF` 允许来源必须覆盖对应实际域名
3. `media/`、数据库和 Redis 必须一起迁移或一起恢复

## 4. 部署账号标准

### 4.1 推荐专属账号

新服务器统一推荐使用：`deploy`

原因：

1. 服务与个人开发账号边界清晰。
2. systemd、SSH、日志和证书目录易于交接。
3. 便于后续区分 AI Agent 和人工运维动作。

### 4.2 Human 手动运维场景

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

如需复制现有管理机 SSH 公钥：

```bash
sudo cp /home/<bootstrap-user>/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
sudo chown deploy:deploy /home/deploy/.ssh/authorized_keys
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

正式生产建议保留“有密码的 sudo”，不要默认开放 `NOPASSWD: ALL`。

### 4.3 AI Agent 自动化场景

AI Agent 仍使用 `deploy`，但建议搭配 SSH Key 和受控 sudo。

若服务器是项目独占环境，可按需开放：

```bash
echo 'deploy ALL=(ALL) NOPASSWD: ALL' | sudo tee /etc/sudoers.d/90-deploy
sudo chmod 440 /etc/sudoers.d/90-deploy
sudo visudo -cf /etc/sudoers.d/90-deploy
```

若服务器为共享主机，则应只开放白名单命令，不要开放全量无密码 sudo。

## 5. 通用前置检查

无论采用哪种部署方式，先确认以下事项：

1. 目标域名已正确解析到目标服务器。
2. `443` 端口已经可达。
3. `127.0.0.1:3005` 未被其他服务占用。
4. PostgreSQL 和 Redis 的部署方式已确定。
5. `.env.local` 已准备好 `DATABASE_*`、`REDIS_URL`、`PAYLOAD_SECRET`、`SMTP_*`、`ALIYUN_SMS_*`。
6. 证书文件已准备：
   - `example.com_nginx/example.com_bundle.pem`
   - `example.com_nginx/example.com.key`
7. 目标机可访问 GitHub、npm registry 与 Docker registry，或已准备可用代理/镜像。

## 6. 中国国内网络与代理准备

### 6.1 临时代理环境变量

```bash
export http_proxy=http://<proxy-host>:<proxy-port>
export https_proxy=http://<proxy-host>:<proxy-port>
export all_proxy=socks5://<proxy-host>:<proxy-port>
export no_proxy=127.0.0.1,localhost,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16
```

验证：

```bash
curl -I https://github.com
curl -I https://registry.npmjs.org
```

### 6.2 GitHub SSH 走 443

为部署账号写入：

```sshconfig
Host github.com
  HostName ssh.github.com
  Port 443
  User git
  ServerAliveInterval 60
  ServerAliveCountMax 3
```

验证：

```bash
ssh -T git@github.com
```

### 6.3 Ubuntu APT 镜像

常用国内镜像：

1. `https://mirrors.aliyun.com/ubuntu/`
2. `https://mirrors.tuna.tsinghua.edu.cn/ubuntu/`

### 6.4 Node / pnpm 镜像

```bash
npm config set registry https://registry.npmmirror.com
pnpm config set registry https://registry.npmmirror.com
export NVM_NODEJS_ORG_MIRROR=https://npmmirror.com/mirrors/node
```

## 7. 域名与允许来源配置

当前代码中以下变量与域名强相关：

1. `NEXT_PUBLIC_SERVER_URL`
2. `PAYLOAD_ALLOWED_ORIGINS`

建议配置示例：

```env
NEXT_PUBLIC_SERVER_URL=https://openinnovation.example.com
PAYLOAD_ALLOWED_ORIGINS=https://openinnovation.example.com,https://innovation.example.com
```

说明：

1. 若目标机实际使用 `innovation.example.com`，就把 `NEXT_PUBLIC_SERVER_URL` 改成该值。
2. 若遗漏实际访问域名，常见后果是 Payload Admin 登录后无法保存、无法登出或出现 CSRF / origin 错误。

## 8. AI Agent 自动化落地版

本版本假设以下底座已由人工准备完成：

1. `deploy` 账号已创建并具备所需 sudo 权限。
2. `git`、`node`、`pnpm`、`nginx`、`docker` 已安装。
3. SSL 证书已落位。
4. 域名已经指向目标服务器。

### 8.1 登录并准备目录

```bash
sudo -iu deploy
mkdir -p /home/deploy/apps
cd /home/deploy/apps
```

### 8.2 拉取代码

首次部署：

```bash
git clone git@github.com:your-org/open-innovation-platform.git
cd open-innovation-platform
git fetch --all --tags
git checkout main
```

若按明确发布点部署，请替换为：

```bash
git checkout <release-tag-or-commit>
```

后续升级：

```bash
cd /home/deploy/apps/open-innovation-platform
git fetch --all --tags
git checkout main
git pull --ff-only origin main
```

### 8.3 准备环境变量

```bash
cp .env.example .env.local
vi .env.local
```

至少检查：

1. `NEXT_PUBLIC_SERVER_URL`
2. `PAYLOAD_ALLOWED_ORIGINS`
3. `PAYLOAD_SECRET`
4. `DATABASE_URI` 或 `DATABASE_URL`
5. `REDIS_URL`
6. `SMTP_HOST`、`SMTP_PORT`、`SMTP_USER`、`SMTP_PASS`
7. `ALIYUN_SMS_SIGN=平台验证码`
8. `ALIYUN_SMS_TEMPLATE=100001`
9. `ALIYUN_SMS_SCHEME_NAME=平台验证码`

### 8.4 安装依赖与生成辅助文件

```bash
pnpm install --frozen-lockfile
pnpm generate:types
pnpm generate:importmap
```

### 8.5 启动数据库与 Redis

若继续使用仓库内 compose：

```bash
docker compose up -d postgres redis
docker compose ps
```

### 8.6 构建与整理媒体

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm media:organize
```

说明：

1. `pnpm media:organize` 用于回填已有媒体记录的目录、模块和分类信息，迁移后建议执行一次。
2. 若只是常规日更、媒体库已稳定，也可以只在需要时手动执行。

### 8.7 systemd 服务文件

推荐直接基于仓库模板 `deploy/systemd/innovation-platform.service` 调整。

关键项必须改成目标机真实值：

1. `User`
2. `WorkingDirectory`
3. `HOME`
4. `PATH`
5. `ExecStart`

参考写法：

```ini
[Unit]
Description=Open Innovation Platform
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/home/deploy/apps/open-innovation-platform
Environment=HOME=/home/deploy
Environment=PORT=3005
Environment=PATH=/home/deploy/.nvm/versions/node/v24.15.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
ExecStart=/home/deploy/.nvm/versions/node/v24.15.0/bin/node /home/deploy/.nvm/versions/node/v24.15.0/lib/node_modules/corepack/dist/pnpm.js start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

加载并启动：

```bash
sudo cp deploy/systemd/innovation-platform.service /etc/systemd/system/innovation-platform.service
sudo vi /etc/systemd/system/innovation-platform.service
sudo systemctl daemon-reload
sudo systemctl enable innovation-platform.service
sudo systemctl restart innovation-platform.service
sudo systemctl status innovation-platform.service --no-pager
```

### 8.8 nginx 配置

推荐基于仓库模板 `deploy/nginx/innovation.example.com.conf` 调整：

必须替换：

1. `server_name`
2. `ssl_certificate`
3. `ssl_certificate_key`
4. `proxy_pass` 保持 `127.0.0.1:3005`
5. `client_max_body_size 120M`

若目标环境使用 `openinnovation.example.com`，可参考：

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

启用：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 8.9 自动化 smoke test

```bash
curl -k -I https://openinnovation.example.com
curl -I http://127.0.0.1:3005
systemctl is-active innovation-platform.service
docker compose ps
```

建议再人工打开：

1. `/`
2. `/login`
3. `/register`
4. `/dashboard`
5. `/admin`

## 9. Human 手动运维版

本版本用于从零接管新机器，步骤更细。

### 9.1 系统基础包安装

```bash
sudo apt update
sudo apt install -y \
  git \
  curl \
  wget \
  unzip \
  build-essential \
  ca-certificates \
  gnupg \
  lsb-release \
  nginx \
  docker.io \
  docker-compose-plugin
```

启动基础服务：

```bash
sudo systemctl enable --now docker
sudo systemctl enable --now nginx
```

### 9.2 安装 Node.js 与 pnpm

推荐：

1. `Node.js 22 LTS` 或 `Node.js 24 LTS`
2. `pnpm 10`

如使用 NodeSource：

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pnpm@10
node -v
pnpm -v
```

若使用 `nvm`，请确认最终 `systemd` 能拿到完整 `node` 与 `pnpm` 绝对路径。

### 9.3 拉取代码

```bash
sudo -iu deploy
mkdir -p /home/deploy/apps
cd /home/deploy/apps
git clone git@github.com:your-org/open-innovation-platform.git
cd open-innovation-platform
git fetch --all --tags
git checkout main
```

若本次是正式发版，请把 `main` 替换成获准部署的 tag 或 commit。

### 9.4 准备环境变量

```bash
cp .env.example .env.local
vi .env.local
```

重点检查：

1. `NEXT_PUBLIC_SERVER_URL`
2. `PAYLOAD_ALLOWED_ORIGINS`
3. `DATABASE_URI` / `DATABASE_URL`
4. `REDIS_URL`
5. `PAYLOAD_SECRET`
6. `SMTP_*`
7. `ALIYUN_SMS_*`
8. `DEFAULT_*` 初始化账号变量

### 9.5 启动 PostgreSQL 与 Redis

```bash
docker compose up -d postgres redis
docker compose ps
```

默认端口映射：

1. PostgreSQL：宿主机 `5433`
2. Redis：宿主机 `6380`

### 9.6 安装依赖并构建

```bash
pnpm install --frozen-lockfile
pnpm generate:types
pnpm generate:importmap
pnpm lint
pnpm typecheck
pnpm build
pnpm media:organize
```

如需初始化数据：

```bash
pnpm seed
```

### 9.7 配置 systemd 与 nginx

1. 复制并修改 `deploy/systemd/innovation-platform.service`
2. 复制并修改 `deploy/nginx/innovation.example.com.conf`
3. 根据目标域名替换 `server_name` 与证书路径
4. 执行：

```bash
sudo systemctl daemon-reload
sudo systemctl enable innovation-platform.service
sudo systemctl restart innovation-platform.service
sudo nginx -t
sudo systemctl reload nginx
```

### 9.8 首次验收

命令级：

```bash
curl -I http://127.0.0.1:3005
curl -k -I https://openinnovation.example.com
systemctl is-active innovation-platform.service
docker compose ps
```

页面级：

1. 打开首页 `/`
2. 打开 `/login`
3. 打开 `/register`
4. 打开 `/dashboard`
5. 打开 `/admin`
6. 测试邮箱验证码、短信验证码、附件上传与下载

## 10. 何时必须重新构建

以下变更必须重新执行 `pnpm build`：

1. `.env.local` 发生变化。
2. 域名、允许来源、短信、邮件、数据库或 Redis 配置变化。
3. Next 页面、Payload 集合、API 或公共静态资源变化。

以下动作通常只需重启服务：

1. systemd 环境变量和路径未变化，仅进程短暂异常。
2. Nginx 配置无变化，仅 Node 进程需要拉起。

## 11. 常见故障排查

### 11.1 Admin 无法保存或无法登出

优先排查：

1. `NEXT_PUBLIC_SERVER_URL` 是否与实际域名一致。
2. `PAYLOAD_ALLOWED_ORIGINS` 是否覆盖当前访问域名。
3. 改完环境变量后是否重新执行过 `pnpm build`。

### 11.2 短信发送失败

优先排查：

1. `ALIYUN_SMS_SIGN` 是否仍为 `平台验证码`。
2. `ALIYUN_SMS_TEMPLATE` 是否为 `100001`。
3. `ALIYUN_SMS_SCHEME_NAME` 是否为 `平台验证码`。
4. 是否误用了未审核通过的新签名。

### 11.3 附件上传失败

优先排查三层限制是否一致：

1. 业务接口：`100MB`
2. Next：`120mb`
3. Nginx：`120M`

### 11.4 附件或图片丢失

优先排查：

1. `media/` 是否与数据库一起迁移。
2. 是否遗漏执行 `pnpm media:organize`。
3. 是否误删了 `media/`、挂载点或证书目录。

### 11.5 登录页、公开站或后台样式异常

优先排查：

1. `pnpm build` 是否成功。
2. `.next/static` 是否被正确复制并由 Nginx 放行。
3. `public/branding/` 等静态资源是否同步到了目标机。

## 12. 发布纪律

1. 本地仓库推送到 GitHub 与生产部署是两个动作，不能混为一谈。
2. 生产环境覆盖更新必须获得明确授权。
3. 生产回滚至少要能回退以下三类对象：代码、数据库、`media/`。
4. 若只是本机开发环境变更，文档中应明确写成本机能力，不应直接写成生产既有能力。
