# Pililokal Dashboard — Full Technical Audit & Feature Roadmap

> Version 1.0 · February 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture & Code Quality Audit](#2-architecture--code-quality-audit)
3. [User Management — Current State & Plan](#3-user-management--current-state--plan)
4. [Missing Features & Recommendations](#4-missing-features--recommendations)
5. [Cursor Implementation Prompts](#5-cursor-implementation-prompts)
6. [Deployment Guide](#6-deployment-guide)
7. [Appendix — Quick Reference](#7-appendix--quick-reference)

---

## 1. Executive Summary

The Pililokal Dashboard is a Next.js 14 (App Router) internal operations tool built to manage merchant onboarding onto a US-based Shopify store and track a leads pipeline imported from Excel. The stack is TypeScript, Tailwind CSS, Prisma ORM, shadcn/ui components, and SQLite/PostgreSQL.

This audit covers architecture quality, security posture, missing features, and a prioritised roadmap with ready-to-use Cursor prompts for implementation.

| Category | Score | Notes |
|---|---|---|
| Architecture & Code Quality | 7 / 10 | Clean separation; minor issues |
| **Security** | **4 / 10** | **Critical auth vulnerabilities** |
| Feature Completeness | 5 / 10 | Core flows present; gaps in UX |
| **User Management** | **2 / 10** | **Single hardcoded admin only** |
| Observability & Ops | 2 / 10 | No logging, metrics, or health checks |
| Documentation | 6 / 10 | Good README; no inline JSDoc |

---

## 2. Architecture & Code Quality Audit

### 2.1 Strengths

- Next.js 14 App Router with proper server/client component separation
- Prisma ORM with type-safe DB access — clean schema, cascade deletes, and `@updatedAt`
- Activity log pattern on the `Merchant` model enables a full audit trail
- Server Actions with session validation on every mutation
- shadcn/ui + Tailwind design system — consistent component library
- Recharts for analytics with correct server/client boundary split
- Excel import pipeline via `xlsx` library with sheet-based lead parsing

### 2.2 Issues Found

| Severity | Area | Issue | Recommendation |
|---|---|---|---|
| 🔴 HIGH | Auth | Session cookie stores `userId` as plain JSON without signing or encryption | Use `iron-session` or JWT (HS256) to sign/encrypt session data |
| 🔴 HIGH | Auth | No CSRF protection on Server Actions — any site can trigger mutations | Add CSRF token validation or use Next.js built-in form tokens |
| 🔴 HIGH | Auth | No role/permission system — all logged-in users have full admin access | Add `role` field to User model (`ADMIN`, `EDITOR`, `VIEWER`) |
| 🔴 HIGH | Security | `bcryptjs` salting rounds default to 10 in seed; production should be 12+ | Set rounds to 12 in all `bcrypt.hash` calls |
| 🟡 MEDIUM | Auth | Password reset flow is absent — no forgot-password route | Implement email-based reset with time-limited tokens |
| 🟡 MEDIUM | Schema | Prisma provider is `sqlite` in `schema.prisma` but `.env.example` uses PostgreSQL — mismatch | Align schema provider with production target; use migrations not `db push` |
| 🟡 MEDIUM | Schema | No DB indexes on frequently filtered fields (`shopifyStatus`, `category`, `stage`) | Add `@@index` on `Merchant` and `Lead` models |
| 🟡 MEDIUM | UX | No pagination on merchant table — all records fetched in a single query | Implement cursor-based pagination or virtual scrolling |
| 🟡 MEDIUM | UX | Lead import is destructive — re-importing truncates and replaces all leads | Add upsert logic keyed on `merchantName + sourceSheet` |
| 🟢 LOW | Perf | `prisma.merchant.findMany` includes all columns + relations with no `select` on dashboard | Use `select` to fetch only needed columns on list views |
| 🟢 LOW | Code | `leads-data.ts` reads Excel from filesystem at request time — no caching | Cache parsed Excel data in-memory or preprocess into DB on import |
| 🟢 LOW | UX | Sidebar active state is not highlighted — all nav links look identical | Use `usePathname()` to apply active class to current route |
| ℹ️ INFO | DX | No Prettier config, only ESLint — inconsistent formatting possible | Add Prettier with `eslint-config-prettier` |
| ℹ️ INFO | DX | `prisma/seed.ts` only seeds admin user — no sample merchants for dev | Add 5–10 sample merchants to seed for faster local dev |

---

## 3. User Management — Current State & Plan

### 3.1 Current State

The `User` model exists in the Prisma schema with `id`, `name`, `email`, `passwordHash`, and `createdAt` fields, and activity logs reference users. However:

- There is **no admin UI** to list, create, edit, or delete users
- There is **no role or permission system** — any valid session grants full access
- The only way to create a user is via the Prisma seed script or direct DB access
- There is **no password reset** or change-password flow
- There is **no email verification** on signup
- Session management is manual cookie-based JSON — not cryptographically signed

### 3.2 Required Schema Changes

Add the following fields to the `User` model in `prisma/schema.prisma`:

| Field | Type | Purpose |
|---|---|---|
| `role` | `String @default("VIEWER")` | `ADMIN \| EDITOR \| VIEWER` permission tiers |
| `isActive` | `Boolean @default(true)` | Soft-disable users without deleting history |
| `passwordResetToken` | `String? @unique` | Time-limited reset token for forgot-password flow |
| `passwordResetExpiry` | `DateTime?` | Expiry for reset token (recommend 1 hour) |
| `lastLoginAt` | `DateTime?` | Track last successful login for security auditing |
| `invitedById` | `String?` (FK → User) | Track who invited the user |

### 3.3 Permissions Matrix

| Action | ADMIN | EDITOR | VIEWER |
|---|:---:|:---:|:---:|
| View dashboard & merchants | ✅ | ✅ | ✅ |
| Add / edit merchants | ✅ | ✅ | ❌ |
| Delete merchants | ✅ | ❌ | ❌ |
| Import leads from Excel | ✅ | ✅ | ❌ |
| Update lead/merchant status | ✅ | ✅ | ❌ |
| Add notes | ✅ | ✅ | ❌ |
| View Shopify Updates | ✅ | ✅ | ✅ |
| Manage users (create/edit/deactivate) | ✅ | ❌ | ❌ |
| Change any user's password | ✅ | ❌ | ❌ |
| View activity logs | ✅ | ✅ | ❌ |
| Export data | ✅ | ✅ | ❌ |

---

## 4. Missing Features & Recommendations

### 4.1 Feature Roadmap

| Feature | Priority | Effort | Description |
|---|---|---|---|
| User Management UI | 🔴 Critical | M | Full CRUD UI at `/dashboard/admin/users` — list users, invite via email, set roles, deactivate, reset password |
| Role-Based Access Control | 🔴 Critical | M | Middleware + server action guards based on `user.role` — prevent EDITOR/VIEWER from destructive operations |
| Signed Session / JWT | 🔴 Critical | S | Replace plain JSON cookie with `iron-session` or next-auth JWT to prevent session tampering |
| Password Reset Flow | 🟠 High | M | Forgot password → email token → reset password page with expiry validation |
| Merchant Bulk Actions | 🟠 High | M | Checkbox selection on merchant table → bulk status update, bulk delete, bulk export to CSV/Excel |
| CSV / Excel Export | 🟠 High | S | Export filtered merchant or leads table to `.xlsx` using the existing `xlsx` dependency |
| Pagination & Virtual Scroll | 🟠 High | M | Replace full-table fetches with cursor-based pagination (page size 25/50/100) |
| Merchant Delete | 🟠 High | S | Add delete button with confirmation dialog on merchant detail page |
| Notification / Alert System | 🟠 High | L | In-app alerts for merchants stuck in IN_PROGRESS >7 days, leads needing followup, etc. |
| Audit Log UI | 🟡 Medium | S | Dedicated `/dashboard/admin/audit` page showing activity log across all merchants with search/filter |
| DB Indexes | 🟡 Medium | S | Add `@@index` to `Merchant(shopifyStatus, category)` and `Lead(stage, country)` |
| Search Improvements | 🟡 Medium | M | Full-text search across merchant name, contact, email, notes using Prisma `contains` with case-insensitive mode |
| Merchant Merge / Duplicate Detection | 🟡 Medium | L | Flag duplicate merchant names on create; allow merging two merchant records |
| Leads → Merchant Conversion | 🟡 Medium | M | One-click "Convert Lead to Merchant" button that pre-fills the merchant create form |
| Dashboard Analytics Charts | 🟡 Medium | M | Add time-series chart of merchants promoted week-over-week; category breakdown pie chart |
| Shopify Webhook / API Sync | 🔵 Low | L | Poll or receive Shopify webhooks to auto-update `shopifyStatus` when products go live |
| Email Notifications | 🔵 Low | L | Send email digest to team when merchants reach LIVE status or leads are uncontacted >3 days |
| Mobile Responsiveness | 🔵 Low | S | Sidebar collapses to hamburger on mobile; tables become card views below `sm` breakpoint |
| Dark Mode | 🔵 Low | S | Toggle dark/light mode using `next-themes` + Tailwind `dark:` utilities |
| Two-Factor Authentication | 🔵 Low | L | TOTP-based 2FA for admin accounts using `otplib` |

> **Effort key:** S = Small (< 1 day) · M = Medium (1–3 days) · L = Large (3+ days)

---

## 5. Cursor Implementation Prompts

Use these prompts directly in Cursor AI. Each is self-contained and references the relevant files.

---

### PROMPT 1 — Signed Sessions & Auth Security

```
You are working on the Pililokal Dashboard (Next.js 14, TypeScript, Prisma, shadcn/ui).
The current session system in src/lib/auth.ts stores plain JSON { userId } in a cookie — this is insecure.

TASK: Replace the session cookie with iron-session.

1. Run: npm install iron-session
2. Create src/lib/session.ts with IronSessionData type { userId: string }, seal/unseal helpers
   using a SESSION_SECRET env var.
3. Update getServerSession(), createSessionCookie(), and logout() in src/lib/auth.ts
   to use iron-session's getIronSession().
4. Update src/app/login/action.ts and src/app/logout/action.ts to use the new session helpers.
5. Add SESSION_SECRET="<32-char-random-string>" to .env.example.
6. Also increase bcrypt rounds from 10 to 12 in prisma/seed.ts and anywhere bcrypt.hash is called.

Preserve all TypeScript types. Do not change any other files.
```

---

### PROMPT 2 — User Management: Schema + Server Actions

```
You are working on the Pililokal Dashboard (Next.js 14, TypeScript, Prisma SQLite/PostgreSQL).

TASK: Extend the User model and create user management server actions.

1. In prisma/schema.prisma, add these fields to the User model:
   - role                String    @default("VIEWER")   // ADMIN | EDITOR | VIEWER
   - isActive            Boolean   @default(true)
   - lastLoginAt         DateTime?
   - passwordResetToken  String?   @unique
   - passwordResetExpiry DateTime?

2. Run: npx prisma db push && npx prisma generate

3. Create src/app/dashboard/admin/users/actions.ts with these server actions
   (all require ADMIN role check via getServerSession):
   - listUsersAction(): returns all users (id, name, email, role, isActive, lastLoginAt, createdAt)
   - createUserAction(data: { name, email, role }): creates user with temp password, returns tempPassword
   - updateUserRoleAction(userId, role): updates role
   - toggleUserActiveAction(userId): flips isActive
   - resetUserPasswordAction(userId): generates 16-char random password, hashes it, saves, returns
     plaintext for admin to share

4. Create src/lib/permissions.ts with:
   - requireRole(session, minRole) that throws if session.role is insufficient
   - ROLE_HIERARCHY = { ADMIN: 3, EDITOR: 2, VIEWER: 1 }

5. Update getServerSession() in src/lib/auth.ts to include role and isActive;
   reject login if isActive is false.

All types must be exported. Use Prisma transactions where applicable.
```

---

### PROMPT 3 — User Management: Admin UI

```
You are working on the Pililokal Dashboard (Next.js 14, TypeScript, Tailwind, shadcn/ui).
The user management server actions are already implemented in src/app/dashboard/admin/users/actions.ts.

TASK: Build the User Management admin page at /dashboard/admin/users.

1. Create src/app/dashboard/admin/users/page.tsx (server component):
   - Fetches users via listUsersAction
   - Redirects to /dashboard if session role !== ADMIN
   - Passes users to client component

2. Create src/components/admin/users-table.tsx (client component):
   - Table with columns: Name, Email, Role, Status (badge), Last Login, Actions
   - Actions: dropdown with "Change Role", "Toggle Active/Inactive", "Reset Password"
   - "Invite User" button opens a dialog (name, email, role select)
   - Show success toast with temp password after invite or reset

3. Add a "Users" nav link to src/components/layout/dashboard-layout.tsx
   (only shown when user.role === ADMIN).

4. Use existing shadcn/ui components: Table, Badge, Dialog, DropdownMenu, Select, Button.

5. Role badge colors: ADMIN = blue, EDITOR = yellow, VIEWER = gray.
   Status: Active = green badge, Inactive = red badge.

All mutations call the existing server actions.
Revalidate /dashboard/admin/users after each mutation.
```

---

### PROMPT 4 — Merchant Bulk Actions & CSV Export

```
You are working on the Pililokal Dashboard (Next.js 14, TypeScript, Tailwind, shadcn/ui, Prisma).
Merchants are displayed in a table inside src/components/dashboard/dashboard-client.tsx.

TASK: Add bulk selection and CSV/Excel export to the merchant table.

1. In src/components/dashboard/dashboard-client.tsx:
   - Add a checkbox column as the first column
   - Add a "Select All" master checkbox in the header
   - Track selectedIds in useState<Set<string>>
   - Show a fixed bottom bulk action toolbar when selectedIds.size > 0 with:
     a) "Update Status" dropdown (NOT_STARTED | IN_PROGRESS | UPLOADED | LIVE)
     b) "Export Selected" button
     c) "Delete Selected" button (ADMIN only, with confirmation dialog)
     d) "{n} selected" count display

2. Add to src/app/dashboard/merchants/actions.ts:
   - bulkUpdateStatusAction(ids: string[], status: ShopifyStatus):
     batch prisma update + activity log per merchant
   - bulkDeleteAction(ids: string[]): requires ADMIN role; cascades delete

3. Create src/lib/export.ts:
   - exportMerchantsToExcel(merchants): uses the existing xlsx dependency to generate
     a workbook with columns: Name, Category, Status, Contact, Email, Phone, Completion%, Last Updated
   - Returns a Buffer

4. Add GET route src/app/api/export/merchants/route.ts that calls exportMerchantsToExcel
   and streams the file as application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.

5. The "Export Selected" button POSTs the selected IDs and triggers a file download.

Preserve existing filter and sort state when toggling checkboxes.
```

---

### PROMPT 5 — Pagination & Performance

```
You are working on the Pililokal Dashboard (Next.js 14, TypeScript, Prisma).
Currently src/app/dashboard/page.tsx fetches ALL merchants with prisma.merchant.findMany() —
this won't scale.

TASK: Implement cursor-based pagination on the merchant dashboard.

1. Update src/app/dashboard/page.tsx:
   - Accept cursor and pageSize (default 25) from searchParams
   - Use prisma.merchant.findMany({
       take: pageSize + 1,
       skip: cursor ? 1 : 0,
       cursor: cursor ? { id: cursor } : undefined,
       orderBy: { lastUpdatedAt: 'desc' }
     })
   - If results.length > pageSize, there is a next page; slice to pageSize and set
     nextCursor = last item id
   - Pass { merchants, nextCursor, total } to DashboardClient

2. Update src/components/dashboard/dashboard-client.tsx:
   - Add "Previous" / "Next" pagination controls below the table
   - Show "Showing X–Y of Z merchants"
   - Update URL params (cursor=...) via useRouter push to enable back-button support

3. Add DB indexes to prisma/schema.prisma:
   On Merchant model:
     @@index([shopifyStatus])
     @@index([category])
     @@index([lastUpdatedAt])
   On Lead model:
     @@index([stage])
     @@index([country])

4. In src/app/dashboard/page.tsx, replace the full merchant select with a minimal
   select() that only fetches columns needed for the table view (exclude notes and
   large text fields).

Run npx prisma db push after schema changes.
```

---

### PROMPT 6 — Lead→Merchant Conversion + Sidebar Active State

```
You are working on the Pililokal Dashboard (Next.js 14, TypeScript, Tailwind, shadcn/ui).

TASK 1 — Fix sidebar active state in src/components/layout/dashboard-layout.tsx:
1. Convert the Layout to a client component or extract a NavLink client sub-component.
2. Use usePathname() from next/navigation to detect the current route.
3. Apply "bg-accent text-accent-foreground font-semibold" to the nav link whose href
   matches the current pathname (use pathname.startsWith(href) for nested routes,
   exact match for /dashboard).

TASK 2 — Add "Convert to Merchant" flow from the Leads Pipeline:
1. In the leads detail panel, add a "Convert to Merchant" button visible when
   a lead's stage is "Confirmed" or "Interested".

2. Create convertLeadToMerchantAction(leadId: string) in src/app/dashboard/leads/actions.ts:
   - Fetch the lead by ID from the DB
   - Create a new Merchant with pre-filled fields:
       name = merchantName, category, email, phone = contact,
       sourceFacebook = fb, sourceInstagram = ig, sourceWebsite = website,
       notes = statusNotes
   - Log activity on the new merchant: "Converted from Lead [leadId]"
   - Set lead.stage = "Converted" (add this stage if not present)
   - Revalidate /dashboard and /dashboard/leads
   - Return { redirect: `/dashboard/merchants/${newId}` }

3. The button should show a loading state and redirect on success.
```

---

## 6. Deployment Guide

### 6.1 Prerequisites

- Node.js 18+ (LTS recommended — Node 20 or 22)
- PostgreSQL 15+ (Supabase, Neon, Railway, or self-hosted)
- A hosting platform: Vercel (recommended), Railway, Render, or a VPS
- npm or pnpm
- Git repository (GitHub, GitLab, or Bitbucket)

### 6.2 Environment Variables

Create a `.env` file in the project root (never commit this file):

| Variable | Description / Example |
|---|---|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/pililokal?schema=public` |
| `SESSION_SECRET` | 32+ character random string — generate with: `openssl rand -base64 32` |
| `NODE_ENV` | `production` |
| `NEXTAUTH_URL` | `https://your-domain.com` |

### 6.3 Database Setup

**Step 1 — Create the PostgreSQL database:**

- **Supabase:** Create new project → Settings → Database → copy "Connection string (URI)"
- **Neon:** New project → Connection Details → copy the pooled connection string
- **Railway:** Add PostgreSQL plugin → copy `DATABASE_URL` from the plugin's Variables tab
- **Self-hosted:**
  ```sql
  CREATE DATABASE pililokal;
  CREATE USER pililokal_user WITH PASSWORD 'your_password';
  GRANT ALL PRIVILEGES ON DATABASE pililokal TO pililokal_user;
  ```

**Step 2 — Update `prisma/schema.prisma` if still set to sqlite:**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Step 3 — Apply schema and seed:**

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 6.4 Deploy on Vercel (Recommended)

Vercel is the best-supported platform for Next.js App Router with Server Actions.

1. Push your code to a GitHub/GitLab repository
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. In "Environment Variables", add `DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV=production`
4. Framework Preset: **Next.js** (auto-detected)
5. Add a `postinstall` script to `package.json` so Prisma client generates at build time:
   ```json
   "scripts": {
     "postinstall": "prisma generate"
   }
   ```
6. Deploy. After first deploy, apply the DB schema:
   ```bash
   npx vercel env pull .env.local
   npx prisma db push
   npx prisma db seed
   ```
7. Set a custom domain in Vercel Dashboard → Domains

### 6.5 Deploy on Railway

1. Create new Railway project → Add Service → connect GitHub repo
2. Add a **PostgreSQL** plugin to the same project — Railway auto-injects `DATABASE_URL`
3. Add `SESSION_SECRET` and `NODE_ENV=production` as variables
4. Railway auto-detects Next.js and runs `npm build` + `npm start`
5. Set the **Start Command** to run migrations automatically on deploy:
   ```
   npx prisma db push && npm start
   ```

### 6.6 Deploy on a VPS (Ubuntu)

```bash
# Install Node 20 via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 20

# Clone and install
git clone https://github.com/your-org/pililokal-dashboard.git /app/pililokal
cd /app/pililokal
npm ci

# Create .env
cp .env.example .env
nano .env  # Fill in DATABASE_URL and SESSION_SECRET

# Build
npx prisma generate
npx prisma db push
npx prisma db seed
npm run build

# Run with PM2
npm install -g pm2
pm2 start npm --name pililokal -- start
pm2 startup
pm2 save
```

**Nginx reverse proxy config** (`/etc/nginx/sites-available/pililokal`):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/pililokal /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Add HTTPS via Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 6.7 Post-Deployment Checklist

- [ ] Change default admin password (`admin@pililokal.com` / `admin123`)
- [ ] Verify `DATABASE_URL` points to production PostgreSQL (not SQLite)
- [ ] `SESSION_SECRET` is 32+ chars and unique to production
- [ ] HTTPS is enabled (SSL certificate via Let's Encrypt or hosting provider)
- [ ] `prisma db push` has run successfully on production DB
- [ ] Prisma seed has run — verify admin user exists
- [ ] Test login and logout flow end-to-end
- [ ] Test creating a merchant end-to-end
- [ ] Test importing leads from Excel
- [ ] Set up DB backups (daily snapshot minimum)
- [ ] Add error monitoring (Sentry — free tier available: `npm install @sentry/nextjs`)
- [ ] Remove `Pililokal_Merchants_Cleaned.xlsx` from repo root before pushing to any public repo

---

## 7. Appendix — Quick Reference

### 7.1 Key Files

| File | Purpose |
|---|---|
| `prisma/schema.prisma` | Database schema — User, Merchant, Lead, ActivityLog models |
| `src/lib/auth.ts` | Session management — login, getServerSession, createSessionCookie |
| `src/lib/db.ts` | Prisma client singleton |
| `src/lib/types.ts` | Shared TypeScript types (ShopifyStatus, SubmissionType, etc.) |
| `src/lib/merchant-utils.ts` | computeCompletionPercent, isAddressComplete, needsAttention |
| `src/lib/leads-data.ts` | Excel parsing logic (reads Pililokal_Merchants_Cleaned.xlsx) |
| `src/lib/leads-db.ts` | importLeadsToDb, updateLeadInDb functions |
| `src/app/dashboard/page.tsx` | Main dashboard — KPIs, merchant table, needs-attention list |
| `src/app/dashboard/merchants/actions.ts` | saveMerchantAction server action |
| `src/app/dashboard/leads/actions.ts` | importLeadsFromExcelAction, updateLeadAction |
| `src/components/layout/dashboard-layout.tsx` | Sidebar navigation + header |
| `prisma/seed.ts` | Creates default admin user |

### 7.2 npm Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on http://localhost:3000 |
| `npm run build` | Production build |
| `npm start` | Start production server (requires build first) |
| `npm run db:generate` | Regenerate Prisma client after schema changes |
| `npm run db:push` | Push schema changes to DB (no migration history) |
| `npm run db:migrate` | Create and apply a named migration (use in production) |
| `npm run db:seed` | Seed default admin user |
| `npm run lint` | Run ESLint |

### 7.3 Default Credentials (Change Immediately in Production)

| Field | Value |
|---|---|
| Email | `admin@pililokal.com` |
| Password | `admin123` |

---

*End of Audit Report — Pililokal Dashboard v1.0*
