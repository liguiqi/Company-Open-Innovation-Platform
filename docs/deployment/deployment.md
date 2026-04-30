# 部署说明（AI Agent / Human 双版本）

更新日期：`2026-04-20`

## 1. 文档用途

本文档同时覆盖两类部署场景：

- `AI Agent 自动化落地版`：适合在新服务器基础环境已经准备完成后，由 AI Agent 进行非交互式部署、升级和 smoke test
- `Human 手动运维版`：适合人工从零准备新服务器、创建专属账号、处理代理与镜像、安装依赖并完成正式部署

本文档描述两条线：

- `当前线上真实基线`：现网 `innovation.example.com` 仍运行在老机器上的 `lgq` 账号下
- `新服务器迁移标准`：后续迁移到另一台服务器时，统一改为专属部署账号 `deploy`

如果目标是面向人工运维的容器化部署，请配套阅读 `docs/deployment/human-containerized-deployment.md`。

## 2. 当前线上真实基线

当前正式环境已经验证可用的运行事实如下：

| 项目        | 当前状态                                         |
| ----------- | ------------------------------------------------ |
| 分支 / 版本 | `dev-bugfix` / `v1.0.0`                          |
| 仓库路径    | `/home/deploy/apps/open-innovation-platform`      |
| 服务用户    | `lgq`                                            |
| 应用端口    | `127.0.0.1:3005`                                 |
| 域名        | `https://innovation.example.com`         |
| 反向代理    | `nginx`                                          |
| 进程守护    | `systemd`                                        |
| 运行模式    | `pnpm build` + `.next/standalone` + `pnpm start` |
| 媒体目录    | 仓库根目录 `media/`                              |

当前线上链路：

```text
Browser
  -> nginx :443
  -> innovation-platform.service
  -> .next/standalone/server.js
  -> Next.js / Payload Local API
  -> PostgreSQL / Redis / media/
```

当前仓库内现成模板文件：

- `deploy/systemd/innovation-platform.service`
- `deploy/nginx/innovation.example.com.conf`

注意：这两个模板目前仍反映老服务器 `lgq` 路径，仅可作为参考；迁移到新服务器时，应改为 `deploy` 专属账号路径。

## 3. 新服务器迁移标准

后续迁移到另一台服务器时，统一按以下标准实施：

- 部署专属账号：`deploy`
- 应用目录：`/home/deploy/apps/open-innovation-platform`
- 域名：`innovation.example.com`
- 应用监听：`127.0.0.1:3005`
- 服务名：`innovation-platform.service`
- SSL 证书目录：项目内 `example.com_nginx/`，或等价的专属证书目录
- 运行方式：`pnpm build` 生成 standalone，再由 `systemd` 以 `pnpm start` 拉起

推荐不要继续沿用个人账号 `lgq` 直接托管生产应用。原因很简单：

- 个人账号和业务服务边界不清晰
- 后续交接给 AI Agent 或其他运维人员时权限难以收敛
- systemd、日志、SSH Key 和应用目录会混在个人工作目录中

## 4. 专属 sudo 账号标准

### 4.1 推荐账号名

新服务器统一使用：`deploy`

说明：

- 名称短、语义清晰，适合 systemd、SSH、日志和脚本中长期使用
- 既能用于人工运维，也能用于 AI Agent 自动化执行
- 后续如需扩展 Bothub 或其他平台，可继续沿用“项目专属部署账号”模式

### 4.2 Human 手动运维场景的账号创建方式

以下步骤使用当前已有 sudo 权限的引导账号执行：

```bash
sudo adduser deploy
sudo usermod -aG sudo deploy
sudo usermod -aG docker deploy
sudo mkdir -p /home/deploy/.ssh
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
```

如果需要沿用现有管理机上的 SSH 公钥：

