# System Architecture — Rishika Computers Platform

## What is this file?
This file describes how the different parts of the app are structured
and how they talk to each other.

---

## Simple explanation

Think of the app in 4 floors:

- **Floor 1 (top) — What the user sees**
  The website pages that open in a browser.
  Staff sees one view. Owner sees another. Customer sees another.

- **Floor 2 — The brain of the app**
  Next.js handles both the pages AND the behind-the-scenes logic.
  When you click a button, Next.js figures out what to do.

- **Floor 3 — The helper services**
  Prisma talks to the database. Supabase handles login/logout.
  Gemini AI answers smart questions.

- **Floor 4 (bottom) — Where data is stored**
  Supabase (PostgreSQL database). All records live here —
  customers, jobs, attendance, salary, everything.

---

## Layers

### 1. Client layer
- Browser-based — works on desktop and mobile
- Three role-specific views: Staff, Owner, Customer
- Built with Next.js 15 + Tailwind CSS + shadcn/ui

### 2. Frontend + API layer (Next.js 15 — hosted on Vercel)
- Pages — what users see, built with App Router
- API routes — all backend logic lives at `/api/v1/...`
- Middleware — checks who you are before letting you in
- UI components — shadcn/ui + Tailwind CSS

### 3. Backend services
- Prisma ORM — talks to the database in a safe, typed way
- Supabase Auth — handles login, logout, sessions
- Google Gemini API — powers AI features
- Job queue — handles background tasks like notifications

### 4. Data layer (Supabase — PostgreSQL)
- All data stored here
- Row Level Security — even at database level, users only see their own data
- Tables: shops, users, customers, service_jobs, job_status_log,
  staff, attendance, salary_records, salary_payments

---

## How a request flows
```
User clicks something in browser
  → Vercel (checks login + role via Middleware)
  → Next.js API route (runs the logic)
  → Prisma ORM (talks to database)
  → Supabase PostgreSQL (returns data)
  → Back to browser (shows result)
```

For AI features:
```
User asks a question
  → Next.js API route
  → Google Gemini API
  → Answer streamed back to browser
```

---

## All services used and cost

| Service | What it does | Cost |
|---|---|---|
| Vercel | Hosts the website | Free |
| Supabase | Database + Login | Free |
| Google Gemini API | AI features | Free |
| GitHub | Stores code | Free |

---

## Important technical decisions

**API versioning** — all routes start with `/api/v1/`.
When we add new features later, we use `/api/v2/` so nothing breaks.

**Role security at two levels:**
1. Middleware (Next.js) — checks your role before the page even loads
2. Database (Supabase RLS) — even if someone bypasses the app,
   the database itself will not give them wrong data.

**Multi-shop ready from day one** — every table has a `shop_id` column.
Adding a second shop in the future requires zero changes to the database.
```

---

Once you've saved all 3 files, your folder on Desktop should look like this:
```
rishika-computers/
└── docs/
    ├── master-plan.md
    ├── erd.md
    └── architecture.md