# Neel Solutions E-Commerce Platform

> **"Creating Healthy World"** — Neel Group

A full-stack, production-grade e-commerce platform built with Next.js 15, Express.js, Prisma ORM, and MySQL.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| Backend | Express.js, TypeScript, Node.js |
| ORM | Prisma 5 |
| Database | MySQL 8+ |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Monorepo | npm workspaces |

## Project Structure

```
neel_solutions/
├── apps/
│   ├── api/          # Express.js REST backend
│   └── web/          # Next.js 16 storefront & admin
├── packages/
│   └── shared/       # Shared types and Zod schemas
├── prisma/
│   ├── schema.prisma # Database schema
│   ├── migrations/   # Version-controlled migrations
│   └── seed.ts       # Dev seed data
├── .env              # Local environment (do NOT commit)
├── .env.example      # Environment template
├── ecosystem.config.js  # PM2 config for production
└── DEPLOYMENT.md     # Deployment guide
```

## Quick Start (Development)

**1. Install dependencies:**
```bash
npm install
```

**2. Configure environment:**
```bash
cp .env.example .env
# Edit .env with your MySQL credentials
```

For local Google sign-in, create `apps/api/.env` from `apps/api/.env.example` and `apps/web/.env.local` from `apps/web/.env.example`. Set the same Google Identity Services Web client ID in both files and add `http://localhost:3000` as an authorized JavaScript origin in Google Cloud. The browser client ID is public; do not commit environment files.

**3. Apply database migrations and seed:**
```bash
npx prisma migrate dev
npx ts-node prisma/seed.ts
```

**4. Start both servers:**
```bash
# In terminal 1:
npm run dev --workspace=api

# In terminal 2:
npm run dev --workspace=web
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Admin panel:** http://localhost:3000/admin

## Default Credentials (Dev Only)

| Role | Email | Password |
|---|---|---|
| Admin | admin@neelsolutions.in | admin123 |
| Customer | Register via /register | Your choice |

## Available Routes

| URL | Description |
|---|---|
| `/welcome` | Branded landing page |
| `/` | Storefront home with products |
| `/products` | Full catalogue with search |
| `/products/[id]` | Product detail + Add to cart |
| `/cart` | Shopping cart |
| `/checkout` | COD checkout + PIN validation + Coupon |
| `/orders/[id]` | Order confirmation |
| `/account/orders` | Order history |
| `/admin` | Admin dashboard |
| `/admin/orders` | Order management |
| `/admin/products` | Product management |
| `/login` | Customer login |
| `/register` | Customer registration |

## Test Coupon

```
Code: WELCOME10
Value: 10% off (min. order ₹500)
```

## Serviceable PIN Codes (Dev Seed)

```
400001 — Delivers in 2 days
110001 — Delivers in 3 days
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full Docker and PM2 deployment instructions.

---

© 2026 Neel Solutions — Neel Group. All rights reserved.
