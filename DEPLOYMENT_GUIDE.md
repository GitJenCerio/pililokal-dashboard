# PiliLokal Dashboard — Deployment Guide

This guide covers deploying the dashboard to **Vercel** with **PostgreSQL** (Supabase, Neon, or Railway), plus an audit of the Prisma schema and options if you want to switch to **MongoDB**.

---

## Table of contents

1. [Quick checklist](#quick-checklist)
2. [How to check if Supabase is working and ready to deploy](#how-to-check-if-supabase-is-working-and-ready-to-deploy)
3. [Schema audit](#schema-audit)
4. [Deploy with Supabase (step-by-step)](#deploy-with-supabase-step-by-step)
5. [Deploy with Neon or Railway (alternatives)](#deploy-with-neon-or-railway-alternatives)
6. [Vercel configuration](#vercel-configuration)
7. [Environment variables](#environment-variables)
8. [Troubleshooting Supabase](#troubleshooting-supabase)
9. [Switching to MongoDB](#switching-to-mongodb)

---

## Quick checklist

- [ ] PostgreSQL database (Supabase / Neon / Railway) with **two URLs**: pooled + direct
- [ ] `DATABASE_URL` = pooled URL with `?pgbouncer=true` (for Vercel serverless)
- [ ] `DIRECT_URL` = direct connection URL (for migrations; **required** in schema)
- [ ] `NEXTAUTH_URL` = your production URL (e.g. `https://dashboard.pililokal.com`)
- [ ] `NEXTAUTH_SECRET` and `SESSION_SECRET` (32+ chars each, different from each other)
- [ ] Run migrations or `schema-setup.sql` on the database **once** (using direct connection)
- [ ] Vercel project connected to Git, env vars set, deploy

---

## How to check if Supabase is working and ready to deploy

Use these checks **before** and **after** deploying to be sure Supabase is correctly set up.

### 1. Environment variables (local)

From the project root, with the same values you'll use in Vercel:

- **DATABASE_URL** — Supabase **Session mode** (pooler) URI with `?pgbouncer=true` at the end.
- **DIRECT_URL** — Supabase **Direct** connection URI (port 5432), no pgbouncer.
- **NEXTAUTH_URL** — Your production URL (e.g. `https://dashboard.pililokal.com`).
- **NEXTAUTH_SECRET** and **SESSION_SECRET** — Both set, 32+ characters each, not placeholders.

Quick check (PowerShell): list env var names to confirm they exist:

```powershell
Get-Content .env.local | Where-Object { $_ -match '^[A-Z_]+\=' } | ForEach-Object { ($_ -split '=')[0] }
```

### 2. Run the verification script (recommended)

From project root:

```bash
npx prisma generate
node scripts/verify-supabase.mjs
```

Or use the npm script: `npm run verify:supabase`

- **All checks pass** → Supabase is working; you can deploy.
- **"Pooled connection failed"** → Use the **pooler** URL (Session mode) and add `?pgbouncer=true` to `DATABASE_URL`.
- **"Direct connection failed"** → Use the **Direct** connection string as `DIRECT_URL`.
- **"Missing tables"** → Run `prisma/schema-setup.sql` once in Supabase **SQL Editor**, then run the script again.

### 3. Manual checks (without the script)

**Test direct connection:** Run `SELECT 1` in Supabase **SQL Editor**. Or: `npx prisma db execute --stdin --schema=prisma/schema.prisma` and paste `SELECT 1 as ok`.

**Test pooled connection (what the app uses):** Run `npm run build` then `npm run start`, then open `http://localhost:3000/api/health`. You should see `"status": "ok"` and `"database": { "status": "connected" }`. If not, fix `DATABASE_URL` (pooler + `pgbouncer=true`).

### 4. After deploying to Vercel

1. Open **https://your-domain.vercel.app/api/health** — confirm `status: "ok"` and `database.status: "connected"`.
2. Try logging in; if it works, Supabase and auth are ready.

### 5. Quick readiness checklist

| Check | How |
|-------|-----|
| Pooled URL has `pgbouncer=true` | Inspect `DATABASE_URL` (Session mode) |
| Direct URL is port 5432 | Inspect `DIRECT_URL` (Direct connection) |
| Schema applied | Run `schema-setup.sql` in SQL Editor |
| Local health OK | `npm run start` then open `/api/health` |
| Production health OK | Open `https://your-domain/api/health` |
| Login works | Sign in on production |

---

## Schema audit

### Current stack

| Item | Status | Notes |
|------|--------|--------|
| **Provider** | PostgreSQL | `provider = "postgresql"` in `schema.prisma` |
| **Connection** | Pooled + direct | `url` + `directUrl` — both required for Supabase/Neon on Vercel |
| **IDs** | `cuid()` | Good for distributed systems; works in Postgres and MongoDB |
| **Enums** | String | Comment says "SQLite" but you use Postgres; could use `enum` later |
| **Indexes** | Present | Merchant: shopifyStatus, category, lastUpdatedAt, selectionConfirmed. Lead: stage, country, composite, shopifyStatus, needsFollowup |
| **Relations** | FK + cascade | User ↔ Merchant, Merchant ↔ ActivityLog, MerchantProductApproval, Lead (standalone) |
| **Migrations** | None in repo | You use `db push` or manual `schema-setup.sql` |

### Schema health

- **Working as-is:** Yes. The schema is valid, indexed, and uses foreign keys correctly.
- **directUrl:** The schema expects `DIRECT_URL` in the environment. If you omit it, Prisma may fail on `migrate deploy` or `db push` when using a pooled URL (Supabase/Neon require a direct connection for DDL).
- **Recommendation:** Always set both `DATABASE_URL` (pooled, with `?pgbouncer=true` for Supabase) and `DIRECT_URL` (direct connection) in production. Use `DIRECT_URL` only for running migrations from your machine or CI; the app uses `DATABASE_URL`.

### Optional improvements (non-blocking)

- Add `@@index([email])` on `User` if you often query by email (you already have `@unique` which creates an index).
- Consider native Postgres enums for `User.role`, `Merchant.shopifyStatus`, `Lead.stage` for stricter validation and smaller storage.
- Add `createdAt` to `Merchant` if you need “created at” separately from `lastUpdatedAt`.

---

## Deploy with Supabase (step-by-step)

### 1. Create Supabase project

1. Go to [supabase.com](https://supabase.com) → New project.
2. Pick region (e.g. Singapore `sin1` to match Vercel).
3. Set a strong database password and save it.

### 2. Get the two connection URLs

In Supabase: **Project Settings → Database**.

- **Connection string (URI):** use “Session mode” (pooler).
  - Copy the URI. It usually looks like:
    - `postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres`
  - Add (or append) `?pgbouncer=true` — this is your **DATABASE_URL** for the app.
- **Direct connection:** use “Direct connection” (port 5432).
  - URI like: `postgresql://postgres.[ref]:[PASSWORD]@db.[ref].supabase.co:5432/postgres`
  - This is your **DIRECT_URL** (for migrations only; do not use in Vercel env).

Important: **DATABASE_URL** = pooler + `?pgbouncer=true`. **DIRECT_URL** = direct, no pgbouncer. Using only the direct URL in Vercel can lead to “too many connections” and “prepared statement” errors.

### 3. Create the database schema (one-time)

**Option A — Using Prisma (recommended if you have migrations):**

From your machine (with `DIRECT_URL` in `.env`):

```bash
npx prisma migrate deploy
```

If you don’t have migrations yet, use Option B.

**Option B — Manual SQL (current repo setup):**

1. In Supabase: **SQL Editor → New query**.
2. Paste the contents of `prisma/schema-setup.sql`.
3. Run the script.

Then (optional) from your machine:

```bash
npx prisma db pull   # optional: align Prisma schema with DB
npx prisma generate
```

### 4. Vercel project

1. [vercel.com](https://vercel.com) → Import your Git repo.
2. Framework: **Next.js** (auto-detected).
3. Build command: `npx prisma generate && npm run build` (or use the one in `vercel.json`).
4. Root directory: project root.

### 5. Environment variables in Vercel

In Vercel: **Project → Settings → Environment Variables**. Add for **Production** (and Preview if you want):

| Name | Value | Notes |
|------|--------|--------|
| `DATABASE_URL` | Pooler URI with `?pgbouncer=true` | From Supabase “Session mode” |
| `DIRECT_URL` | Direct URI (port 5432) | From Supabase “Direct connection”; needed for schema/migrate |
| `NEXTAUTH_URL` | `https://dashboard.pililokal.com` | No trailing slash |
| `NEXTAUTH_SECRET` | 32+ random chars | e.g. `openssl rand -base64 32` |
| `SESSION_SECRET` | 32+ random chars | Different from NEXTAUTH_SECRET |

Optional: `RESEND_API_KEY`, `FROM_EMAIL`, `APP_NAME`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` for email/OAuth.

Redeploy after adding or changing variables.

### 6. First deploy and seed (optional)

- Deploy from Vercel. The app will use `DATABASE_URL` at runtime.
- To seed the database, run from your machine (with `DIRECT_URL` in `.env`):

```bash
npm run db:seed
```

---

## Deploy with Neon or Railway (alternatives)

If Supabase is hard (billing, region, or connection issues), these are easier for many users.

### Neon

1. [neon.tech](https://neon.tech) → Create project, pick region.
2. **Connection string:** use “Pooled” and add `?pgbouncer=true` → **DATABASE_URL**.
3. **Direct connection** (no pooler) → **DIRECT_URL**.
4. Run schema once: Prisma migrate with `DIRECT_URL` or run equivalent SQL in Neon SQL editor.
5. In Vercel set `DATABASE_URL` and `DIRECT_URL` as above.

### Railway

1. [railway.app](https://railway.app) → New project → Add PostgreSQL.
2. In Variables you get a single `DATABASE_URL`. Railway’s Postgres is usually direct (no pgbouncer).
3. For Vercel, you can often use the same URL for both `DATABASE_URL` and `DIRECT_URL` (no pooler). If Railway offers a pooler, use pooled for `DATABASE_URL` and direct for `DIRECT_URL`.
4. Run migrations with `DIRECT_URL` or `DATABASE_URL` from your machine.

---

## Vercel configuration

Your `vercel.json` already includes:

- **buildCommand:** `npx prisma generate && npm run build`
- **Region:** `sin1` (Singapore)
- **Headers:** no-store for `/api`, noindex for all
- **Redirects:** `/admin` → `/dashboard`

No change needed unless you switch region or add more redirects.

---

## Environment variables

Summary of what the app expects (see `.env.example`):

| Variable | Required | Used for |
|----------|----------|----------|
| `DATABASE_URL` | Yes | Runtime DB (pooled, with `?pgbouncer=true` for Supabase/Neon) |
| `DIRECT_URL` | Yes (schema) | Migrations / `db push`; set in Vercel so build can run migrate if you add it |
| `NEXTAUTH_URL` | Yes | Must match production URL (e.g. `https://dashboard.pililokal.com`) |
| `NEXTAUTH_SECRET` | Yes | NextAuth signing (32+ chars) |
| `SESSION_SECRET` | Yes | Session cookie (32+ chars) |
| `RESEND_API_KEY`, `FROM_EMAIL`, `APP_NAME` | No | Email (Resend) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | No | Google OAuth |

---

## Troubleshooting Supabase

| Problem | Cause | Fix |
|--------|--------|-----|
| “prepared statement does not exist” | App using direct URL or pooler without `pgbouncer=true` | Use **pooler** URL with `?pgbouncer=true` as `DATABASE_URL`. |
| “Too many connections” | Using direct URL in serverless | Use **pooler** (Session mode) as `DATABASE_URL`; keep direct only for `DIRECT_URL`. |
| Migrate / `db push` hangs or fails | Migrations need a direct connection | Use `DIRECT_URL` in `.env` locally and run `prisma migrate deploy` or `db push`; or run `schema-setup.sql` in Supabase SQL Editor. |
| Build fails: “DIRECT_URL” | Schema has `directUrl = env("DIRECT_URL")` | Add `DIRECT_URL` in Vercel (can be same as direct Supabase URI). |
| 500 on login/dashboard | Missing or wrong env in Vercel | Check `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `SESSION_SECRET`; ensure no placeholders. |

---

## Troubleshooting: Windows build (EISDIR readlink)

If `npm run build` fails with:

```text
Error: EISDIR: illegal operation on a directory, readlink '...\node_modules\next\dist\pages\_app.js'
```

this is a **Windows-specific** issue: Next.js expects a file but finds a directory (usually due to symlinks or filesystem).

**Fixes (try in order):**

1. **Move the project to the C: drive**  
   Copy the project to e.g. `C:\Projects\pililokal-dashboard` and run `npm install` and `npm run build` there. The C: drive is usually NTFS and handles symlinks correctly; other drives (e.g. F:) may be exFAT and cause this error.

2. **Ensure the project drive is NTFS**  
   In Command Prompt: `fsutil fsinfo volumeinfo F:` (replace `F:` with your drive). If it says exFAT or FAT32, either move the project to an NTFS drive or reformat the drive as NTFS (back up data first).

3. **Clean install with no symlinks**  
   In Command Prompt, from the project root:
   ```cmd
   rmdir /s /q node_modules
   npm install --no-bin-links
   npx prisma generate
   npm run build
   ```
   `--no-bin-links` makes npm copy files instead of creating symlinks, which can avoid the error on some setups.

4. **Full clean reinstall**  
   ```cmd
   rmdir /s /q node_modules
   del package-lock.json
   npm cache clean --force
   npm install
   npx prisma generate
   npm run build
   ```

**Note:** The build runs on **Vercel’s Linux servers**, so this only affects local builds on Windows. You can still deploy via Git; Vercel will build in the cloud.

---

You asked about moving to MongoDB because Supabase is hard to deploy. Here’s what that involves.

### Is the app “working” with Postgres?

Yes. The schema and app are built for PostgreSQL. The main deployment issues are usually:

- Using the wrong URL (direct vs pooler, or missing `pgbouncer=true`).
- Missing `DIRECT_URL` for migrations.

Fixing those (as in this guide) often makes Supabase work. Trying **Neon** or **Railway** first is usually easier than a full DB switch.

### What changing to MongoDB would require

1. **Prisma schema**
   - Change `provider` to `"mongodb"`.
   - Remove `directUrl`.
   - Keep `@id @default(cuid())` (Prisma supports cuid with MongoDB).
   - **Relations:** MongoDB in Prisma uses **embedded or referenced relations**; your current FKs (e.g. `uploadedById` → `User`) become references by ID. Syntax changes (e.g. `@relation(fields: [uploadedById], references: [id])` still works, but no real FK in DB).
   - **Indexes:** Same `@@index` ideas, but no foreign-key constraints in MongoDB.
   - **Cascades:** MongoDB doesn’t enforce cascade; you’d implement deletes in application code (e.g. delete `ActivityLog` when deleting `Merchant`).

2. **Code**
   - Most of your app uses Prisma Client; if the schema is updated and you keep the same model/field names, **queries can stay largely the same**. You’d need to:
     - Replace any raw SQL (e.g. in exports or reports) with Prisma or MongoDB queries.
     - Implement “cascade” deletes in server actions where you delete a Merchant/User.
   - No change to NextAuth/session logic if you still use the same `User` shape.

3. **Data migration**
   - Export from Postgres (CSV/JSON or Prisma reads) and import into MongoDB (scripts or Prisma createMany). One-time effort; plan for downtime or dual-write if needed.

4. **Hosting**
   - **MongoDB Atlas** has a free tier and is straightforward: create cluster, get connection string, set `DATABASE_URL` (no `DIRECT_URL`). No pgbouncer; fewer connection pitfalls on Vercel.

### Recommendation

- **First:** Fix Supabase/Neon using this guide (two URLs, pooler for app, direct for migrate). If you still find Supabase hard, try **Neon** or **Railway** before rewriting for MongoDB.
- **If you still want MongoDB:** Plan for:
  - Updating `schema.prisma` (provider, directUrl, relations/cascades).
  - A small amount of app code (raw SQL → Prisma/Mongo, cascade deletes).
  - One-time data migration and testing.

I can provide a **concrete MongoDB version of your `schema.prisma`** and a short migration checklist (step-by-step) if you decide to switch.

---

## Summary

- **Schema:** Audited; it’s valid and working. Set **DIRECT_URL** and use **pooled DATABASE_URL** with `?pgbouncer=true` for Supabase/Neon.
- **Deploy:** Use this guide for Supabase (or Neon/Railway), set env vars on Vercel, run schema once via SQL or Prisma migrate.
- **MongoDB:** Possible but requires schema change, some code changes, and data migration; try fixing Postgres deployment or switching to Neon/Railway first.
