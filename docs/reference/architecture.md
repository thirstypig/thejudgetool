# Architecture Reference

## Project Structure

```
src/
  app/                          — Next.js App Router pages
    (auth)/
      layout.tsx                — Auth layout (metadata)
      login/
        page.tsx                — Login page (Suspense wrapper)
        LoginForm.tsx           — Two-tab login form (judge + organizer)
    (dashboard)/
      layout.tsx                — Server layout: auth gate + CompetitionProvider
      DashboardShell.tsx        — Client shell: sidebar, top bar, mobile drawer
      loading.tsx               — Dashboard-level loading spinner
      error.tsx                 — Dashboard-level error boundary
      not-found.tsx             — Dashboard-level 404
      organizer/                — Organizer pages
        [competitionId]/
          teams/                — BBQ Teams registration, check-in, boxes
          judges/               — Judge registration, check-in, table assignment
          competition/          — Box distribution, comment cards, category control
          results/              — Progress, results, score audit, audit log
      judge/                    — Judge scoring dashboard + sheet panel
      captain/                  — Table captain review + submit dashboard
    api/auth/[...nextauth]/     — Auth API route
  features/                     — Feature modules (isolated domains)
    competition/                — Competition CRUD, box distribution, category advancement
    judging/                    — Judge scoring, score cards, correction requests
    scoring/                    — Table captain scoring review, corrections, submission
    tabulation/                 — Results tabulation, winner declaration, export, audit log
    users/                      — Judge import
  shared/
    components/
      common/                   — Design system components
      ui/                       — UI primitives
    constants/kcbs.ts           — KCBS rules, categories, enums
    lib/
      auth.ts                   — next-auth config
      auth-guards.ts            — Server action auth guards
      rate-limit.ts             — Login rate limiter
      prisma.ts                 — Prisma singleton
      utils.ts                  — cn() utility
    types/                      — Re-exported Prisma model types
  middleware.ts                 — Role-based route protection
prisma/
  schema.prisma                 — Database schema
  seed.ts                       — Dev seed data
```

## Feature Module Pattern

Each feature in `src/features/<name>/` follows this structure:

```
components/   — React components (client or server)
hooks/        — Custom React hooks
store/        — Zustand stores
actions/      — Server actions ("use server")
schemas/      — Zod validation schemas
types/        — TypeScript types
utils/        — Helper functions
index.ts      — Barrel export (ONLY export what other features need)
```

Nothing leaks outside except what's in `index.ts`. See [how to add a feature module](../how-to/add-a-feature-module.md).

## Path Aliases

| Alias | Maps to |
|-------|---------|
| `@/*` | `src/*` |
| `@features/*` | `src/features/*` |
| `@shared/*` | `src/shared/*` |

## Tech Stack

### Frontend
- **Next.js 14.2** (App Router) — pages, layouts, routing
- **Tailwind CSS v3** — styling
- **Shadcn-style components** (manually written, new-york style)
- **Zustand** — client state management
- **React Hook Form** — form handling
- **next-themes** — dark mode
- **lucide-react** — icons

### Backend
- **Next.js Server Actions** — server-side logic
- **next-auth v5 beta** — authentication (JWT, Credentials providers)
- **Prisma 5** — ORM / database access

### Shared
- **TypeScript** (strict mode)
- **Zod** — validation (forms + server actions)
- **date-fns** — date formatting

### Infrastructure
- **Supabase** — managed Postgres database
- **Vitest** — unit testing

## Design System

Primary color: deep red `hsl(4, 70%, 46%)` (#C0392B). Dark mode via `next-themes` class strategy.

### Common Components (`src/shared/components/common/`)

| Component | Description |
|-----------|-------------|
| **PageHeader** | Page title + subtitle + actions slot |
| **StatusBadge** | Colored pill (pending/active/submitted/closed/locked) |
| **RoleBadge** | Role-colored pill (JUDGE/TABLE_CAPTAIN/ORGANIZER) |
| **EmptyState** | Dashed border box with icon, title, description, action |
| **LoadingSpinner** | Animated spinner with optional label |
| **SectionCard** | Compound component (Root/Header/Body/Footer) with context. **Requires "use client"** |
| **DataTable** | Generic typed table with columns, loading, empty states, search, pagination |
| **ScoreDisplay** | Color-coded KCBS score box (1-9) with `aria-label` |
| **FontSizeControl** | Judge-facing text size adjuster |
| **UserAvatar** | CBJ initials in role-colored circle |
| **ConfirmDialog** | Wraps AlertDialog with confirm/cancel |
| **ThemeToggle** | Sun/moon toggle |

### UI Primitives (`src/shared/components/ui/`)

button, input, label, badge, card, tabs, dropdown-menu, alert-dialog, table, sheet

## Critical Constraints

- **Prisma must stay on v5.** Prisma v7 uses `node:` protocol imports incompatible with Next.js 14.
- **shadcn v4 generates Tailwind v4 code** — incompatible with this project. Use `npx shadcn@1` or manually adjust.
- **SectionCard requires "use client"** — it uses `React.createContext`. Server components must wrap usage in a client component boundary.

## Commands

```bash
npm run dev          # Start dev server (port 3030)
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run unit tests (Vitest)
npm run test:watch   # Tests in watch mode
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed dev data
npm run db:reset     # Reset DB + re-seed
```
