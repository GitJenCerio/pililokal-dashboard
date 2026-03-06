# 🧠 PiliLokal Dashboard — Master Cursor Prompt Pack
> Copy-paste each prompt directly into Cursor. Run them in order for best results.
> Stack: **Next.js 14 App Router · TypeScript · Prisma · PostgreSQL · NextAuth · Tailwind · shadcn/ui**

---

## HOW TO USE THESE PROMPTS

1. Open your project in Cursor
2. Press `Cmd+K` (inline) or `Cmd+L` (chat panel)
3. Copy-paste the prompt under each section header
4. Cursor will apply changes — review diffs before accepting
5. Run `npm run build` after each batch to catch TypeScript errors

---

---

# ⚡ PHASE 1 — CRITICAL SECURITY FIXES
> Run these BEFORE deploying to dashboard.pililokal.com

---

## PROMPT 1A — Security Headers + Secure Cookies

```
You are working on a Next.js 14 App Router project called PiliLokal Dashboard.

TASK: Fix two critical security issues.

--- FIX 1: next.config.js ---
Replace the entire file with this:

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['xlsx'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self'",
              "connect-src 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: '/admin', destination: '/dashboard', permanent: false },
      { source: '/admin/:path*', destination: '/dashboard', permanent: false },
    ];
  },
};

module.exports = nextConfig;

--- FIX 2: src/app/login/action.ts ---
Find the cookieStore.set() call and add `secure: process.env.NODE_ENV === 'production'`:

cookieStore.set(SESSION_COOKIE, sealedValue, {
  path: '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: SESSION_MAX_AGE,
});

Apply both changes now.
```

---

## PROMPT 1B — Rate Limiting Middleware

```
You are working on a Next.js 14 App Router project called PiliLokal Dashboard.

TASK: Create src/middleware.ts to add rate limiting on the login endpoint.
This protects against brute-force attacks without needing any external package.

Create the file with this exact content:

import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter: 10 attempts per IP per 15 minutes
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

// Clean up old entries every 100 requests to prevent memory leak
let cleanupCounter = 0;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

export function middleware(req: NextRequest) {
  // Only rate-limit the credentials login endpoint
  if (req.nextUrl.pathname === '/api/auth/callback/credentials' && req.method === 'POST') {
    const ip = getClientIp(req);
    const now = Date.now();
    const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
    const MAX_ATTEMPTS = 10;

    // Cleanup stale entries periodically
    cleanupCounter++;
    if (cleanupCounter > 100) {
      cleanupCounter = 0;
      for (const [key, val] of loginAttempts.entries()) {
        if (now > val.resetAt) loginAttempts.delete(key);
      }
    }

    const entry = loginAttempts.get(ip);
    if (entry && now < entry.resetAt) {
      if (entry.count >= MAX_ATTEMPTS) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        return NextResponse.json(
          { error: 'Too many login attempts. Please try again later.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(retryAfter),
              'X-RateLimit-Limit': String(MAX_ATTEMPTS),
              'X-RateLimit-Remaining': '0',
            },
          }
        );
      }
      entry.count++;
    } else {
      loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/auth/:path*'],
};
```

---

## PROMPT 1C — Fix RBAC Gaps on All Mutations

```
You are working on a Next.js 14 App Router project called PiliLokal Dashboard.

TASK: Several server actions are missing role checks. Any logged-in VIEWER can currently
mutate data. Fix all of them now.

--- FILE: src/app/dashboard/merchants/actions.ts ---

In `saveMerchantAction`, add requireRole right after getServerSession:

  const session = await getServerSession();
  requireRole(session, 'EDITOR'); // ADD THIS - was missing

In `bulkUpdateStatusAction`, it already has requireRole('EDITOR') — leave it.

In `bulkDeleteAction`, it already has requireRole('ADMIN') — leave it.

--- FILE: src/app/dashboard/leads/actions.ts ---

Add requireRole to these functions that currently only check session existence:

1. `updateLeadAction` — add `requireRole(session, 'EDITOR');` after getServerSession()
2. `deleteLeadAction` — add `requireRole(session, 'EDITOR');` after getServerSession()
3. `updateLeadShopifyStatusAction` — add `requireRole(session, 'EDITOR');` after getServerSession()
4. `convertLeadToMerchantAction` — already has requireRole('EDITOR') — leave it.

--- FILE: src/app/api/export/merchants/route.ts ---

The export API only checks session existence. Add role check:

  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  // ADD THIS:
  if (!['ADMIN', 'EDITOR'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

Make sure `requireRole` is imported from '@/lib/permissions' in all files that need it.
Apply all changes now.
```

