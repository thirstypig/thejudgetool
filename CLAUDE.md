# BBQ Judge

KCBS-style BBQ competition judging app. Organizers create competitions, assign judges to tables, and advance through category rounds. Judges submit scores. Table captains oversee their table.

## Stack

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
- **next-auth v5 beta** — authentication (JWT, Credentials providers for judge CBJ+pin and organizer email+password)
- **Prisma 5** — ORM / database access

### Shared
- **TypeScript** (strict mode)
- **Zod** — validation (forms + server actions)
- **date-fns** — date formatting

### Infrastructure
- **Supabase** — managed Postgres database
- **Vitest** — unit testing

## Critical Constraints

- **Prisma must stay on v5.** Prisma v7 uses `node:` protocol imports incompatible with Next.js 14.
- **shadcn v4 generates Tailwind v4 code** — incompatible with this project. UI components in `src/shared/components/ui/` are manually written for Tailwind v3. If adding new shadcn components, use `npx shadcn@1` or manually adjust.
- **SectionCard requires "use client"** — it uses `React.createContext`. Any server component consuming it must wrap usage in a client component boundary.

## Project Structure

```
src/
  app/
    (auth)/
      layout.tsx            — Auth layout (metadata)
      login/
        page.tsx            — Login page (Suspense wrapper)
        LoginForm.tsx       — Two-tab login form (judge + organizer)
    (dashboard)/
      layout.tsx            — Server layout: auth gate + CompetitionProvider
      DashboardShell.tsx    — Client shell: sidebar, top bar, mobile drawer
      loading.tsx           — Dashboard-level loading spinner
      error.tsx             — Dashboard-level error boundary
      not-found.tsx         — Dashboard-level 404
      organizer/            — Organizer pages (competitions, setup, status, results)
      judge/                — Judge scoring dashboard + sheet panel
      captain/              — Table captain review + submit dashboard
    api/auth/[...nextauth]/ — Auth API route
  features/                 — Feature modules (isolated domains)
    competition/            — Competition CRUD, setup, status, CompetitionProvider
    judging/                — Judge scoring, score cards, correction requests
    scoring/                — Table captain scoring review, corrections, category submission
    tabulation/             — Results tabulation, winner declaration, export, audit log
    users/                  — User management (stub)
  shared/
    components/
      common/               — Design system: PageHeader, StatusBadge, DataTable, SectionCard, etc.
      ui/                   — Primitives: button, input, label, badge, alert-dialog, card, tabs, dropdown-menu, table, sheet
    constants/kcbs.ts       — KCBS rules, categories, enums
    lib/
      auth.ts               — next-auth config (JWT strategy)
      prisma.ts             — Prisma singleton
      utils.ts              — cn() utility
    types/                  — Re-exported Prisma model types
  middleware.ts             — Role-based route protection + auth redirect
prisma/
  schema.prisma             — Data models
  seed.ts                   — Dev seed data
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

Nothing leaks outside except what's in `index.ts`.

## Path Aliases

- `@/*` → `src/*`
- `@features/*` → `src/features/*`
- `@shared/*` → `src/shared/*`

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run unit tests (Vitest)
npm run test:watch   # Tests in watch mode
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed dev data
npm run db:reset     # Reset DB + re-seed
```

## Auth

Two credential providers in `src/shared/lib/auth.ts`:
- **Judge**: CBJ number + PIN → redirects to `/judge` (or `/captain` for TABLE_CAPTAIN)
- **Organizer**: email + password (stored as pin field) → redirects to `/organizer`

Session uses JWT strategy. Includes `role` and `cbjNumber` via JWT callbacks (cast with `as unknown as`).

### Middleware (`src/middleware.ts`)
- Protects all routes except `/login`, `/api`, static assets
- Unauthenticated → `/login` with `callbackUrl` query param
- Role enforcement: `/organizer/*` ORGANIZER only, `/captain/*` TABLE_CAPTAIN only, `/judge/*` JUDGE only
- Role mismatch → redirect to correct dashboard

### Login Page
- Two-tab form: Judge (CBJ + PIN) / Organizer (email + password)
- Client component (`LoginForm.tsx`) wrapped in Suspense for `useSearchParams`
- Fetches session after login to determine role-based redirect

### Dashboard Shell (`DashboardShell.tsx`)
- Desktop: fixed 240px sidebar with role-filtered navigation
- Mobile: Sheet drawer triggered by hamburger menu
- Top bar: competition selector (organizer only), ThemeToggle, user avatar + sign out
- Nav links for Setup/Status/Results resolve to active competition ID

### CompetitionProvider (`src/features/competition/components/CompetitionProvider.tsx`)
- React context wrapping the dashboard layout
- Provides: `activeCompetition`, `competitions`, `setActiveCompetitionId`, `setCompetitions`
- Persists selected competition ID to `localStorage`
- Exported from `@features/competition` barrel

## Testing

Unit tests use **Vitest** (`vitest.config.ts` at project root). Tests live alongside source in `__tests__/` directories:
- `features/competition/utils/__tests__/` — BR-2 validation
- `features/tabulation/utils/__tests__/` — tabulation logic (averages, DQ, outliers)
- `features/judging/schemas/__tests__/` — scorecard schema validation

Pure utility functions extracted for testability:
- `features/competition/utils/` — `validateNoRepeatCompetitor()` (pure version)
- `features/tabulation/utils/` — `tabulateCategory()` (pure version)

See `TESTING.md` for the integration smoke test checklist.

## Seed Data

- Competition: "American Royal Open 2026" (ACTIVE)
- Organizer: organizer@bbq-judge.test / organizer123
- 12 Judges: CBJ-001 through CBJ-012, all PIN: 1234
- Table 1 Captain: CBJ-001, Table 2 Captain: CBJ-007
- Competitors: 101–106 (6 teams)
- Categories: Chicken (ACTIVE), Pork Ribs, Pork, Brisket (PENDING)
- Pre-filled: Table 1 Chicken scores for competitors 101–104
- Competitor 104 has DQ score + pending correction request

## Design System

Primary color: deep red `hsl(4, 70%, 46%)` (#C0392B). Dark mode via `next-themes` class strategy.

Shared components in `src/shared/components/common/`:
- **PageHeader** — page title + subtitle + actions slot
- **StatusBadge** — colored pill (pending/active/submitted/closed/locked)
- **RoleBadge** — role-colored pill (JUDGE/TABLE_CAPTAIN/ORGANIZER)
- **EmptyState** — dashed border box with icon, title, description, action
- **LoadingSpinner** — animated spinner with optional label
- **SectionCard** — compound component (Root/Header/Body/Footer) with context
- **DataTable** — generic typed table with columns, loading, empty states
- **ScoreDisplay** — color-coded KCBS score box (1,2,5,6,7,8,9)
- **UserAvatar** — CBJ initials in role-colored circle
- **ConfirmDialog** — wraps AlertDialog with confirm/cancel
- **ThemeToggle** — sun/moon toggle

UI primitives in `src/shared/components/ui/`:
- **button** — CVA variants (default/destructive/outline/secondary/ghost/link), `asChild` via Slot
- **input** — styled `<input>` with ring/focus
- **label** — styled `<label>` with peer-disabled
- **badge** — CVA variants (default/secondary/destructive/outline)
- **card** — Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- **tabs** — Tabs, TabsList, TabsTrigger, TabsContent (controlled/uncontrolled, context-based)
- **dropdown-menu** — DropdownMenu, Trigger, Content, Item, Label, Separator (click-outside aware)
- **alert-dialog** — Radix AlertDialog wrapper ("use client")
- **table** — HTML table primitives (Table, TableHeader, TableBody, etc.)
- **sheet** — Radix Dialog-based slide panel, side variants (top/bottom/left/right)

## Business Rules

- **BR-1**: Category rounds must advance sequentially. No skipping. Organizer-only.
- **BR-2**: No repeat competitor at the same table across rounds.
- **BR-3**: Submitted score cards are locked. Judges must request corrections via table captain.
- **BR-4**: Never show team names to judges — only anonymous 3-digit numbers.
- **BR-5**: Never show other judges' scores or rankings during active judging.
- **BR-6**: Table captain cannot submit category until all judges have submitted all score cards and all correction requests are resolved.
- **KCBS mandatory categories**: Chicken (1), Pork Ribs (2), Pork (3), Brisket (4).
- **Tables**: Max 6 judge seats per table. Table captains may or may not be judges. A table can have 6 judges + 1 non-judging captain = 7 people total. The schema supports this: `captainId` on Table is separate from `TableAssignment` seats.

### KCBS Scoring System

**Valid scores**: 1, 2, 5, 6, 7, 8, 9 (scores of 0, 3, 4 are not used).

| Score | Meaning |
|-------|---------|
| 9 | Excellent |
| 8 | Very Good |
| 7 | Good |
| 6 | Fair |
| 5 | Poor |
| 2 | Inedible |
| 1 | DQ / Penalty (requires Rep approval) |

**Three scoring dimensions** with KCBS weights:
- Appearance × 0.5600
- Taste × 2.2972 (heaviest — a 5-9-9 can outscore a 9-8-9)
- Tenderness/Texture × 1.1428
- Total weight = 4.0000, max weighted score per judge = 36

**Drop lowest**: Each table has 6 judges. The lowest weighted total is dropped — only the top 5 count. Perfect score = 180 (5 × 36).

**Tiebreaking** (in order):
1. Cumulative Taste scores across all 6 judges
2. Cumulative Tenderness/Texture scores across all 6 judges
3. Cumulative Appearance scores across all 6 judges
4. Dropped (lowest) judge's weighted score — higher wins
5. Deterministic coin toss

**Constants**: defined in `src/shared/constants/kcbs.ts` — `VALID_SCORES`, `SCORE_WEIGHTS`, `MAX_WEIGHTED_SCORE`, `JUDGES_PER_TABLE`, `COUNTING_JUDGES`, `PERFECT_SCORE`, `DQ_SCORE`.

**Rules page**: `/rules` — accessible to all roles. Contains 2025 KCBS Judging Procedures, Judges' Creed, scoring tables, and tiebreaking rules.

## Future Features (Post-MVP)

### Comment Cards (Implemented — Schema + UI ready, needs polish)

Judges optionally fill out comment cards after scoring each category. Organizers toggle this on/off per competition (`commentCardsEnabled` field on Competition). Comment cards capture taste checkboxes, tenderness checkboxes, appearance free text, and other comments. Schema: `CommentCard` model. Constants: `TASTE_COMMENT_OPTIONS`, `TENDERNESS_COMMENT_OPTIONS` in `kcbs.ts`. Components: `EventInfoScreen`, `CommentCardScreen`, `CommentCardToggle`. Integrated into judge dashboard as `"event-info"` and `"comment-cards"` phases.

### Box Distribution Proposal

Auto-generate a proposed box assignment per table per category, ensuring **no competitor appears at the same table twice across categories** (extends BR-2 to the full competition, not just per-round). Key concepts:

- A competition ideally has **24 competitors** (6 per table × 4 mandatory categories).
- Each competitor submits **one box per category** (e.g., one chicken box, one pork ribs box, one pork box, one brisket box).
- The system should generate a distribution matrix: for each table, which 6 competitor boxes it receives per category, with zero overlap across categories at the same table.
- Organizers can view, approve, and print the proposed distribution to hand to volunteers.
- The algorithm is a constrained assignment problem (Latin square variant across 4 categories).

This feature lives on the organizer setup page and feeds into the Judges Table Organizer role (see below).

### Judges Table Organizer Role

A new user role: `TABLE_ORGANIZER`. This person physically receives incoming boxes of meat and distributes them to the correct tables based on the box distribution plan.

- They see a view showing: which boxes go to which table for the current active category.
- As boxes arrive, they can check them off.
- They do **not** judge or score — their role is logistics only.
- Auth: separate credential provider or shared PIN like judges.
- Routes: `/table-organizer/*` with middleware role enforcement.

**Status**: Deferred. Will implement after MVP is stable.
