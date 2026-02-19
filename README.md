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

### Production (PostgreSQL)

1. Set `DATABASE_URL` to your PostgreSQL connection string in `.env`
2. Update `prisma/schema.prisma` datasource from `sqlite` to `postgresql`
3. Run `npx prisma migrate dev` to create tables
4. Seed: `npx prisma db seed`
5. Build and start: `npm run build && npm start`

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
