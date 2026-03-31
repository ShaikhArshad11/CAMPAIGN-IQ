# Campaign Performance Dashboard

Campaign Performance Dashboard built with **Next.js (App Router)** + **SQLite**. It supports JWT-based authentication (Admin/Viewer roles), campaign CRUD, mock data sync, last-touch attribution, performance metrics, underperformance detection, and rule-based insights.

## Tech stack

- **Frontend**
  - Next.js App Router pages under `src/app/`
  - React 18
  - Tailwind CSS + shadcn/ui components
  - Recharts for charts
- **Backend**
  ### Backend
  - Next.js Route Handlers (App Router API routes — serverless-compatible)
  - Node.js runtime 
  - `jsonwebtoken` — JWT-based authentication
  - `bcryptjs` — password hashing
  - `better-sqlite3` — SQLite database (synchronous, file-based)
- **Data**
  - Mock JSON in `src/mock-data/`

## Setup instructions (local)

```bash
npm install
# Create a local env file (required)
cp .env.example .env.local

npm run dev
# Visit http://localhost:3000
# Login: admin@dashboard.com / admin123
# Login: viewer@dashboard.com / viewer123
# Hit "Sync Data" button once to load mock data
```

### Environment variables

- **`JWT_SECRET`** (required)
  - Used to sign/verify JWT tokens
  - Example is provided in `.env.example`

> Important: `.env.example` is only a template. Next.js reads environment variables from `.env.local` (local) or from your hosting provider environment settings.

## Database

- **Engine**: SQLite
- **File location**: `<project-root>/campaign.db`
- **Auto-creation**: The DB file is created automatically on first API call.
- **Schema/migrations**: `src/lib/schema.js` (runs automatically when the DB is opened)
- **Persistence**: Creating/updating/deleting campaigns in the app is stored in SQLite (the `campaigns` table) and persists across refresh/restart.
- **Hosting note**: This project is designed to run locally. File-based SQLite (via `better-sqlite3`).

## Seed users

On first run, the database is seeded with 2 users:

- **Admin**
  - Email: `admin@dashboard.com`
  - Password: `admin123`
- **Viewer**
  - Email: `viewer@dashboard.com`
  - Password: `viewer123`

## Mock data + Sync

Mock data files:

- `src/mock-data/ads.json`
- `src/mock-data/leads.json`
- `src/mock-data/orders.json`

Sync endpoint:

- `POST /api/sync` (Admin only)
  - Loads mock data into SQLite
  - Avoids duplicates on repeated sync using `INSERT OR IGNORE` with unique `source_id`
  - Runs attribution after ingest

## Attribution logic

Implemented in `src/lib/attribution.js` and executed during sync.

- **Last-touch model**
- Match orders to leads:
  - Email match preferred
  - Phone match fallback
- Stores attribution on orders as `orders.attributed_campaign_id`

## Dashboard metrics + insights

Metrics endpoint:

- `GET /api/dashboard/metrics` (Authenticated)

Per-campaign metrics include:

- Total Spend
- Revenue
- ROI
- Conversion Rate
- Conversions
- Impressions / Clicks

Underperformance rule:

- Spend > 50% of budget AND at least one of:
  - ROI is negative, OR
  - Conversion rate is low, OR
  - Conversions < 30% of expected

Insights are generated locally (no paid APIs) via rules in:

- `src/lib/insights.js`

## API endpoints (summary)

- **Auth**
  - `POST /api/auth/login`
- **Campaigns**
  - `GET /api/campaigns` (Authenticated)
  - `POST /api/campaigns` (Admin)
  - `PUT /api/campaigns/:id` (Admin)
  - `DELETE /api/campaigns/:id` (Admin)
- **Data / Metrics**
  - `POST /api/sync` (Admin)
  - `GET /api/dashboard/metrics` (Authenticated)

## Assumptions

1. Last-touch attribution uses the latest matching lead (by lead insert order) when multiple leads share the same email/phone.
2. Orders with no matching lead are stored with `attributed_campaign_id = NULL` and excluded from campaign revenue.
3. Phone matching is exact string; mock data uses a consistent `+91-XXXXXXXXXX` format.
4. Sync is idempotent: `INSERT OR IGNORE` + `source_id UNIQUE` prevents duplicates on repeated sync.
5. Mock data references campaign IDs. If those campaigns don’t exist yet, `/api/sync` will seed placeholder campaigns to satisfy FK constraints.
6. Metrics are computed from stored ads + attributed orders; a newly created campaign will show zeros until it has ads/leads/orders linked.

## Workflow screenshots

Save the following screenshots under `docs/screenshots/` with these filenames, then they will render on GitHub:

1) Login

![Login](docs/screenshots/01-login.png)

2) Campaign list + status

![Campaigns](docs/screenshots/02-campaigns.png)

3) Dashboard overview (cards + charts)

![Dashboard overview](docs/screenshots/03-dashboard-overview.png)

4) Dashboard metrics table (status + insights)

![Dashboard table](docs/screenshots/04-dashboard-table.png)


