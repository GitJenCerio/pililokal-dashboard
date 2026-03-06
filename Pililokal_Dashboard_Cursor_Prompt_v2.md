# Pililokal Dashboard — Cursor Implementation Prompt v2
> Full audit · Missing features · Routes · Deployment guide
> Updated: March 2026

---

## 0. Project Context

This is a **Next.js 14 App Router** internal ops dashboard for Pililokal, managing:
- **Merchant onboarding** onto a Shopify store (tracked in PostgreSQL via Prisma)
- **Leads pipeline** imported from `Pililokal_Merchants_Cleaned.xlsx` (5 sheets, ~1,700 rows)

**Stack:** TypeScript · Next.js 14 · Tailwind CSS · Prisma ORM · shadcn/ui · Recharts · iron-session · next-auth · Resend (email) · xlsx (Excel parsing)

---

## 1. Current Routes Inventory

### ✅ Existing Routes

| Route | File | Status |
|---|---|---|
| `/` | `src/app/page.tsx` | ✅ Login redirect |
| `/login` | `src/app/login/action.ts` | ✅ Credential login (no page.tsx — uses action only) |
| `/logout` | `src/app/logout/action.ts` | ✅ Server action |
| `/dashboard` | `src/app/dashboard/page.tsx` | ✅ Main dashboard with KPIs |
| `/dashboard/merchants/new` | `src/app/dashboard/merchants/new/page.tsx` | ✅ Add merchant form |
| `/dashboard/merchants/[id]` | `src/app/dashboard/merchants/[id]/page.tsx` | ✅ Merchant detail view |
| `/dashboard/merchants/[id]/edit` | `src/app/dashboard/merchants/[id]/edit/page.tsx` | ✅ Edit merchant form |
| `/dashboard/leads` | `src/app/dashboard/leads/page.tsx` | ✅ Leads pipeline (Excel-backed) |
| `/dashboard/shopify` | `src/app/dashboard/shopify/page.tsx` | ✅ Shopify upload tracker |
| `/dashboard/admin/users` | `src/app/dashboard/admin/users/page.tsx` | ✅ User management (ADMIN only) |
| `/api/auth/[...nextauth]` | NextAuth catch-all | ✅ OAuth handler |
| `/api/export/merchants` | `src/app/api/export/merchants/route.ts` | ✅ CSV export |

### ❌ Missing Routes (implement these)

| Route | Priority | Description |
|---|---|---|
| `/login` → `page.tsx` | 🔴 HIGH | Login page is missing — only action exists. Need `src/app/login/page.tsx` rendering `<LoginForm />` |
| `/dashboard/merchants` | 🔴 HIGH | No merchant list/index page. Nav goes straight to `/new`. Add a searchable table of all merchants. |
| `/dashboard/analytics` | 🟡 MEDIUM | Category breakdown, pipeline funnel, outreach activity charts |
| `/dashboard/leads/[id]` | 🟡 MEDIUM | Lead detail/edit view — currently no way to view a single lead record |
| `/api/leads/import` | 🟡 MEDIUM | Excel import endpoint (currently done via a button that calls server action — needs proper route handler) |
| `/api/export/leads` | 🟡 MEDIUM | CSV export for leads (only merchant export exists) |
| `/api/health` | 🟢 LOW | Health check endpoint for deployment monitoring |
| `/dashboard/admin/activity` | 🟢 LOW | Global activity log view (model exists, no UI) |

---

## 2. Missing Features Audit

### 2.1 🔴 Critical — Must Fix

#### A. Login Page Missing `page.tsx`
`/login` has an `action.ts` but no `page.tsx`. Users hit a 404 on direct navigation.

```
Create: src/app/login/page.tsx
```
```tsx
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-lg border p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Pililokal Dashboard</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
```

#### B. Merchant List Page Missing
The nav links to `/dashboard/merchants/new` but there is no `/dashboard/merchants` index. Users cannot browse or search existing merchants.

```
Create: src/app/dashboard/merchants/page.tsx
```

The page should:
- Fetch all merchants via `prisma.merchant.findMany` with pagination (default 25/page)
- Accept `?q=`, `?status=`, `?category=` search params
- Render a `<MerchantsTable />` client component with sortable columns
- Include an "Add Merchant" button linking to `/dashboard/merchants/new`

Fix nav in `dashboard-nav.tsx`:
```tsx
// Change:
{ href: "/dashboard/merchants/new", label: "Add Merchant", icon: Users, exact: true },
// To:
{ href: "/dashboard/merchants", label: "Merchants", icon: Users, exact: false },
```