---

## PROMPT 1D — Google OAuth Security Restriction

```
You are working on a Next.js 14 App Router project called PiliLokal Dashboard.

TASK: The Google OAuth signIn callback currently auto-creates accounts for any Google user.
This is a security risk — only pre-invited users should be able to sign in.

In src/lib/auth-config.ts, update the signIn callback and the Google JWT handling:

1. In the `signIn` callback, replace the existing implementation with:

    async signIn({ account, profile }) {
      if (account?.provider === 'google') {
        const email = (profile?.email ?? '').toLowerCase();
        if (!email) return false;
        
        // Only allow users who already exist in DB (invited by admin)
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (!existingUser) return false;          // Block unknown Google accounts
        if (!existingUser.isActive) return false; // Block deactivated accounts
      }
      return true;
    },

2. In the `jwt` callback, find the Google provider block and remove the `prisma.user.create()`
   call — only read, never auto-create:

    if (account?.provider === 'google' && profile?.email) {
      const email = (profile.email as string).toLowerCase();
      const dbUser = await prisma.user.findUnique({ where: { email } });
      if (!dbUser || !dbUser.isActive) return token; // Silently reject
      token.userId = dbUser.id;
      token.email = dbUser.email;
      token.name = dbUser.name;
      token.role = dbUser.role;
      token.isActive = dbUser.isActive;
    }

Apply these changes now. Prisma is already imported in this file.
```

---

## PROMPT 1E — Switch Database to PostgreSQL

```
You are working on a Next.js 14 App Router project called PiliLokal Dashboard.

TASK: The project currently uses SQLite in schema.prisma but the .env.example references
PostgreSQL. SQLite cannot handle concurrent writes in production. Switch to PostgreSQL now.

1. In prisma/schema.prisma, change the datasource block:

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

2. The schema already uses String for fields that were SQLite-safe. For PostgreSQL,
   we can now optionally use native enums, but for now leave them as String to avoid
   a migration rewrite.

3. Add a compound index to the Lead model that's missing:

model Lead {
  // ... existing fields ...
  
  @@index([stage])
  @@index([country])
  @@index([stage, country])         // ADD THIS
  @@index([shopifyStatus])          // ADD THIS
  @@index([needsFollowup])          // ADD THIS
}

4. Add missing index to Merchant model:

model Merchant {
  // ... existing fields ...
  
  @@index([shopifyStatus])          // already exists
  @@index([category])               // already exists
  @@index([lastUpdatedAt])          // already exists
  @@index([selectionConfirmed])     // ADD THIS
}

After applying, run in terminal:
  npx prisma migrate dev --name switch-to-postgres
  npx prisma db seed

Note: Make sure DATABASE_URL in .env points to a real PostgreSQL instance before running.
```

---

---

# 🚀 PHASE 2 — SCALABILITY FIXES

---

## PROMPT 2A — Fix Bulk Update N+1 Query

```
You are working on a Next.js 14 App Router project called PiliLokal Dashboard.

TASK: In src/app/dashboard/merchants/actions.ts, the `bulkUpdateStatusAction` function
runs one database query per merchant in a loop (N+1 problem). For large datasets this
is very slow. Fix it to use a single updateMany query.

CURRENT CODE (bad):
  for (const id of ids) {
    await prisma.merchant.update({
      where: { id },
      data: { shopifyStatus: status, lastUpdatedById: session.userId },
    });
    await prisma.activityLog.create({ ... });
  }

REPLACE WITH:
  // Single query to update all merchants at once
  await prisma.merchant.updateMany({
    where: { id: { in: ids } },
    data: {
      shopifyStatus: status,
      lastUpdatedById: session.userId,
      lastUpdatedAt: new Date(),
    },
  });

  // Batch insert activity logs with createMany
  await prisma.activityLog.createMany({
    data: ids.map((id) => ({
      merchantId: id,
      userId: session.userId,
      type: 'STATUS_CHANGE',
      message: `Bulk status updated to ${status}`,
      createdAt: new Date(),
    })),
  });

Apply this change now.
```

---

## PROMPT 2B — Add Pagination to Merchant Dashboard