```bash
sudo cp /home/<bootstrap-user>/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
sudo chown deploy:deploy /home/deploy/.ssh/authorized_keys
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

然后为 `deploy` 设置登录密码，并确认 sudo 权限：

```bash
sudo passwd deploy
id deploy
sudo -l -U deploy
```

人工运维模式建议保留“有密码的 sudo”，不要直接给 `NOPASSWD`，这样更适合正式生产运维审计。

### 4.3 AI Agent 自动化场景的账号创建方式

AI Agent 仍使用 `deploy`，但建议配合 SSH Key 和非交互 sudo。

如果该服务器是专门给本项目使用的独立内网服务器，可以使用：

```bash
echo 'deploy ALL=(ALL) NOPASSWD: ALL' | sudo tee /etc/sudoers.d/90-deploy
sudo chmod 440 /etc/sudoers.d/90-deploy
sudo visudo -cf /etc/sudoers.d/90-deploy
```

这样 AI Agent 可以无人工干预执行：

- `systemctl daemon-reload`
- `systemctl restart innovation-platform.service`
- `systemctl reload nginx`
- `journalctl -u innovation-platform.service`
- 部署目录权限修正、证书文件落位、软链接更新

如果服务器不是本项目独占，而是共享机器，则不要给 `NOPASSWD: ALL`，应改为只对白名单命令开放 sudo。

## 5. 中国国内网络与代理方案

如果新服务器在国内网络环境下访问 GitHub、Node 源、Docker Hub 或 Playwright 资源较慢，部署前请先处理代理或镜像，否则非常容易卡在依赖安装环节。

### 5.1 临时代理环境变量

如果公司已经提供 HTTP/HTTPS 代理：

```bash
export http_proxy=http://<proxy-host>:<proxy-port>
export https_proxy=http://<proxy-host>:<proxy-port>
export all_proxy=socks5://<proxy-host>:<proxy-port>
export no_proxy=127.0.0.1,localhost,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16
```

验证代理是否生效：

```bash
curl -I https://github.com
curl -I https://registry.npmjs.org
```

如果只需要单次命令走代理，可写成：

```bash
https_proxy=http://<proxy-host>:<proxy-port> pnpm install --frozen-lockfile
```

### 5.2 GitHub SSH 使用 443 端口

很多公司网络会拦截 `22` 端口，但放行 `443`。当前仓库远程地址是：

```text
git@github.com:your-org/open-innovation-platform.git
```

此时建议为 `deploy` 写入 `~/.ssh/config`：

```sshconfig
Host github.com
  HostName ssh.github.com
  Port 443
  User git
  ServerAliveInterval 60
  ServerAliveCountMax 3
```

然后验证：

```bash
ssh -T git@github.com
```

### 5.3 Ubuntu APT 镜像

如果 `apt update` 很慢，优先换成国内镜像。常用镜像源：

- `https://mirrors.aliyun.com/ubuntu/`
- `https://mirrors.tuna.tsinghua.edu.cn/ubuntu/`

#### Ubuntu 22.04 常见处理方式

```bash
sudo cp /etc/apt/sources.list /etc/apt/sources.list.bak.$(date +%F-%H%M%S)
sudo sed -i 's@http://archive.ubuntu.com/ubuntu/@https://mirrors.aliyun.com/ubuntu/@g' /etc/apt/sources.list
sudo sed -i 's@http://security.ubuntu.com/ubuntu/@https://mirrors.aliyun.com/ubuntu/@g' /etc/apt/sources.list
sudo apt update
```

#### Ubuntu 24.04 Deb822 常见处理方式

```bash
sudo cp /etc/apt/sources.list.d/ubuntu.sources /etc/apt/sources.list.d/ubuntu.sources.bak.$(date +%F-%H%M%S)
sudo sed -i 's@http://archive.ubuntu.com/ubuntu/@https://mirrors.aliyun.com/ubuntu/@g' /etc/apt/sources.list.d/ubuntu.sources
sudo sed -i 's@http://security.ubuntu.com/ubuntu/@https://mirrors.aliyun.com/ubuntu/@g' /etc/apt/sources.list.d/ubuntu.sources
sudo apt update
```

### 5.4 Node / pnpm 镜像

建议为 `deploy` 设置：

```bash
npm config set registry https://registry.npmmirror.com
pnpm config set registry https://registry.npmmirror.com
```

如果使用 `nvm` 或需要下载 Node 二进制，也建议设置：

```bash
export NVM_NODEJS_ORG_MIRROR=https://npmmirror.com/mirrors/node
```

