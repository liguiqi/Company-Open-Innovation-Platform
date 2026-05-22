# Open Innovation Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.2.3-black)](https://nextjs.org)
[![Payload CMS 3](https://img.shields.io/badge/Payload_CMS-3.82.1-blue)](https://payloadcms.com)

**[中文文档](README_CN.md)**

An open-source enterprise innovation collaboration platform built with **Next.js 16 + Payload CMS 3 + PostgreSQL + Redis**. It unifies a public-facing portal, authentication center, innovation workspace, and admin panel into a single full-stack application.

---

## Screenshots

<table>
  <tr>
    <td align="center"><b>Public Homepage</b></td>
    <td align="center"><b>Tech Needs Hall</b></td>
  </tr>
  <tr>
    <td><img src="docs/assets/platform1-wechat_2026-05-22_094752_358.png" alt="Public Homepage" width="480"/></td>
    <td><img src="docs/assets/platform2-wechat_2026-05-22_094958_705.png" alt="Tech Needs Hall" width="480"/></td>
  </tr>
  <tr>
    <td align="center"><b>Ecosystem Partners</b></td>
    <td align="center"><b>Case Studies</b></td>
  </tr>
  <tr>
    <td><img src="docs/assets/platform3-wechat_2026-05-22_095049_984.png" alt="Ecosystem Partners" width="480"/></td>
    <td><img src="docs/assets/platform4-wechat_2026-05-22_095111_506.png" alt="Case Studies" width="480"/></td>
  </tr>
  <tr>
    <td align="center"><b>Innovation Workspace</b></td>
    <td align="center"><b>Admin Background</b></td>
  </tr>
  <tr>
    <td><img src="docs/assets/platform5-wechat_2026-05-22_095130_888.png" alt="Login Page" width="480"/></td>
    <td><img src="docs/assets/platform6-wechat_2026-05-22_095230_604.png" alt="Registration Page" width="480"/></td>
  </tr>
  <tr>
    <td align="center"><b>Innovation Workspace dark-mode</b></td>
    <td align="center"><b>Admin Panel dark-mode</b></td>
  </tr>
  <tr>
    <td><img src="docs/assets/platform7-wechat_2026-05-22_095328_491.png" alt="Innovation Workspace" width="480"/></td>
    <td><img src="docs/assets/platform8-wechat_2026-05-22_095405_620.png" alt="Admin Panel" width="480"/></td>
  </tr>
</table>

---

## Features

### Public Portal

- Homepage with hero section and CTAs (`/`)
- Tech Needs Hall with search and filtering (`/needs`, `/needs/[id]`)
- Ecosystem Partner directory (`/ecosystem`)
- Case Studies showcase (`/cases`, `/cases/[slug]`)
- Collaboration process overview (`/process`)
- Proposal submission entry (`/submit`)

### Authentication Center

- Email / phone + password login
- Email / SMS verification code login
- Multi-channel registration (email verification, SMS verification, or both)
- Unified light/dark theme support across all auth pages

### Innovation Workspace

- Dashboard overview (`/dashboard`)
- Proposal management (`/dashboard/proposals`)
- New proposal with multi-file upload (`/dashboard/proposals/new`)
- Proposal detail and review workflow (`/dashboard/proposals/[id]`)
- Profile settings (`/dashboard/settings`)
- Partner management (`/dashboard/partners`)
- User management (`/dashboard/users`)

### Payload Admin

- Branded admin panel at `/admin`
- Collection management: `users`, `user-groups`, `tech-needs`, `proposals`, `partners`, `case-studies`, `media`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web Framework | Next.js 16.2.3 |
| CMS / Data Access | Payload CMS 3.82.1 |
| Frontend | React 19 + Tailwind CSS 4 |
| Database | PostgreSQL |
| OTP Cache | Redis |
| Email | nodemailer + SMTP |
| SMS | Alibaba Cloud SMS |
| Process Manager | systemd |
| Reverse Proxy | nginx |
| Runtime | `next build` standalone + `pnpm start` |

Request flow:

```text
Browser -> nginx :443 -> systemd service -> .next/standalone/server.js
  -> Next.js App Router / Payload Local API -> PostgreSQL / Redis / media/
```

---

## Getting Started

### Prerequisites

- Node.js >= 18.20.2 or >= 20.9.0
- pnpm >= 9
- Docker (for PostgreSQL and Redis)

### Installation

```bash
pnpm install
pnpm db:up          # Start PostgreSQL + Redis via Docker
pnpm generate:types
pnpm generate:importmap
pnpm seed           # Seed initial data
pnpm dev            # Start development server
```

Default dev addresses:

- Public portal: `http://localhost:3000`
- Dashboard: `http://localhost:3000/dashboard`
- Admin: `http://localhost:3000/admin`

### Common Commands

```bash
pnpm lint           # Lint with ESLint + oxlint
pnpm typecheck      # TypeScript type check
pnpm build          # Production build
pnpm test:int       # Integration tests
pnpm test:e2e       # End-to-end tests (Playwright)
```

---

## Project Structure

```text
src/
  app/              # Next.js App Router pages and API routes
    (public)/       # Public portal pages
    (auth)/         # Login, register, verify
    (dashboard)/    # Innovation workspace
    (payload)/      # Payload CMS admin
    api/            # REST API routes (auth, proposals, sms, etc.)
  collections/      # Payload CMS collection definitions
  components/       # React components (shared, layout, auth, dashboard, payload)
  hooks/            # Payload hooks (notifications, status changes, media sync)
  lib/              # Utilities (auth, env, theme, validators, etc.)
  services/         # External services (email, redis, SMS, rate limiting)
  scripts/          # Seed data and maintenance scripts
  migrations/       # Database migrations
deploy/             # nginx config, systemd service file
docs/               # Architecture, deployment, ops, and progress docs
public/branding/    # Brand assets (logos, favicons)
```

---

## Environment Variables

Copy `.env.example` and fill in your values:

```bash
PAYLOAD_SECRET=               # At least 32 characters
NEXT_PUBLIC_SERVER_URL=       # e.g. http://localhost:3000
DATABASE_URI=                 # PostgreSQL connection string
REDIS_URL=                    # Redis connection string
SMTP_HOST=                    # SMTP server
SMTP_USER= / SMTP_PASS=       # SMTP credentials
ALIYUN_SMS_ACCESS_KEY_ID=     # Alibaba Cloud SMS (optional)
ALIYUN_SMS_ACCESS_KEY_SECRET= # Alibaba Cloud SMS (optional)
```

---

## Deployment

See [docs/deployment/deployment.md](docs/deployment/deployment.md) for the full guide.

Quick reference:

- systemd: `deploy/systemd/innovation-platform.service`
- nginx: `deploy/nginx/innovation.example.com.conf`
- Port: `3005`
- Media storage: `media/` in project root

> **Note:** The production build uses `.next/standalone`. After changing environment variables, you must run `pnpm build` and restart the service for changes to take effect.

---

## Documentation

- [Docs Index](docs/README.md)
- [Architecture](docs/architecture/README.md)
- [Deployment Guide](docs/deployment/deployment.md)
- [Testing](docs/testing.md)
- [Ops Manual](docs/Ops/README.md)
- [Development Progress](docs/progress/2026-04-20.md)

---

## Known Limitations

- Automated tests do not yet fully cover SMS, email, attachment permissions, and review workflows
- Email send failures do not block the main business flow
- When Redis is unavailable, OTP falls back to in-memory storage (codes lost on restart)
- Direct database writes bypass Payload hooks, access control, and notification logic

## License

[MIT](LICENSE)