#### C. Prisma Provider Mismatch
`prisma/schema.prisma` says `provider = "sqlite"` but `.env.example` uses PostgreSQL. This will silently break in production.

```prisma
// prisma/schema.prisma — change this:
datasource db {
  provider = "sqlite"       // ← wrong for production
  url      = env("DATABASE_URL")
}

// To this:
datasource db {
  provider = "postgresql"   // ← matches .env.example
  url      = env("DATABASE_URL")
}
```

After changing, run: `npx prisma migrate dev --name init`

---

### 2.2 🟡 Medium Priority — Implement Next

#### D. Leads Detail/Edit View
There is no `/dashboard/leads/[id]` route. Clicking a lead in the pipeline table has nowhere to go.

```
Create: src/app/dashboard/leads/[id]/page.tsx
Create: src/app/dashboard/leads/[id]/edit/page.tsx
Create: src/components/leads/lead-detail.tsx
Create: src/components/leads/lead-form.tsx
```

The lead detail should show:
- All contact fields (email, phone, FB, IG, TikTok, website)
- `statusNotes` + `callsUpdate` history (full text)
- Stage badge + Shopify status badge
- Edit button (EDITOR/ADMIN only)
- "Promote to Merchant" button — creates a `Merchant` record from this lead

#### E. Analytics Dashboard
Currently `/dashboard` shows only a KPI summary and a pie chart. A dedicated analytics page is missing.

```
Create: src/app/dashboard/analytics/page.tsx
Create: src/components/dashboard/analytics-client.tsx
```

Charts to include:
1. **Pipeline Funnel** — leads by stage (New → Contacted → Interested → Confirmed → Live)
2. **Category Breakdown** — bar chart, leads + merchants by category
3. **Country Split** — PH vs US leads donut
4. **Outreach Timeline** — weekly bar chart of last activity dates
5. **Staff Workload** — encodedBy breakdown

Add to nav:
```tsx
{ href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, exact: true },
```

#### F. Leads CSV Export
Only merchants have a CSV export. Add one for leads.

```
Create: src/app/api/export/leads/route.ts
```

Mirror the existing `/api/export/merchants/route.ts` but query `prisma.lead.findMany()`.

#### G. Password Reset Flow
The `User` model has `passwordResetToken` and `passwordResetExpiry` fields but no UI or API.

```
Create: src/app/forgot-password/page.tsx
Create: src/app/forgot-password/action.ts
Create: src/app/reset-password/page.tsx
Create: src/app/reset-password/action.ts
```

