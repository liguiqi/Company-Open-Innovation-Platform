# GPT Image Prompt - 运行部署拓扑图

参考文件：

- `../../runtime-deployment-20260422-164252.puml`
- `../../runtime-deployment-20260422-164252.svg`

可直接复制以下 prompt：

```text
Generate a professional infrastructure deployment topology slide in Chinese for "HeT Open Innovation Platform". Use a serious enterprise architecture style, blue-and-white HET visual language, 16:9 landscape, for tomorrow's project presentation.

Show this exact deployment logic from top to bottom: Browser / 内网终端 -> 域名 innovation.example.com -> Nginx 80/443 -> innovation-platform.service -> pnpm start -> start-standalone.mjs -> .next/standalone/server.js -> Next.js App Router + Payload CMS 3 + Local API -> PostgreSQL -> Redis -> media/ / public/ / SSL cert directories.

Show the host machine explicitly as 宿主机 10.0.0.2, and show Docker Compose as the container boundary for PostgreSQL and Redis. Make the Node application look like a single integrated runtime, not a scattered cluster.

Use elegant server icons, container icons, storage icons, and secure network arrows. Keep the layout very readable for managers. Labels must be simplified Chinese with a few English technical labels where helpful. Add a subtle footer mark in the bottom-right corner: "Power by LGQ".
```
