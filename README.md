# SiteOps — Construction Site Management

A full-stack construction site management system.

- **Backend:** Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, JWT auth with role-based access control
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Query, React Router

## What's built

**Phase 1**
- **A. Company & Users** — company workspace, admin-managed team with all 10 roles (Admin, PM, Site Engineer, Site Supervisor, Store Manager, Accountant, Purchase Manager, Vendor, Contractor, Labor), JWT auth
- **B. Project Management** — Projects → Sites → Buildings → Floors → Units, budget, status, project manager assignment
- Dashboard with live project/site/budget stats

**Phase 2**
- **C. Planning & Requirements** — Project requirements, Work Packages, Activities (with % progress tracking), BOQ (with auto-totaled amounts), Material requirements, Labor requirements, Equipment requirements. Reach it from a project's "Planning & BOQ" button.

**Phase 3**
- **D. Vendor Management** — Vendors, quotations, contracts, purchase orders (project-scoped), bills with partial-payment tracking
- **E. Material / Stock Management** — Material categories & catalog (company-wide), per-site stock movements (inward/outward/transfer/adjustment/consumption), computed balances with low-stock flags at both the site and company level

**Phase 4**
- **F. Labor Management** — Contractors, labor groups, labor roster, attendance (marked per site, per date), wage/advance/overtime payments
- **G. Site Work** — Daily site diary (per site, per date) that aggregates: progress logs against activities, who worked that day, material consumed, equipment used, site photos, and open issues/delays — reach it via a site's "Diary" button

**Phase 5**
- **H. Equipment** — Equipment master (owned/rented), usage logged per site per date (hours, fuel, rental cost), maintenance log. Usage is logged from a site's Diary page, right alongside labor attendance and material consumption.

**Phase 6**
- **I. Finance** — Expense ledger per project (Purchase/Labor/Vendor payment/Petty cash/Advance/Other), Budget lines with actual spend computed live from matching expenses, project-level and company-wide Budget vs Actual summaries. Reach it via a project's "Finance" button, or the company-wide **Finance** sidebar link for the portfolio view.

  Note: true Profit/Loss needs a revenue/client-billing model (e.g. RA bills to the client), which isn't in the original spec's Finance breakdown and isn't modeled yet. What's built is Budget vs Actual — the cost side of P&L — which is what the spec's Finance module actually lists.

The database schema (`server/prisma/schema.prisma`) already models **all 12 modules** from the spec, so later phases are pure feature work — no schema rework.

## What's next (Phase 7+)

1. Quality & Safety (inspections, checklists, defects, rework, safety incidents)
2. Documents (drawings, contracts, certificates — likely needs file storage, not just URLs)
3. Reports/Dashboard rollups across all modules — the natural finale, since every module now has real data to report on

## Getting started

### Prerequisites
- Node.js 18+
- PostgreSQL (local or hosted — e.g. Supabase, Neon, Railway)

### 1. Install dependencies
```bash
npm run install:all
```

### 2. Configure environment
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```
Edit `server/.env` and set `DATABASE_URL` to your Postgres connection string, and set a real `JWT_SECRET`.

### 3. Set up the database
```bash
cd server
npx prisma migrate dev --name init
npm run seed   # optional: creates a demo company + login
```
Seeded login: `admin@demobuilders.com` / `password123`

### 4. Run the app
In two terminals:
```bash
npm run dev:server   # http://localhost:4000
npm run dev:client   # http://localhost:5173
```

Or register your own company from the app's Register page — no seed needed.

## Project structure

```
site-management/
├── server/
│   ├── prisma/schema.prisma   # full data model, all 12 modules
│   └── src/
│       ├── modules/           # auth, users, projects, sites (one folder per module)
│       ├── middleware/        # auth (JWT + RBAC), error handling
│       └── config/db.ts       # Prisma client
└── client/
    └── src/
        ├── api/                # typed API calls per module
        ├── pages/              # one folder per module's screens
        ├── components/layout/  # sidebar (all 12 modules), topbar, shell
        └── context/AuthContext.tsx
```

## Adding a new module (pattern to follow)

Each existing module (e.g. `projects`) follows the same shape — copy it as a template:
1. **Schema**: tables already exist in `schema.prisma` for every module.
2. **Backend**: `server/src/modules/<module>/<module>.routes.ts` — Zod-validated CRUD, scoped by `companyId`/`projectId`, `requireAuth` + `requireRole`.
3. **Mount**: add the router in `server/src/app.ts`.
4. **Frontend API**: `client/src/api/<module>.ts` — typed functions wrapping the endpoints.
5. **Frontend pages**: `client/src/pages/<module>/` — list + detail views using React Query.
6. **Route + nav**: add to `client/src/App.tsx` and move the entry in `Sidebar.tsx` from "Phase 2" to "Live modules".
