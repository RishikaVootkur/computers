# Master Project Plan — Rishika Computers Platform

> A world-class business management platform for Rishika Computers,
> Dilsukh Nagar, Hyderabad. Built as a gift. Designed to scale globally.

---

## Design principles

1. **Modular & scalable** — every module is independently buildable and plugs into a shared core
2. **Iterative** — features are added one at a time; existing code only changes when necessary
3. **File tracking** — every generated file is logged; before any change, audit the full file list first
4. **Free tier only** — no paid APIs, subscriptions, or cloud services
5. **No-compromise UI** — beautiful, fast, mobile-first, works on low-end Android phones

---

## Tech stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js 15 + Tailwind CSS | shadcn/ui component library |
| Backend | Next.js API Routes | Prisma ORM, TypeScript |
| Database | Supabase (PostgreSQL) | Free tier, Row Level Security |
| Auth | Supabase Auth | Email + role-based access |
| AI | Google Gemini API | Free tier, 1M tokens/day |
| Deployment | Vercel Hobby | Free tier, auto-deploy from GitHub |
| Project tracking | GitHub Projects | Free, linked to repo |

---

## User roles

| Role | Access |
|---|---|
| OWNER | Full access, analytics, AI assistant, staff management |
| STAFF | Service intake, job updates, attendance view |
| CUSTOMER | Own service job status only |

---

## Phases

### Phase 1 — Foundation (building now)
- Authentication — login, roles (staff / owner / customer)
- Service intake — customer lookup by phone, device type, notes, estimate, remarks
- Service job lifecycle — RECEIVED → DIAGNOSED → IN_PROGRESS → WAITING_FOR_PARTS → COMPLETED → DELIVERED
- Attendance — daily Present / Absent / Half Day per staff
- Salary — monthly auto-calculation, partial payment support, Cash / PhonePe tracking

### Phase 2 — Owner Dashboard + AI
- Analytics — jobs this week/month, revenue, pending count
- AI assistant — owner asks questions in plain language
- AI diagnosis suggestions — auto-suggest repair cause from problem description
- Staff performance overview

### Phase 3 — Customer Portal
- Customer login via phone number + OTP
- Real-time repair status tracking
- Service history
- WhatsApp / SMS notifications on status change

### Phase 4 — Sales Module
- Product inventory — desktops, laptops, accessories
- Sales billing and invoicing
- Stock alerts
- Tally export integration

### Phase 5 — SaaS-ification
- Multi-shop support
- White-labeling
- Subscription billing
- Global expansion

---

## Project knowledge base (all files)

| File | Path | Status |
|---|---|---|
| FILE_01 | docs/master-plan.md | Done |
| FILE_02 | docs/erd.md | Done |
| FILE_03 | docs/architecture.md | Done |
| FILE_04 | docs/wireframes.md | Pending |
| FILE_05 | prisma/schema.prisma | Pending |
| FILE_06 | .env.example | Pending |
| FILE_07 | src/middleware.ts | Pending |
| FILE_08 | src/lib/supabase.ts | Pending |
| FILE_09 | src/lib/prisma.ts | Pending |
| FILE_10 | src/app/api/v1/... | Pending |
| FILE_11 | src/app/(auth)/... | Pending |
| FILE_12 | src/app/(dashboard)/... | Pending |
| FILE_13 | docs/test-cases.md | Pending |
| FILE_14 | docs/deployment.md | Pending |

---

## Workflow rule

Before adding any new feature:
1. List all files in the knowledge base above
2. Identify which files need to change
3. Update only those files
4. Update this master plan's file table