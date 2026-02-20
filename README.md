# Pililokal Dashboard

Internal dashboard for tracking merchant progress on Shopify uploads. Built for a US-based Shopify store.

## Features

### Shopify Uploads Dashboard
- **Dashboard**: KPI cards, Needs Attention list, filterable merchant table
- **Merchant detail**: Full merchant info, Shopify tracking, address, product sourcing, activity log
- **Create/Edit merchant**: Form with validation
- **Activity notes**: Add notes from dashboard or merchant page
- **Completion %**: Computed from address, products, checklist, and final review

### Leads Pipeline (from Excel)
- **Pipeline Overview**: KPI cards (Total, PH Confirmed, Interested, US Leads, PH Leads, Previous Clients)
- **Funnel View**: Stage breakdown (Sample Received → Confirmed → Interested → Contacted → No Response)
- **Category & Geo Charts**: Bar charts by category and location
- **US Leads Result**: Pie chart (Confirmed, Interested, No Response, Declined, etc.)
- **Digital Presence**: % with FB, IG, Website
- **Staff Workload**: Count per Encoded By
- **Follow-up Queue**: Merchants needing follow-up
- **Search & Filters**: Sheet, category, country, has email/social
- **Merchant Detail Panel**: Full contact info, status notes, social links

## Tech Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui components
- Prisma + SQLite (local) / PostgreSQL (production)
- Simple cookie-based auth (bcrypt)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Run locally

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up the database**

   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

3. **Start the dev server**

   ```bash
   npm run dev
   ```

4. **(Optional) Leads Pipeline** — Place `Pililokal_Merchants_Cleaned.xlsx` in the project root or in `/data` to load the leads dashboard at `/dashboard/leads`

5. Open [http://localhost:3000](http://localhost:3000)

### Default login

- **Email**: `admin@pililokal.com`
- **Password**: `admin123`

Change this in production.

### PostgreSQL setup

The project is configured to use **PostgreSQL** by default. To run it with PostgreSQL:

1. **Install and run PostgreSQL** (if needed):
   - **Windows**: [PostgreSQL installer](https://www.postgresql.org/download/windows/) or use Docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres`
   - **Mac**: `brew install postgresql@16` then `brew services start postgresql@16`
   - **Linux**: `sudo apt install postgresql postgresql-contrib` (or your distro’s package)

2. **Create a database** (e.g. `pililokal`):
   ```bash
   # Using psql (after PostgreSQL is running):
   createdb pililokal
   # Or in psql: CREATE DATABASE pililokal;
   ```

3. **Set the connection string in `.env`**:
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
   ```
   Examples:
   - Local (default user): `postgresql://postgres:postgres@localhost:5432/pililokal?schema=public`
   - Supabase / Neon / Railway: use the “Connection string” from your provider’s dashboard (usually a “Direct” or “Transaction” URL).

4. **Apply the schema and seed**:
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

5. **Run the app**:
   ```bash
   npm run dev
   ```

To use **SQLite** instead (e.g. for local dev without PostgreSQL), set in `prisma/schema.prisma`:
- `provider = "sqlite"`  
and in `.env`:  
- `DATABASE_URL="file:./dev.db"`
Then run `npx prisma generate` and `npx prisma db push` again.

## Project Structure

```
src/
├── app/                    # App Router pages
│   ├── page.tsx            # Login
│   ├── dashboard/          # Protected dashboard
│   │   ├── page.tsx        # Dashboard home
│   │   ├── merchants/
│   │   │   ├── [id]/       # Merchant detail
│   │   │   │   ├── page.tsx
│   │   │   │   └── edit/   # Edit form
│   │   │   └── new/        # Create merchant
│   │   └── actions.ts
│   ├── login/
│   └── logout/
├── components/
│   ├── auth/
│   ├── dashboard/
│   ├── layout/
│   ├── merchant/
│   └── ui/
├── lib/
│   ├── auth.ts
│   ├── db.ts
│   ├── merchant-utils.ts   # Address complete, completion %
│   └── utils.ts
prisma/
├── schema.prisma
└── seed.ts
```

## Scripts

| Command          | Description                |
|------------------|----------------------------|
| `npm run dev`    | Start dev server           |
| `npm run build`  | Build for production       |
| `npm start`      | Start production server    |
| `npm run db:push`| Push schema to DB          |
| `npm run db:seed`| Seed sample data           |