```
You are working on a Next.js 14 App Router project called PiliLokal Dashboard.

TASK: The dashboard page loads ALL merchants in a single query with no pagination.
This will degrade badly with 500+ records. Add server-side pagination.

1. In src/app/dashboard/page.tsx, update the searchParams type to include page:

  searchParams: Promise<{
    status?: string;
    submission?: string;
    selection?: string;
    attention?: string;
    q?: string;
    page?: string;   // ADD THIS
  }>

2. Add pagination logic to the merchant query:

  const PAGE_SIZE = 50;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const skip = (page - 1) * PAGE_SIZE;

  const [merchants, totalCount] = await Promise.all([
    prisma.merchant.findMany({
      skip,
      take: PAGE_SIZE,
      where: { /* existing filters */ },
      orderBy: { lastUpdatedAt: 'desc' },
      select: { /* existing select */ },
    }),
    prisma.merchant.count({ where: { /* same filters */ } }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

3. Pass pagination data to DashboardClient:
  <DashboardClient
    merchants={...}
    currentPage={page}
    totalPages={totalPages}
    totalCount={totalCount}
  />

4. In src/components/dashboard/dashboard-client.tsx, add pagination props and render
   a simple prev/next pagination bar at the bottom of the merchant table:

  // Add to props interface:
  currentPage: number;
  totalPages: number;
  totalCount: number;

  // Add pagination UI at bottom of table:
  <div className="flex items-center justify-between px-4 py-3 border-t">
    <p className="text-sm text-muted-foreground">
      Showing {(currentPage - 1) * 50 + 1}–{Math.min(currentPage * 50, totalCount)} of {totalCount}
    </p>
    <div className="flex gap-2">
      <a
        href={`?page=${currentPage - 1}`}
        className={cn("px-3 py-1 rounded border text-sm", currentPage <= 1 && "pointer-events-none opacity-50")}
      >
        Previous
      </a>
      <span className="px-3 py-1 text-sm">Page {currentPage} of {totalPages}</span>
      <a
        href={`?page=${currentPage + 1}`}
        className={cn("px-3 py-1 rounded border text-sm", currentPage >= totalPages && "pointer-events-none opacity-50")}
      >
        Next
      </a>
    </div>
  </div>

Apply all changes now. Preserve all existing filter logic.
```

---

## PROMPT 2C — Add Health Check Endpoint

```
You are working on a Next.js 14 App Router project called PiliLokal Dashboard.

TASK: Create a health check API endpoint at /api/health. This is required for:
- Vercel uptime monitoring
- Load balancer health checks
- Deployment verification

Create src/app/api/health/route.ts:

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();

  try {
    // Test DB connection with a lightweight query
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - startTime;

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: 'connected',
        latencyMs: dbLatencyMs,
      },
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version ?? 'unknown',
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: {
          status: 'disconnected',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 503 }
    );
  }
}

This endpoint is public (no auth required) — that's correct for health checks.
```

---

---

# 🧩 PHASE 3 — MISSING FEATURES

---

## PROMPT 3A — Forgot Password Flow

```
You are working on a Next.js 14 App Router project called PiliLokal Dashboard.

TASK: The User model already has passwordResetToken and passwordResetExpiry fields
but there is no forgot-password UI. Build the complete flow.

--- STEP 1: Create src/app/forgot-password/page.tsx ---

A simple page with an email input form. On submit it calls the server action below.
Show a success message regardless of whether email exists (prevent email enumeration).
Use the same login page visual style (centered card on white/gray bg).

--- STEP 2: Create src/app/forgot-password/action.ts ---

'use server';

import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';

export async function requestPasswordResetAction(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  if (!email) return { error: 'Email is required' };

  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to prevent email enumeration
  if (!user || !user.isActive) {
    return { success: true };
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: token, passwordResetExpiry: expiry },
  });

  await sendPasswordResetEmail({ to: email, name: user.name, token });

  return { success: true };
}

--- STEP 3: Create src/app/reset-password/page.tsx ---

Accepts a `?token=xxx` URL param. Shows a form with two password fields (new + confirm).
On submit calls the action below.

--- STEP 4: Create src/app/reset-password/action.ts ---

'use server';

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';

export async function resetPasswordAction(formData: FormData) {
  const token = formData.get('token') as string;
  const password = formData.get('password') as string;
  const confirm = formData.get('confirm') as string;

  if (!token || !password) return { error: 'Token and password are required' };
  if (password !== confirm) return { error: 'Passwords do not match' };
  if (password.length < 8) return { error: 'Password must be at least 8 characters' };

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpiry: { gt: new Date() },
    },
  });

  if (!user) return { error: 'Invalid or expired reset link. Please request a new one.' };

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiry: null,
    },
  });

  redirect('/?reset=success');
}

--- STEP 5: In src/lib/email.ts ---

Add this function alongside sendInviteEmail:

export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  token: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!resend) return { ok: false, error: 'RESEND_API_KEY not configured' };

  const resetUrl = `${APP_URL}/reset-password?token=${params.token}`;

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `Reset your ${APP_NAME} password`,
      html: `
        <p>Hi ${params.name},</p>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <p><a href="${resetUrl}" style="background:#1F618D;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;display:inline-block;">Reset Password</a></p>
        <p>If you didn't request this, ignore this email — your password will not change.</p>
        <p style="color:#888;font-size:12px;">Link: ${resetUrl}</p>
      `,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to send' };
  }
}

--- STEP 6: In src/app/page.tsx (login page) ---

Add a "Forgot password?" link below the password field:
<a href="/forgot-password" className="text-sm text-muted-foreground hover:underline">
  Forgot password?
</a>

Build all files now.
```

