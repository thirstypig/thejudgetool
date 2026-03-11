# BBQ Judge

KCBS-style BBQ competition judging app. Organizers create competitions, assign judges to tables, and advance through category rounds. Judges submit scores. Table captains oversee their table.

## Stack

- **Next.js 14.2** (App Router), **Tailwind CSS v3**, **Zustand**, **React Hook Form**, **next-themes**, **lucide-react**
- **next-auth v5 beta** (JWT, Credentials), **Prisma 5**, **Supabase** (Postgres)
- **TypeScript** (strict), **Zod**, **date-fns**, **Vitest**

## Critical Constraints

- **Prisma must stay on v5.** v7 uses `node:` imports incompatible with Next.js 14.
- **shadcn v4 generates Tailwind v4 code** — use `npx shadcn@1` or manually adjust for v3.
- **SectionCard requires "use client"** — uses `React.createContext`.

## Project Structure

```
src/
  app/(auth)/login/          — Two-tab login (Judge / Organizer)
  app/(dashboard)/           — DashboardShell + organizer/judge/captain pages
  features/                  — competition, judging, scoring, tabulation, users
  shared/components/         — common/ (design system) + ui/ (primitives)
  shared/lib/                — auth.ts, auth-guards.ts, rate-limit.ts, prisma.ts
  shared/constants/kcbs.ts   — Scoring rules, categories, enums
  middleware.ts              — Role-based route protection
prisma/schema.prisma         — Data models
```

## Feature Module Pattern

Each `src/features/<name>/` has: `components/`, `hooks/`, `store/`, `actions/`, `schemas/`, `types/`, `utils/`, `index.ts` (barrel export — only public API). Nothing leaks outside `index.ts`.

## Path Aliases

`@/*` → `src/*`, `@features/*` → `src/features/*`, `@shared/*` → `src/shared/*`

## Commands

```bash
npm run dev          # Start dev server (port 3030)
npm run build        # Production build
npm run lint         # ESLint
npm test             # Unit tests (Vitest)
npm run db:migrate   # Prisma migrations
npm run db:seed      # Seed dev data
npm run db:reset     # Reset DB + re-seed
```

## Auth (Brief)

- **Judge**: CBJ number + PIN → `/judge` or `/captain`
- **Organizer**: email + password → `/organizer`
- JWT strategy, 24h expiry. Guards: `requireAuth()`, `requireOrganizer()`, `requireJudge()`, `requireCaptain()`
- **All server actions start with an auth guard.** Captain actions verify table ownership. See [docs/reference/auth.md](docs/reference/auth.md).

## Business Rules

- **BR-1**: Categories advance sequentially (Chicken → Ribs → Pork → Brisket). Organizer-only.
- **BR-2**: No repeat competitor at same table across rounds.
- **BR-3**: Submitted score cards are locked. Corrections via table captain.
- **BR-4**: Never show team names to judges — anonymous 3-digit numbers only.
- **BR-5**: Never show other judges' scores during active judging.
- **BR-6**: Captain can't submit until all judges done + corrections resolved.
- **Tables**: Max 6 judge seats. Captain separate from seats.

## KCBS Scoring

- Valid scores: 1, 2, 5, 6, 7, 8, 9. DQ = 1.
- Weights: Appearance × 0.56, Taste × 2.2972, Texture × 1.1428. Max = 36/judge.
- Drop lowest of 6, top 5 count. Perfect = 180.
- Tiebreak: Taste → Texture → Appearance → dropped score → coin toss.
- Constants in `src/shared/constants/kcbs.ts`.

## Seed Data

- Competition: "American Royal Open 2026" (ACTIVE), judgePin: "1234"
- Organizer: organizer@bbq-judge.test / organizer123
- 24 Judges: 100001–100024, PIN: 1234. Captains: 100001, 100007, 100013, 100019
- 24 BBQ Teams: 101–124 (16 checked in). Chicken ACTIVE, rest PENDING.
- Table 1 has pre-filled Chicken scores; competitor 104 has DQ + pending correction.

## Testing

7 test files, 113 tests. Pure utils extracted for testability: `validateNoRepeatCompetitor()`, `generateBoxDistribution()`, `tabulateCategory()`, `calcWeightedTotal()`. See [docs/how-to/run-tests.md](docs/how-to/run-tests.md).

### E2E Competition Simulation

```bash
npx tsx scripts/simulate-competition.ts
```

Runs a full KCBS competition lifecycle (seed → distribute → score 4 categories → tabulate → validate) with 2000+ assertions. Generates a markdown report at `reports/simulation-report.md` with standings, per-category results, and validation summaries. Run `npm run db:reset` afterward to restore dev seed data.

## Documentation

Full docs in `docs/` following the [Diataxis framework](https://diataxis.fr/):

- **Tutorials**: [getting-started](docs/tutorials/getting-started.md), [first-competition](docs/tutorials/first-competition.md)
- **How-to**: [add-a-feature-module](docs/how-to/add-a-feature-module.md), [run-tests](docs/how-to/run-tests.md), [manage-database](docs/how-to/manage-database.md)
- **Reference**: [architecture](docs/reference/architecture.md), [auth](docs/reference/auth.md), [scoring-rules](docs/reference/scoring-rules.md), [api](docs/reference/api.md), [seed-data](docs/reference/seed-data.md), [database-schema](docs/reference/database-schema.md)
- **Explanation**: [judge-flow](docs/explanation/judge-flow.md), [security-model](docs/explanation/security-model.md), [box-distribution](docs/explanation/box-distribution.md)
