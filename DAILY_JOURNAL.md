# Pililokal Dashboard — Daily Journal

Generated from chats and git commits.

---

## Journal table

| DATE | JOURNAL ENTRY | TASKS / ACTIVITIES PERFORMED | SKILLS APPLIED / DEVELOPED | CHALLENGES ENCOUNTERED & RESOLUTION | OVERALL INSIGHTS / REFLECTION |
|------|----------------|------------------------------|-----------------------------|--------------------------------------|----------------------------------|
| **2026-02-19** | Initial project setup | Initial commit: Pililokal Dashboard; project scaffolding. | Next.js 14, Prisma, TypeScript, repo setup. | Had to choose between SQLite and Postgres; decided on Postgres for production. Figuring out the App Router structure in Next.js took some time. | Today I started the project and set up the repo. I'm excited to build an ops dashboard and see how Next.js and Prisma fit together. |
| **2026-02-20** | Config and lead updates | Updated PostgreSQL config in .env.example and README; added lead update functionality; added notes field to Merchant model. | Prisma schema, env docs, server actions. | Prisma migration with existing data was tricky. Had to ensure .env.example matched actual Postgres format and didn't break local dev. | I learned how important it is to document env vars for production. Adding the notes field felt good because it helps track merchant info better. |
| **2026-02-25** | Lead tracking and bulk actions | Added Shopify status tracking to leads; bulk addition of confirmed merchants; improved dashboard nav and lead management. | Bulk operations, navigation, lead state. | Keeping the leads table in sync after bulk updates was hard; had to revalidate paths and refresh the right components. | Working with bulk actions was new for me. I see how much faster workflows get when you can update many items at once instead of one by one. |
| **2026-02-25** | Auth and user management | Enhanced user management and dashboard; role-based access; session handling; bulk actions for merchants. | RBAC, NextAuth/session, bulk merchant actions. | Understanding NextAuth session vs JWT and when to check roles in server actions vs components was confusing. Resolved by centralizing requireRole() in server actions. | I struggled a bit with roles and permissions at first, but now I understand how to gate actions by role. It's important for keeping the app secure. |
| **2026-02-26** | Auth and dashboard integration | Updated auth and dashboard; integrated NextAuth for session management; improved user invitation; better lead tracking on dashboard. | NextAuth integration, invite flow, dashboard data. | Invite flow needed to handle users without passwords (OAuth). Had to wire up Resend and ensure callback URLs matched NEXTAUTH_URL. | Connecting NextAuth with the dashboard helped me understand how sessions flow through the app. I'll keep thinking about how to improve the invite flow. |
| **2026-02-28** | Bug fixes, feature implementation, and polish | Implemented prompts phase by phase: login page, Merchants list, Analytics dashboard, Leads detail/edit, Confirmed Merchants page; fixed user create FK, Prisma pooling, view password, LineChart import, kpis init order, dashboard real data, valid-URL-only links; added Delete Lead, loading skeleton. | Prisma FK checks, Supabase direct vs pooled, React init order, URL validation, revalidation. | Supabase prepared statement errors; seed unreachable on port 5432; website field with plain text broke links. Resolved with pgbouncer=true, pooler URL, and isUrl() checks before rendering links. | Spent the day fixing bugs and filling gaps. I learned a lot about connection pooling and how to validate data before using it in the UI. |
| **Session (recent)** | Bug fixes, features, and UX from chat ([da1531c6](agent-transcripts/da1531c6-f4ef-41ce-8b3a-c0ab7b49dd62.txt)) | **Fixes:** User create FK (invitedById) — only set if inviter exists; Settings view-password toggles; Prisma “prepared statement does not exist” (pgbouncer=true, direct URL for Supabase); .env DATABASE_URL pooler/direct; LineChart import; `kpis` used before init (reorder); Dashboard real merchant KPIs + empty state; Website/social links only when value is valid URL (avoid text like “This merch dont have website” as link). **Features:** Login page `/login`; Merchants list with search/filter/pagination; Nav: Merchants + Analytics; Analytics dashboard (pipeline, country, category, staff workload); Lead detail/edit pages + Promote to Merchant; Lead form; Delete Lead (detail + revalidate merchants); Confirmed Merchants page (merchants + PH/US confirmed leads, exclude Converted); Dashboard loading skeleton. | Prisma FK handling, connection pooling (Supabase/pgbouncer), React state/initialization order, URL validation, server/client data flow, revalidation. | **FK:** Stale session or missing inviter → only set invitedById if inviter exists in DB. **Prepared statement:** Pooled Postgres (Supabase) doesn’t preserve prepared statements → pgbouncer=true or direct URL. **Seed unreachable:** Direct DB (5432) blocked → use pooler URL for seed or document. **Wrong link target:** Plain text in website field used as href → relative URL (e.g. `/dashboard/leads/This%20merch%20dont%20have%20website`) → only render &lt;a&gt; when value starts with http/https. | I ran into several bugs today (FK, Prisma pooling, wrong links) but fixing them taught me a lot. I now understand that checking things like "does this user exist?" and "is this a real URL?" before using them helps avoid weird errors. I also learned about Supabase's direct vs pooled connections and when to use each. |

---

## Summary by source

### From git commits (2026-02-19 → 2026-02-26)
- Project init, Postgres config, lead updates, notes on Merchant.
- Shopify status on leads, bulk confirmed merchants, nav and lead management.
- User management, RBAC, session, bulk merchant actions.
- NextAuth integration, invite flow, dashboard lead tracking.

### From chat sessions (transcript da1531c6 + current)
- **Auth/DB:** User create FK fix, pgbouncer/direct URL, seed connectivity.
- **UX:** View password in settings, login page, nav (Merchants, Analytics), dashboard real data + empty state, loading skeleton.
- **Leads:** Detail/edit, form, Promote to Merchant, Delete Lead, valid-URL-only links.
- **Merchants:** List (search, filter, pagination), Confirmed Merchants (Merchant + confirmed leads).
- **Analytics:** Pipeline, country, category, staff workload + KPIs.
- **Bugs:** LineChart import, `kpis` initialization order, link href from non-URL text.

---

*Journal generated from repository git history and agent transcripts in `agent-transcripts/`.*
