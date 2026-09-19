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

**Phase 7**
- **J. Quality & Safety** — Inspections with ad-hoc checklists and defect/rework tracking, safety incident reports, and a standing per-site safety checklist. Reach it via a site's "Quality & Safety" button.

  Two real bugs fixed while building this: `Inspection` and `SafetyIncident` had a `siteId` column in the original schema but no actual relation to `Site` — any query trying to scope them by company (via site → project → company) would have failed outright. Fixed before writing routes.

**Phase 8**
- **K. Documents** — a link-based document register per project (drawings, contracts, bills, certificates). Like Site Photos, there's no file upload in this environment — you paste a link to where the file already lives (Drive, S3, etc.). Reach it via a project's "Documents" button.

**Phase 9**
- **L. Reports / Dashboard** — the synthesis layer. `/reports` is a company-wide portfolio table (progress %, budget vs actual per project). Each project's "Reports" button opens a deep rollup: overall progress (averaged from Activities), budget vs actual, vendor outstanding (unpaid vendor bills attributable to this project via its POs), today's labor attendance, low-stock materials across the project's sites, and open quality/safety counts — all computed live from the other 11 modules, nothing duplicated or re-entered.

## All 12 modules are now built

Every module from the original spec (A through L) has a working API and UI. The sidebar reflects this — company-wide modules (Projects, Vendors, Material & Stock, Labor, Equipment, Finance, Reports) are top-level links; project- and site-scoped tools (Planning & BOQ, Purchase Orders, Finance, Documents, Reports on a project; Diary, Stock, Quality & Safety on a site) are reached via buttons on that project's or site's detail page.

## Known limitations, if you want to extend further

- **No file uploads** — Site Photos and Documents are both link-based. Real uploads need S3/Cloudinary or similar wired into the backend.
- **No true Profit/Loss** — Finance tracks cost (Budget vs Actual) but there's no revenue/client-billing model (RA bills, milestone invoices), which wasn't in the original 12-module spec either.
- **Labor cost isn't project-attributed automatically** — Labor payments are company-wide; attendance is site-scoped (so per-project labor-days are derivable), but wage payments themselves aren't split by project.
- **Multi-tenant scoping bugs were a recurring theme** — several models (`MaterialCategory`, `Contractor`/`LaborGroup`/`Labor`, `Equipment`, and `Inspection`/`SafetyIncident`'s actual relations) needed fixing as each phase was built. Worth a final audit pass if this goes to production — search the schema for any model missing a `companyId` or a broken relation before trusting it with real multi-company data.

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