如果部署机需要运行 Playwright 下载浏览器，可额外设置：

```bash
export PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright
```

### 5.5 Docker 镜像加速

如果生产机需要通过 Docker 拉起 PostgreSQL / Redis，建议提前为 Docker 配置镜像加速：

```json
{
  "registry-mirrors": ["https://<your-company-or-cloud-mirror>"]
}
```

写入 `/etc/docker/daemon.json` 后执行：

```bash
sudo systemctl daemon-reload
sudo systemctl restart docker
```

## 6. 部署通用前置检查

无论是 AI Agent 还是 Human 手动部署，迁移前都先确认以下事项：

1. 新服务器已经能解析并访问 `innovation.example.com`
2. 外部或内网路由已放通 `443`，本机回环可监听 `127.0.0.1:3005`
3. PostgreSQL 与 Redis 的部署方式已经确定
4. `.env.local` 中的数据库、Redis、SMTP、Aliyun SMS、Payload Secret 等值已经准备好
5. 证书文件已准备：
   - `example.com_nginx/example.com_bundle.pem`
   - `example.com_nginx/example.com.key`
6. GitHub SSH Key 已加入 `deploy` 账号
7. 如果使用公司代理，已验证 GitHub、npm registry、Docker registry 至少有一种可达

## 7. AI Agent 自动化落地版

本版本假设“系统底座已经由人工准备好”，即：

- `deploy` 账号已创建
- `sudo` 策略已配置
- `git`、`node`、`pnpm`、`nginx`、`docker` 已安装
- SSL 证书已落位
- 域名已经指向新服务器

### 7.1 登录并准备目录

```bash
sudo -iu deploy
mkdir -p /home/deploy/apps
cd /home/deploy/apps
```

### 7.2 拉取正式版代码

首次部署：

```bash
git clone git@github.com:your-org/open-innovation-platform.git
cd open-innovation-platform
git fetch --all --tags
git checkout v1.0.0
```

后续升级：

```bash
cd /home/deploy/apps/open-innovation-platform
git fetch --all --tags
git checkout v1.0.0
```

如果后续改为部署其他 tag，只替换最后一行的 tag 即可。

### 7.3 写入环境变量

```bash
cp .env.example .env.local
vi .env.local
```

至少检查以下项：

- `NEXT_PUBLIC_SERVER_URL=https://innovation.example.com`
- `PAYLOAD_SECRET=...`
- `DATABASE_URI=...`
- `REDIS_URL=...`
- `SMTP_*`
- `ALIYUN_SMS_SIGN=平台验证码`
- `ALIYUN_SMS_TEMPLATE=100001`
- `ALIYUN_SMS_SCHEME_NAME=平台验证码`

### 7.4 安装依赖与生成辅助文件

```bash
pnpm install --frozen-lockfile
pnpm generate:types
pnpm generate:importmap
```

### 7.5 启动数据库与 Redis（如使用本机 Docker）

```bash
docker compose up -d postgres redis
docker compose ps
```

### 7.6 正式构建

```bash
pnpm lint
pnpm typecheck
pnpm build
```

关键说明：当前项目生产运行读取的是 `.next/standalone/.env*` 副本，不是直接读取仓库根目录 `.env*`。因此只要改过环境变量，就必须重新执行 `pnpm build`。

### 7.7 systemd 服务文件

如果新服务器采用 system-wide Node 和 global pnpm，推荐服务文件如下：

```ini
[Unit]
Description=HeT Open Innovation Platform
After=network.target docker.service

[Service]
Type=simple
User=deploy
WorkingDirectory=/home/deploy/apps/open-innovation-platform
Environment=HOME=/home/deploy
Environment=NODE_ENV=production
Environment=PORT=3005
Environment=PATH=/usr/local/bin:/usr/bin:/bin
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

写入后执行：

```bash
sudo tee /etc/systemd/system/innovation-platform.service >/dev/null <<'EOF'
[Unit]
Description=HeT Open Innovation Platform
After=network.target docker.service