The forgot-password action should:
1. Find user by email
2. Generate `crypto.randomBytes(32).toString('hex')`
3. Set `passwordResetToken` + `passwordResetExpiry` (now + 1 hour)
4. Send email via Resend with reset link
5. Show "Check your email" message (don't confirm email existence)

#### H. Pagination on Merchant Table
All merchants are loaded in a single query — will degrade at scale.

In `src/app/dashboard/merchants/page.tsx` (new file):
```tsx
const page = Number(searchParams.page ?? 1);
const take = 25;
const skip = (page - 1) * take;

const [merchants, total] = await Promise.all([
  prisma.merchant.findMany({ take, skip, orderBy: { lastUpdatedAt: "desc" }, where }),
  prisma.merchant.count({ where }),
]);
```

Add `<Pagination total={total} page={page} perPage={take} />` component.

---

### 2.3 🟢 Low Priority — Polish

#### I. Health Check Endpoint
```
Create: src/app/api/health/route.ts
```
```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "connected", ts: new Date().toISOString() });
  } catch {
    return NextResponse.json({ status: "error", db: "disconnected" }, { status: 503 });
  }
}
```

#### J. Activity Log UI
The `ActivityLog` model is populated on every merchant mutation but there is no UI to view it.

```
Create: src/app/dashboard/admin/activity/page.tsx
```

Query: `prisma.activityLog.findMany({ take: 100, orderBy: { createdAt: "desc" }, include: { user: true, merchant: true } })`

#### K. bcrypt Rounds
In `prisma/seed.ts` and any `bcrypt.hash` call, change rounds from 10 to 12:
```ts
// Change:
const hash = await bcrypt.hash(password, 10);
// To:
const hash = await bcrypt.hash(password, 12);
```

#### L. Missing UI Components
These shadcn/ui components are referenced but not in `src/components/ui/`:
- `table.tsx` — needed for merchant and leads tables
- `toast.tsx` / `use-toast.ts` — needed for action feedback
- `pagination.tsx` — needed for merchant list

Install via:
```bash
npx shadcn@latest add table toast pagination
```

---

## 3. Complete Feature Checklist for Cursor

Use this as a task list in Cursor Composer:

```
[ ] Create src/app/login/page.tsx — login page wrapper
[ ] Create src/app/dashboard/merchants/page.tsx — merchant list with search + pagination
[ ] Fix dashboard-nav.tsx — point Merchants link to /dashboard/merchants
[ ] Fix prisma/schema.prisma — change provider from sqlite to postgresql
[ ] Run: npx prisma migrate dev --name switch-to-postgres
[ ] Create src/app/dashboard/leads/[id]/page.tsx — lead detail view
[ ] Create src/app/dashboard/leads/[id]/edit/page.tsx — lead edit form
[ ] Create src/app/dashboard/analytics/page.tsx — analytics dashboard
[ ] Add analytics link to dashboard-nav.tsx
[ ] Create src/app/api/export/leads/route.ts — leads CSV export
[ ] Create src/app/forgot-password/page.tsx + action.ts
[ ] Create src/app/reset-password/page.tsx + action.ts
[ ] Create src/app/api/health/route.ts — health check
[ ] Create src/app/dashboard/admin/activity/page.tsx — activity log viewer
[ ] Fix bcrypt rounds to 12 in all hash calls
[ ] Add shadcn table, toast, pagination components
[ ] Add "Promote to Merchant" action on lead detail page
[ ] Add global error boundary: src/app/error.tsx
[ ] Add loading skeletons: src/app/dashboard/loading.tsx
```

---

## 4. Deployment Guide

### 4.1 Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 18.17+ or 20+ | https://nodejs.org |
| npm | 9+ | Bundled with Node |
| PostgreSQL | 14+ | See options below |
| Git | Any | https://git-scm.com |

---

### 4.2 Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

```env
# Required — PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/pililokal?schema=public"

# Required — NextAuth session signing
NEXTAUTH_URL="https://your-domain.com"           # or http://localhost:3000 for dev
NEXTAUTH_SECRET="run: openssl rand -base64 32"   # MUST be 32+ random chars in prod

# Optional — Google OAuth (leave blank to disable)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Optional — Email for password reset invitations (Resend.com)
RESEND_API_KEY="re_xxxx"
FROM_EMAIL="noreply@yourdomain.com"
APP_NAME="Pililokal Dashboard"
```

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

---

### 4.3 Local Development Setup

```bash
# 1. Clone & install
git clone <repo-url>
cd pililokal-dashboard
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your values

# 3. Set up database
npx prisma migrate dev --name init   # creates tables
npx prisma db seed                   # creates admin user

# 4. Place Excel file in project root (for leads import)
# File: Pililokal_Merchants_Cleaned.xlsx

# 5. Start dev server
npm run dev
# → http://localhost:3000

# 6. Log in with seeded admin
# Email: admin@pililokal.com
# Password: check prisma/seed.ts
```

---

### 4.4 Production Deployment Options

#### Option A: Vercel (Recommended — simplest)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Set environment variables in Vercel dashboard:
#    Settings → Environment Variables → add all from .env.local

# 4. Add PostgreSQL (Neon recommended — free tier)
#    Vercel dashboard → Storage → Create → Neon Postgres
#    Copy DATABASE_URL to environment variables

# 5. Run migrations on production DB
vercel env pull .env.production
npx prisma migrate deploy

# 6. Seed admin user
npx prisma db seed
```

**Vercel-specific `next.config.js` — no changes needed**, it works out of the box.

---

#### Option B: Railway

```bash
# 1. Install Railway CLI
npm i -g @railway/cli
railway login

# 2. Initialize project
railway init

# 3. Add PostgreSQL plugin in Railway dashboard
#    New Service → Database → PostgreSQL
#    Copy DATABASE_URL from Variables tab

# 4. Set environment variables in Railway dashboard
#    All variables from .env.local

# 5. Deploy
railway up

# 6. Run migrations
railway run npx prisma migrate deploy
railway run npx prisma db seed
```

---

#### Option C: Docker / Self-hosted VPS

Create `Dockerfile`:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

Add to `next.config.js`:
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",   // ← add this for Docker
};
module.exports = nextConfig;
```

```bash
# Build and run
docker build -t pililokal-dashboard .
docker run -p 3000:3000 --env-file .env.production pililokal-dashboard

# Or with docker-compose (includes PostgreSQL):
```

`docker-compose.yml`:
```yaml
version: "3.9"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file: .env.production
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: pililokal
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: changeme
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

```bash
docker-compose up -d
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npx prisma db seed
```

---

### 4.5 Post-Deployment Checklist

```
[ ] NEXTAUTH_SECRET is a random 32+ char string (not the example value)
[ ] NEXTAUTH_URL matches your actual domain (including https://)
[ ] DATABASE_URL points to production PostgreSQL (not SQLite)
[ ] Prisma migrations ran: npx prisma migrate deploy
[ ] Admin user seeded: npx prisma db seed
[ ] /api/health returns { status: "ok" }
[ ] Login works at /login
[ ] Excel file imported: go to /dashboard/leads → Import from Excel
[ ] Test create/edit merchant as EDITOR role
[ ] Test that VIEWER cannot create/edit
[ ] Set up automated DB backups (pg_dump cron or Neon/Railway built-in)
```

---

### 4.6 Database Migrations Workflow

```bash
# Development — creates migration file + applies it
npx prisma migrate dev --name your-change-description

# Production — applies pending migrations only (no schema changes)
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# If schema is out of sync (emergency only — do NOT use in prod)
npx prisma db push
```

---

### 4.7 Create First Production Admin User

After deployment, if seed didn't run or you need a new admin:

```bash
# Via Prisma Studio (local with production DATABASE_URL)
DATABASE_URL="your-prod-url" npx prisma studio

# Or via a one-off script
DATABASE_URL="your-prod-url" npx tsx scripts/create-admin.ts
```

Create `scripts/create-admin.ts`:
```ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("change-this-password", 12);
  const user = await prisma.user.upsert({
    where: { email: "admin@pililokal.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@pililokal.com",
      passwordHash: hash,
      role: "ADMIN",
      isActive: true,
    },
  });
  console.log("Admin created:", user.email);
}

main().finally(() => prisma.$disconnect());
```

---

## 5. Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│                   Next.js 14 App                │
│                                                  │
│  /login ──────────────── LoginForm              │
│  /dashboard ──────────── DashboardClient        │
│  /dashboard/merchants ─── MerchantsList  ← NEW  │
│  /dashboard/merchants/[id] MerchantDetail        │
│  /dashboard/leads ──────── LeadsPipeline         │
│  /dashboard/leads/[id] ─── LeadDetail   ← NEW   │
│  /dashboard/analytics ──── Analytics    ← NEW   │
│  /dashboard/shopify ────── ShopifyUpdates        │
│  /dashboard/admin/users ── UsersTable            │
│  /dashboard/admin/activity ActivityLog ← NEW    │
│  /forgot-password ──────── ResetRequest ← NEW   │
│  /reset-password ───────── ResetForm    ← NEW   │
│                                                  │
│  API Routes:                                     │
│  /api/auth/[...nextauth]  NextAuth               │
│  /api/export/merchants    CSV export             │
│  /api/export/leads        CSV export   ← NEW    │
│  /api/health              Health check ← NEW    │
└────────────────┬────────────────────────────────┘
                 │
         ┌───────▼───────┐
         │  Prisma ORM   │
         └───────┬───────┘
                 │
         ┌───────▼───────┐
         │  PostgreSQL   │
         │  (Neon/Railway│
         │  /self-hosted)│
         └───────────────┘
```

---

## 6. Role & Permissions Reference

| Action | ADMIN | EDITOR | VIEWER |
|---|:---:|:---:|:---:|
| View dashboard, merchants, leads | ✅ | ✅ | ✅ |
| Add / edit merchants | ✅ | ✅ | ❌ |
| Delete merchants | ✅ | ❌ | ❌ |
| Import leads from Excel | ✅ | ✅ | ❌ |
| Update lead status | ✅ | ✅ | ❌ |
| Export CSV | ✅ | ✅ | ✅ |
| Manage users | ✅ | ❌ | ❌ |
| View activity log | ✅ | ❌ | ❌ |

Enforced via `requireRole(session, "EDITOR")` in Server Actions — see `src/lib/permissions.ts`.

---

## 7. Quick Command Reference

```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # ESLint check

npx prisma studio        # GUI DB browser
npx prisma migrate dev   # Create + apply migration (dev)
npx prisma migrate deploy # Apply migrations (production)
npx prisma db seed       # Seed admin user
npx prisma generate      # Regenerate Prisma Client after schema change
```