---

## PROMPT 3B — Change Password (Self-Service)

```
You are working on a Next.js 14 App Router project called PiliLokal Dashboard.

TASK: Users currently cannot change their own password. Add a change-password page
accessible from the dashboard header/user menu.

--- STEP 1: Create src/app/dashboard/settings/page.tsx ---

A settings page with a "Change Password" card containing:
- Current password field
- New password field (min 8 chars)
- Confirm new password field
- Submit button

Use the same card/form patterns as other dashboard pages.

--- STEP 2: Create src/app/dashboard/settings/action.ts ---

'use server';

import bcrypt from 'bcryptjs';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function changePasswordAction(formData: FormData) {
  const session = await getServerSession();
  if (!session) return { error: 'Unauthorized' };

  const current = formData.get('currentPassword') as string;
  const newPass = formData.get('newPassword') as string;
  const confirm = formData.get('confirmPassword') as string;

  if (!current || !newPass || !confirm) return { error: 'All fields are required' };
  if (newPass.length < 8) return { error: 'New password must be at least 8 characters' };
  if (newPass !== confirm) return { error: 'Passwords do not match' };
  if (current === newPass) return { error: 'New password must be different from current' };

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user?.passwordHash) return { error: 'Cannot change password for OAuth accounts' };

  const valid = await bcrypt.compare(current, user.passwordHash);
  if (!valid) return { error: 'Current password is incorrect' };

  const passwordHash = await bcrypt.hash(newPass, 12);
  await prisma.user.update({
    where: { id: session.userId },
    data: { passwordHash },
  });

  return { success: true };
}

--- STEP 3: Add Settings link to navigation ---

In src/components/layout/dashboard-nav.tsx, add a settings link to the links array:

{ href: '/dashboard/settings', label: 'Settings', icon: Settings, exact: true }

Import Settings from 'lucide-react'.

Build all files now.
```

---

## PROMPT 3C — Lead Export to Excel

```
You are working on a Next.js 14 App Router project called PiliLokal Dashboard.

TASK: The app can export merchants to Excel but leads have no export. Add a lead export
API route following the same pattern as /api/export/merchants.

--- STEP 1: Create src/app/api/export/leads/route.ts ---

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { requireRole } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  requireRole(session, 'EDITOR');

  const leads = await prisma.lead.findMany({
    orderBy: { importedAt: 'desc' },
    select: {
      merchantName: true,
      category: true,
      stage: true,
      email: true,
      contact: true,
      address: true,
      country: true,
      city: true,
      fb: true,
      ig: true,
      tiktok: true,
      website: true,
      socialScore: true,
      statusNotes: true,
      result: true,
      callsUpdate: true,
      needsFollowup: true,
      shopifyStatus: true,
      sourceSheet: true,
      encodedBy: true,
      importedAt: true,
    },
  });

  const rows = leads.map((l) => ({
    'Merchant Name': l.merchantName,
    Category: l.category,
    Stage: l.stage ?? '',
    Email: l.email ?? '',
    Contact: l.contact ?? '',
    Address: l.address ?? '',
    Country: l.country ?? '',
    City: l.city ?? '',
    Facebook: l.fb ?? '',
    Instagram: l.ig ?? '',
    TikTok: l.tiktok ?? '',
    Website: l.website ?? '',
    'Social Score': l.socialScore ?? 0,
    'Status Notes': l.statusNotes ?? '',
    Result: l.result ?? '',
    'Calls Update': l.callsUpdate ?? '',
    'Needs Followup': l.needsFollowup ? 'Yes' : 'No',
    'Shopify Status': l.shopifyStatus,
    'Source Sheet': l.sourceSheet,
    'Encoded By': l.encodedBy ?? '',
    'Imported At': l.importedAt.toISOString().slice(0, 10),
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Leads');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  const filename = `leads-export-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

