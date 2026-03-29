# Session Context — Rishika Computers App

## What We're Building
Full-stack service management app for Rishika Computers (Mr. Krishna Reddy's shop, Dilsukh Nagar, Hyderabad).
- Built as a personal gift by his daughter
- Digitizing the service department (was paper-based bill books)
- Multi-role: OWNER, STAFF, CUSTOMER

## Tech Stack
- Next.js 16.2.1 (App Router, Turbopack)
- React 19, TypeScript
- Tailwind CSS 4 + shadcn/ui
- Prisma 7 + PostgreSQL on Supabase
- JWT (jsonwebtoken) + bcryptjs auth in HTTP-only cookies
- Deployment: Vercel free tier

## CRITICAL: Next.js 16 Breaking Change
- `middleware.ts` is DEPRECATED — renamed to `proxy.ts`
- Function name: `proxy` (not `middleware`)
- Proxy runs in Node.js runtime (NOT edge) — can use jsonwebtoken directly
- See: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`

## Login Credentials (from seed.ts)
- Owner: krishna@rishikacomputers.com / owner123
- Seed script: `npx tsx prisma/seed.ts`

## All Files Created/Modified This Session

### NEW files
| File | Purpose |
|------|---------|
| `src/proxy.ts` | Route protection (auth guard) — Next.js 16 proxy |
| `src/lib/auth.ts` | verifyToken(), getAuthFromRequest() — client-safe |
| `src/lib/auth-server.ts` | getAuthUser() — server-only (uses next/headers) |
| `src/components/Navbar.tsx` | Server component navbar with user info |
| `src/components/LogoutButton.tsx` | Client component logout button |
| `src/components/StatusBadge.tsx` | Colored status badge component |
| `src/app/api/v1/auth/logout/route.ts` | POST — clears token cookie |
| `src/app/api/v1/customers/route.ts` | GET (lookup by phone) + POST (create) |
| `src/app/api/v1/jobs/route.ts` | GET (list) + POST (create job) |
| `src/app/api/v1/jobs/[id]/route.ts` | GET job details with status logs |
| `src/app/api/v1/jobs/[id]/status/route.ts` | PATCH — update job status |
| `src/app/api/v1/track/route.ts` | GET — public endpoint, customer tracking by phone |
| `src/app/service/new/page.tsx` | Server wrapper for intake form |
| `src/app/service/new/NewServiceForm.tsx` | Client component — the actual intake form |
| `src/app/service/[id]/page.tsx` | Server wrapper for job detail |
| `src/app/service/[id]/JobDetailClient.tsx` | Client component — job detail + status update |
| `src/app/owner/page.tsx` | Owner dashboard with stats + recent jobs |
| `src/app/track/page.tsx` | Server wrapper for customer tracking |
| `src/app/track/TrackForm.tsx` | Client component — customer tracking form |

### MODIFIED files
| File | Change |
|------|--------|
| `src/app/dashboard/page.tsx` | Full replacement — staff job list with stats |
| `src/app/login/page.tsx` | Redirects OWNER → /owner, STAFF → /dashboard |
| `src/app/layout.tsx` | Updated metadata title/description |

## Build Status
**Last build: FAILED (being fixed)**

The build was failing due to this Next.js App Router pattern error:
> "You're importing a module that depends on next/headers. This API is only available in Server Components."

**Root cause:** Client components (`service/new/page.tsx`, `service/[id]/page.tsx`, `track/page.tsx`) were directly importing `Navbar.tsx` which uses `cookies()` from `next/headers`. Client components cannot import server-only APIs.

**Fix applied (at session end):**
1. Split `auth.ts` — removed `getAuthUser()` (which used `cookies()`) into `auth-server.ts`
2. Restructured all 3 client pages into server wrapper + client component:
   - `service/new/page.tsx` (server) → renders `<Navbar /> + <NewServiceForm />`
   - `service/new/NewServiceForm.tsx` (client) — the actual form
   - `service/[id]/page.tsx` (server) → renders `<Navbar /> + <JobDetailClient />`
   - `service/[id]/JobDetailClient.tsx` (client) — detail + status update
   - `track/page.tsx` (server) → renders header + `<TrackForm />`
   - `track/TrackForm.tsx` (client) — search form

## TODO: Verify Build Passes
Run `npm run build` to confirm the fix worked. If more errors, read the output carefully.

## App Routes
| Route | Access | Description |
|-------|--------|-------------|
| `/login` | Public | Email + password login |
| `/dashboard` | STAFF + OWNER | Job list with stats |
| `/service/new` | STAFF + OWNER | Service intake form |
| `/service/[id]` | STAFF + OWNER | Job detail + status update |
| `/owner` | OWNER only | Stats dashboard + recent jobs |
| `/track` | Public | Customer repair tracking by phone |

## Key Design Decisions
- Every DB table has `shopId` for multi-shop SaaS scalability
- `JobStatusLog` tracks every status change with who did it
- Job numbers: `RC-0001`, `RC-0002`, etc. (auto-incremented per shop)
- API versioned under `/api/v1/`
- Auth: JWT in HTTP-only cookie, 7-day expiry
- Status flow: RECEIVED → DIAGNOSED → IN_PROGRESS → WAITING_FOR_PARTS → COMPLETED → DELIVERED

## What's NOT Built Yet (Future Sessions)
- Attendance tracking UI
- Salary management UI
- Staff management (add/edit staff users)
- Owner: add new staff account page
- Search/filter on job list
- Customer portal OTP login (currently public phone lookup)
- WhatsApp/SMS notifications
- Sales module
- Seed more staff users (only owner created in seed.ts)

## Database
- Supabase project: ywhurjjgnvwpfzbhuthi.supabase.co
- Migrations: run `npx prisma migrate deploy` or `npx prisma db push`
- Seed: `npx tsx prisma/seed.ts` (creates shop + Krishna Reddy as OWNER)
- Note: Need to run seed before first login