[Service]
Type=simple
User=deploy
WorkingDirectory=/home/deploy/apps/open-innovation-platform
Environment=HOME=/home/deploy
Environment=NODE_ENV=production
Environment=PORT=3005
Environment=PATH=/usr/local/bin:/usr/bin:/bin
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable innovation-platform.service
sudo systemctl restart innovation-platform.service
sudo systemctl status innovation-platform.service --no-pager
```

### 7.8 nginx 配置

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
EOF

sudo ln -sf /etc/nginx/sites-available/innovation.example.com.conf /etc/nginx/sites-enabled/innovation.example.com.conf
sudo nginx -t
sudo systemctl reload nginx
```

### 7.9 自动化 smoke test

```bash
curl -k -I https://innovation.example.com
curl -I http://127.0.0.1:3005
systemctl is-active innovation-platform.service
curl -sk -H 'Content-Type: application/json'   -d '{"phone":"13800000000"}'   https://innovation.example.com/api/sms/send
```

建议再人工打开：

1. `/`
2. `/login`
3. `/register`
4. `/dashboard`
5. `/admin`

## 8. Human 手动运维版

本版本适合运维人员从零接管一台新机器，手动完成所有准备和部署动作。步骤比 AI Agent 版更细，适合作为正式迁移 SOP。

### 8.1 系统基础包安装

先用已有 sudo 用户登录新服务器，执行：

```bash
sudo apt update
sudo apt install -y   git   curl   wget   unzip   build-essential   ca-certificates   gnupg   lsb-release   nginx   docker.io   docker-compose-plugin
```

然后启动 Docker 和 nginx：

```bash
sudo systemctl enable --now docker
sudo systemctl enable --now nginx
```

### 8.2 创建项目专属账号 `deploy`

```bash
sudo adduser deploy
sudo usermod -aG sudo deploy
sudo usermod -aG docker deploy
sudo passwd deploy
```

确认组信息：

```bash
id deploy
```

预期至少包含：`sudo`、`docker`。

### 8.3 配置 SSH Key 与 GitHub 访问

切换到 `deploy`：

```bash
sudo -iu deploy
mkdir -p ~/.ssh
chmod 700 ~/.ssh
vi ~/.ssh/config
```

建议写入：

```sshconfig
Host github.com
  HostName ssh.github.com
  Port 443
  User git
  ServerAliveInterval 60
  ServerAliveCountMax 3
```

导入私钥、公钥或部署密钥后，验证：

```bash
ssh -T git@github.com
```

### 8.4 安装 Node.js 24 与 pnpm

#### 方案 A：公网可用时，优先使用官方脚本

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pnpm@10
node -v
pnpm -v
```

#### 方案 B：国内网络不稳定时，使用镜像下载 Node 二进制

```bash
cd /tmp
wget https://npmmirror.com/mirrors/node/v24.12.0/node-v24.12.0-linux-x64.tar.xz
sudo tar -xJf node-v24.12.0-linux-x64.tar.xz -C /usr/local --strip-components=1
sudo npm install -g pnpm@10
node -v
pnpm -v
```

如果 `/usr/bin/pnpm` 不存在，可执行：

```bash
which node
which pnpm
```

确保 systemd 能拿到 `node` 和 `pnpm`。

### 8.5 拉取代码与 checkout 正式版

```bash
sudo -iu deploy
mkdir -p /home/deploy/apps
cd /home/deploy/apps
git clone git@github.com:your-org/open-innovation-platform.git
cd open-innovation-platform
git fetch --all --tags
git checkout v1.0.0
```

### 8.6 准备 `.env.local`

```bash
cp .env.example .env.local
vi .env.local
```

请逐项填写：

- `NEXT_PUBLIC_SERVER_URL`
- `PAYLOAD_SECRET`
- `DATABASE_URI` / `DATABASE_URL`
- `REDIS_URL`
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS`
- `ALIYUN_SMS_ACCESS_KEY_ID`
- `ALIYUN_SMS_ACCESS_KEY_SECRET`
- `ALIYUN_SMS_SIGN=平台验证码`
- `ALIYUN_SMS_TEMPLATE=100001`
- `ALIYUN_SMS_SCHEME_NAME=平台验证码`

### 8.7 启动 PostgreSQL 与 Redis

如果继续沿用仓库内 docker compose：