--- STEP 2: Add Export button to leads pipeline page ---

In src/components/leads/leads-pipeline-client.tsx, add an Export button in the toolbar area:

async function handleExport() {
  const res = await fetch('/api/export/leads', { method: 'POST' });
  if (!res.ok) return;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `leads-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

Add a button that calls handleExport:
<Button variant="outline" onClick={handleExport}>
  <Download className="mr-2 h-4 w-4" />
  Export to Excel
</Button>

Import Download from 'lucide-react'.

Build all files now.
```

---

## PROMPT 3D — Activity Log Viewer UI

```
You are working on a Next.js 14 App Router project called PiliLokal Dashboard.

TASK: The ActivityLog table is being populated on every merchant/status update
but there's no UI to view it. Build an activity log page for admins.

--- STEP 1: Create src/app/dashboard/admin/activity/page.tsx ---

This is an ADMIN-only page showing a paginated list of all activity logs.

import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';
import { requireRole } from '@/lib/permissions';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; merchantId?: string; type?: string }>;
}) {
  const session = await getServerSession();
  requireRole(session, 'ADMIN');

  const params = await searchParams;
  const PAGE_SIZE = 50;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));

  const where = {
    ...(params.merchantId ? { merchantId: params.merchantId } : {}),
    ...(params.type ? { type: params.type } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { createdAt: 'desc' },
      include: {
        merchant: { select: { id: true, name: true } },
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.activityLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Activity Log</h1>
      <p className="text-muted-foreground mb-4">{total} total entries</p>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Merchant</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Message</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t hover:bg-muted/40">
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {log.createdAt.toISOString().replace('T', ' ').slice(0, 16)}
                </td>
                <td className="px-4 py-3">{log.user.name}</td>
                <td className="px-4 py-3">
                  <a
                    href={`/dashboard/merchants/${log.merchant.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {log.merchant.name}
                  </a>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-muted rounded text-xs font-mono">
                    {log.type}
                  </span>
                </td>
                <td className="px-4 py-3">{log.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          {page > 1 && <a href={`?page=${page - 1}`} className="px-3 py-1 border rounded text-sm">Previous</a>}
          {page < totalPages && <a href={`?page=${page + 1}`} className="px-3 py-1 border rounded text-sm">Next</a>}
        </div>
      </div>
    </div>
  );
}

--- STEP 2: Add Activity Log link to dashboard nav ---

In src/components/layout/dashboard-nav.tsx, add:
{ href: '/dashboard/admin/activity', label: 'Activity Log', icon: Clock, exact: false, adminOnly: true }

Import Clock from 'lucide-react'.

Build all files now.
```

---

## PROMPT 3E — Dashboard KPI Summary Cards

```
You are working on a Next.js 14 App Router project called PiliLokal Dashboard.

TASK: Add KPI summary cards at the top of the main dashboard page showing
merchant status counts at a glance.

--- STEP 1: In src/app/dashboard/page.tsx ---

Add a KPI query alongside existing queries:

const statusCounts = await prisma.merchant.groupBy({
  by: ['shopifyStatus'],
  _count: { id: true },
});

const kpis = {
  total: statusCounts.reduce((sum, s) => sum + s._count.id, 0),
  notStarted: statusCounts.find(s => s.shopifyStatus === 'NOT_STARTED')?._count.id ?? 0,
  inProgress: statusCounts.find(s => s.shopifyStatus === 'IN_PROGRESS')?._count.id ?? 0,
  uploaded: statusCounts.find(s => s.shopifyStatus === 'UPLOADED')?._count.id ?? 0,
  live: statusCounts.find(s => s.shopifyStatus === 'LIVE')?._count.id ?? 0,
};

Pass kpis to DashboardClient.

--- STEP 2: In src/components/dashboard/dashboard-client.tsx ---

Add kpis to the props interface. Render KPI cards at the top of the page using
the existing Card component from '@/components/ui/card':

<div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
  {[
    { label: 'Total Merchants', value: kpis.total, color: 'text-foreground' },
    { label: 'Not Started', value: kpis.notStarted, color: 'text-muted-foreground' },
    { label: 'In Progress', value: kpis.inProgress, color: 'text-yellow-600' },
    { label: 'Uploaded', value: kpis.uploaded, color: 'text-blue-600' },
    { label: 'Live', value: kpis.live, color: 'text-emerald-600' },
  ].map((kpi) => (
    <Card key={kpi.label} className="p-4">
      <p className="text-sm text-muted-foreground">{kpi.label}</p>
      <p className={`text-3xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
    </Card>
  ))}
</div>

Apply these changes now.
```

---

## PROMPT 3F — Merchant Notes / Activity Timeline UI

```
You are working on a Next.js 14 App Router project called PiliLokal Dashboard.

TASK: The merchant detail page shows a notes field but there is no visual history
of who changed what and when. The ActivityLog table already stores all changes.
Add a timeline panel to the merchant detail page.

In src/app/dashboard/merchants/[id]/page.tsx:

1. Fetch activity logs for this merchant:

const activityLogs = await prisma.activityLog.findMany({
  where: { merchantId: id },
  orderBy: { createdAt: 'desc' },
  take: 20,
  include: {
    user: { select: { name: true } },
  },
});

Pass activityLogs to MerchantDetail component.

2. In src/components/merchant/merchant-detail.tsx:

Add an activityLogs prop and render a timeline section at the bottom:

<div className="mt-8">
  <h3 className="text-lg font-semibold mb-4">Activity History</h3>
  <div className="relative border-l-2 border-muted ml-3 space-y-4">
    {activityLogs.map((log) => (
      <div key={log.id} className="relative pl-6">
        {/* Timeline dot */}
        <div className="absolute -left-[9px] top-1.5 h-3 w-3 rounded-full bg-primary border-2 border-background" />
        <div className="bg-muted/40 rounded-lg p-3">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
              {log.type}
            </span>
            <span className="text-xs text-muted-foreground">
              {log.createdAt.toLocaleDateString()} · {log.user.name}
            </span>
          </div>
          <p className="text-sm">{log.message}</p>
        </div>
      </div>
    ))}
    {activityLogs.length === 0 && (
      <p className="pl-6 text-sm text-muted-foreground">No activity recorded yet.</p>
    )}
  </div>
</div>

Apply all changes now.
```

---

---

# 🌐 PHASE 4 — SUBDOMAIN DEPLOYMENT CONFIG

---

## PROMPT 4A — Production Environment Validation

```
You are working on a Next.js 14 App Router project called PiliLokal Dashboard.

TASK: Add startup validation so the app immediately crashes with a helpful message
if required environment variables are not set properly in production.

Create src/lib/env-check.ts:

const REQUIRED_VARS = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'SESSION_SECRET',
] as const;

const PLACEHOLDER_VALUES = [
  'your-32-char-secret-here-change-in-production',
  'your-secret-here',
  'change-me',
  'localhost',
];

export function validateEnvironment(): void {
  if (process.env.NODE_ENV !== 'production') return; // Only validate in production

  const errors: string[] = [];

  for (const varName of REQUIRED_VARS) {
    const val = process.env[varName];
    if (!val) {
      errors.push(`Missing required environment variable: ${varName}`);
      continue;
    }
    if (PLACEHOLDER_VALUES.some((p) => val.includes(p))) {
      errors.push(`${varName} still has placeholder value — set a real value`);
    }
  }

  // Validate NEXTAUTH_URL points to HTTPS in production
  const authUrl = process.env.NEXTAUTH_URL ?? '';
  if (authUrl && !authUrl.startsWith('https://')) {
    errors.push('NEXTAUTH_URL must start with https:// in production');
  }

  // Validate secrets are long enough
  if ((process.env.NEXTAUTH_SECRET?.length ?? 0) < 32) {
    errors.push('NEXTAUTH_SECRET must be at least 32 characters');
  }
  if ((process.env.SESSION_SECRET?.length ?? 0) < 32) {
    errors.push('SESSION_SECRET must be at least 32 characters');
  }

  if (errors.length > 0) {
    console.error('\n❌ ENVIRONMENT VALIDATION FAILED:\n');
    errors.forEach((e) => console.error(`  • ${e}`));
    console.error('\nFix these issues before deploying.\n');
    process.exit(1);
  }

  console.log('✅ Environment validation passed');
}

Then import and call this in src/lib/db.ts at the top level (runs once on startup):

import { validateEnvironment } from './env-check';
validateEnvironment();

Apply these changes now.
```

---

## PROMPT 4B — Update .env.example for Subdomain Deployment

```
You are working on a Next.js 14 App Router project called PiliLokal Dashboard.

TASK: Update .env.example to reflect what's needed for deployment to
dashboard.pililokal.com. Add all missing variables with clear comments.

Replace .env.example entirely with:

# ─────────────────────────────────────────────────────────────────────────────
# PiliLokal Dashboard — Environment Variables
# Copy this file to .env.local for development
# Set all variables in your hosting provider's environment settings for production
# ─────────────────────────────────────────────────────────────────────────────

# ─── DATABASE ─────────────────────────────────────────────────────────────────
# Local development (SQLite):
# DATABASE_URL="file:./dev.db"
#
# Production (PostgreSQL — use Neon, Supabase, or Railway):
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/pililokal?schema=public"

# ─── NEXTAUTH ─────────────────────────────────────────────────────────────────
# CRITICAL: NEXTAUTH_URL must exactly match your deployed URL (no trailing slash)
# Development:
# NEXTAUTH_URL="http://localhost:3000"
# Production:
NEXTAUTH_URL="https://dashboard.pililokal.com"

# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=""

# ─── IRON-SESSION ─────────────────────────────────────────────────────────────
# Generate with: openssl rand -base64 32  (must be different from NEXTAUTH_SECRET)
SESSION_SECRET=""

# ─── GOOGLE OAUTH (optional) ──────────────────────────────────────────────────
# Create at: https://console.cloud.google.com/apis/credentials
# Authorized redirect URI: https://dashboard.pililokal.com/api/auth/callback/google
# GOOGLE_CLIENT_ID=""
# GOOGLE_CLIENT_SECRET=""

# ─── EMAIL (Resend) ───────────────────────────────────────────────────────────
# Get key at: https://resend.com
# Verify your sending domain (pililokal.com) in Resend dashboard first
# RESEND_API_KEY="re_xxxx"
# FROM_EMAIL="no-reply@pililokal.com"
# APP_NAME="Pililokal Dashboard"

Apply this change now.
```

---

## PROMPT 4C — Add vercel.json for Subdomain Deploy

```
You are working on a Next.js 14 App Router project called PiliLokal Dashboard.

TASK: Create a vercel.json configuration file to optimize deployment to Vercel
for the dashboard.pililokal.com subdomain.

Create vercel.json in the project root:

{
  "framework": "nextjs",
  "buildCommand": "npx prisma generate && npm run build",
  "installCommand": "npm install",
  "regions": ["sin1"],
  "env": {
    "NEXTAUTH_URL": "https://dashboard.pililokal.com"
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store, no-cache, must-revalidate" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Robots-Tag", "value": "noindex, nofollow" }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/admin",
      "destination": "/dashboard",
      "permanent": false
    }
  ]
}

Notes on this config:
- regions: "sin1" = Singapore (closest to Philippines) — change to "iad1" for US-East
- X-Robots-Tag noindex keeps the internal dashboard out of Google search results
- Cache-Control no-store on API routes prevents stale data on CDN edge

Apply this change now.
```

---

---

# 🧹 PHASE 5 — CODE QUALITY & CLEANUP

---

## PROMPT 5A — Consolidate Dual Auth System

```
You are working on a Next.js 14 App Router project called PiliLokal Dashboard.

TASK: The project has a dual auth system — both iron-session (src/lib/session.ts)
and next-auth are used. The login/action.ts uses iron-session but the dashboard
uses next-auth. This inconsistency is confusing and error-prone.

Decide to keep ONLY next-auth as the auth source of truth.
Iron-session is still used for the cookie creation in login/action.ts — that's OK.
But remove any duplicate/conflicting auth logic.

1. In src/app/login/action.ts:
   - Keep the existing loginAction as-is — it uses iron-session for the cookie.
   - This is fine since it just seals a userId into a cookie.

2. In src/lib/auth.ts:
   - The getServerSession() already wraps next-auth. This is the source of truth.
   - Make sure every server action and API route uses THIS function, not any custom session reading.

3. Audit all files that read session data. Make sure they all use:
   import { getServerSession } from '@/lib/auth';
   
   NOT iron-session's unsealSession directly.

4. In src/lib/session.ts — keep the file but add a comment:
   // Note: sealSession/unsealSession used only in login/action.ts for cookie creation.
   // All session READING is done via next-auth getServerSession() in src/lib/auth.ts.

5. Run a search for any file that calls unsealSession() directly in a request handler
   and replace those calls with getServerSession() from auth.ts.

Apply these changes now.
```

---

## PROMPT 5B — Add Error Boundary & Friendly Error Pages

```
You are working on a Next.js 14 App Router project called PiliLokal Dashboard.

TASK: Add proper error handling so the dashboard doesn't show raw error stacks
to users in production.

--- STEP 1: Create src/app/error.tsx (global error boundary) ---

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to your error tracking service here (e.g., Sentry)
    console.error('[Global Error]', error.digest, error.message);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-destructive mb-4">Something went wrong</h1>
        <p className="text-muted-foreground mb-6">
          An unexpected error occurred. Please try again, or contact your admin if the issue persists.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground mb-4 font-mono">Error ID: {error.digest}</p>
        )}
        <Button onClick={reset}>Try Again</Button>
      </div>
    </div>
  );
}

--- STEP 2: Create src/app/not-found.tsx ---

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-muted-foreground mb-4">404</h1>
        <h2 className="text-xl font-semibold mb-2">Page Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The page you are looking for does not exist.
        </p>
        <Button asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

--- STEP 3: Create src/app/dashboard/error.tsx ---

'use client';

import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-semibold mb-2">Failed to load this section</h2>
      <p className="text-muted-foreground mb-4">
        {process.env.NODE_ENV === 'development' ? error.message : 'Please try again.'}
      </p>
      <Button onClick={reset} variant="outline">Retry</Button>
    </div>
  );
}

Build all three files now.
```

---

---

# ✅ FINAL VERIFICATION PROMPT

---

## PROMPT 6 — Pre-Deploy Checklist & TypeScript Check

```
You are working on a Next.js 14 App Router project called PiliLokal Dashboard.

TASK: Run a final pre-deployment audit. Check the following and fix any issues found:

1. TYPESCRIPT: Run a type check and fix any errors:
   npx tsc --noEmit

2. CHECK that these environment variables are referenced correctly in all files:
   - NEXTAUTH_URL — used in auth-config.ts and email.ts
   - NEXTAUTH_SECRET — used in auth-config.ts
   - SESSION_SECRET — used in session.ts
   - DATABASE_URL — used in prisma/schema.prisma

3. CHECK that src/middleware.ts exists and exports a config matcher.

4. CHECK that next.config.js includes the headers() function with security headers.

5. CHECK that login/action.ts has `secure: process.env.NODE_ENV === 'production'`
   on the cookie.set() call.

6. CHECK that vercel.json exists in the project root.

7. CHECK that the Prisma schema provider is "postgresql" (not "sqlite").

8. CHECK that requireRole() is called in:
   - saveMerchantAction (merchants/actions.ts)
   - deleteLeadAction (leads/actions.ts)
   - updateLeadAction (leads/actions.ts)
   - updateLeadShopifyStatusAction (leads/actions.ts)

9. Run ESLint and fix any errors:
   npm run lint

10. Verify the build succeeds:
    npm run build

Report all issues found and fix them.
```

---

---

## 📋 QUICK REFERENCE — ALL PROMPTS IN ORDER

| # | Prompt | Category | Priority |
|---|--------|----------|----------|
| 1A | Security Headers + Secure Cookies | Security | 🔴 Critical |
| 1B | Rate Limiting Middleware | Security | 🔴 Critical |
| 1C | Fix RBAC Gaps on All Mutations | Security | 🔴 Critical |
| 1D | Google OAuth Restriction | Security | 🔴 Critical |
| 1E | Switch to PostgreSQL | Database | 🔴 Critical |
| 2A | Fix Bulk Update N+1 Query | Performance | 🟠 High |
| 2B | Add Pagination | Performance | 🟠 High |
| 2C | Health Check Endpoint | Ops | 🟠 High |
| 3A | Forgot Password Flow | Feature | 🟠 High |
| 3B | Change Password (Self-Service) | Feature | 🟠 High |
| 3C | Lead Export to Excel | Feature | 🟠 High |
| 3D | Activity Log Viewer UI | Feature | 🟡 Medium |
| 3E | Dashboard KPI Cards | Feature | 🟡 Medium |
| 3F | Merchant Notes Timeline | Feature | 🟡 Medium |
| 4A | Env Validation on Startup | DevOps | 🟠 High |
| 4B | Update .env.example | DevOps | 🟠 High |
| 4C | vercel.json for Subdomain | DevOps | 🟠 High |
| 5A | Consolidate Dual Auth | Cleanup | 🟡 Medium |
| 5B | Error Boundaries | UX | 🟡 Medium |
| 6 | Final Verification | QA | 🔴 Before Deploy |

---

*Generated from Full System Audit · February 2026 · PiliLokal Dashboard v0.1.0*