```bash
docker compose up -d postgres redis
docker compose ps
```

如果数据库和 Redis 使用外部托管实例，只要 `.env.local` 中连接串正确，这一步可以跳过。

### 8.8 安装依赖与生成 Payload 辅助文件

```bash
pnpm install --frozen-lockfile
pnpm generate:types
pnpm generate:importmap
```

### 8.9 首次种子数据（可选）

如果是空库初始化，可执行：

```bash
pnpm seed
```

如果是生产迁移后的已有数据恢复场景，不要再跑 seed，以免插入演示数据。

### 8.10 正式构建

```bash
pnpm lint
pnpm typecheck
pnpm build
```

这一步完成后，`.next/standalone/.env*` 会携带当前环境变量副本。后续只要 `.env.local` 改过，就必须重新构建。

### 8.11 放置证书

如果证书沿用项目目录方式：

```bash
mkdir -p /home/deploy/apps/open-innovation-platform/example.com_nginx
```

然后把以下文件放到该目录：

- `example.com_bundle.pem`
- `example.com.key`

完成后检查权限：

```bash
ls -l /home/deploy/apps/open-innovation-platform/example.com_nginx
```

### 8.12 写入 systemd 服务

```bash
sudo tee /etc/systemd/system/innovation-platform.service >/dev/null <<'EOF'
[Unit]
Description=HeT Open Innovation Platform
After=network.target docker.service

[Service]
Type=simple
User=deploy
WorkingDirectory=/home/deploy/apps/open-innovation-platform
Environment=HOME=/home/deploy
Environment=NODE_ENV=production
Environment=PORT=3005
Environment=PATH=/usr/local/bin:/usr/bin:/bin
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable innovation-platform.service
sudo systemctl restart innovation-platform.service
sudo systemctl status innovation-platform.service --no-pager
```

如果服务启动失败，先看日志：

```bash
sudo journalctl -u innovation-platform.service -n 200 --no-pager
```

### 8.13 写入 nginx 配置

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
EOF

sudo ln -sf /etc/nginx/sites-available/innovation.example.com.conf /etc/nginx/sites-enabled/innovation.example.com.conf
sudo nginx -t
sudo systemctl reload nginx
```

### 8.14 手工验收

先做命令级检查：

```bash
curl -I http://127.0.0.1:3005
curl -k -I https://innovation.example.com
systemctl is-active innovation-platform.service
docker compose ps
```

再做页面级检查：

1. 首页 `https://innovation.example.com/`
2. 登录页 `https://innovation.example.com/login`
3. 注册页 `https://innovation.example.com/register`
4. 工作台 `https://innovation.example.com/dashboard`
5. Payload Admin `https://innovation.example.com/admin`
6. 短信发送接口 `/api/sms/send`
7. 邮箱验证码发送链路
8. 附件上传与下载
9. `/dashboard/settings` 个人资料更新

### 8.15 常见故障优先排查项

#### 页面 502 / 504

优先检查：

- `systemctl status innovation-platform.service`
- `journalctl -u innovation-platform.service`
- `nginx -t`
- `curl -I http://127.0.0.1:3005`

#### 页面能开但短信失败

优先检查：

- `.env.local` 中的 `ALIYUN_SMS_*`
- `.next/standalone/.env*` 是否同步为最新值
- 修改环境变量后是否重新执行过 `pnpm build`

#### 构建成功但启动后仍读旧配置

这是当前项目最常见的运维坑。原因通常是：

- 只改了根目录 `.env.local`
- 但没有重新执行 `pnpm build`
- 导致运行中的 standalone 继续使用旧副本

#### 附件丢失

优先检查：

- 根目录 `media/` 是否存在
- 部署迁移时是否漏同步 `media/`
- 是否错误把文件写进 `.next/standalone/media`

## 9. 文档配套关系

迁移与运维过程中，建议同时参照：

- 架构说明：`docs/architecture/system-architecture.md`
- 部署拓扑：`docs/architecture/deployment-topology.md`
- 运维 Runbook：`docs/Ops/runbook.md`
- 发版与回滚：`docs/Ops/release-and-rollback.md`
- 测试与验收：`docs/testing.md`
