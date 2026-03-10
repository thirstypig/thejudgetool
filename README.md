# BBQ Judge

A web application for managing KCBS-style BBQ competitions. Organizers create competitions, register competitors, assign judges to tables, and advance through judging rounds. Judges score entries on appearance, taste, and texture. Table captains oversee scoring at their table.

## Setup

Install dependencies:

```bash
npm install
```

Set up the database (requires a Supabase Postgres instance):

```bash
cp .env.example .env  # Fill in your Supabase DATABASE_URL, DIRECT_URL, and AUTH_SECRET
npm run db:migrate
npm run db:seed
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3030](http://localhost:3030).

## Environment Variables

Create a `.env` file (see `.env.example`):

```
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
AUTH_SECRET="generate-a-random-secret-here"
AUTH_URL="http://localhost:3030"
```

- `DATABASE_URL` — Supabase pooled connection (uses pgbouncer)
- `DIRECT_URL` — Supabase direct connection (required by Prisma for migrations)
- `AUTH_SECRET` — Random secret for JWT signing (use `openssl rand -base64 32`)

## Login Credentials (Dev Seed)

| Role | Login | Password |
|------|-------|----------|
| Organizer | organizer@bbq-judge.test | organizer123 |
| Table 1 Captain | 100001 | 1234 |
| Table 2 Captain | 100007 | 1234 |
| Table 3 Captain | 100013 | 1234 |
| Table 4 Captain | 100019 | 1234 |
| Judges | 100002–100006, 100008–100012, 100014–100018, 100020–100024 | 1234 |

### Seed Data Summary

- **Competition**: American Royal Open 2026 (ACTIVE)
- **24 judges** across 4 tables (6 per table)
- **24 BBQ teams**: anonymous numbers 101–124 (16 checked in, 8 not)
- **Chicken round** is ACTIVE with pre-submitted scores for Table 1 (competitors 101–104)
- **Competitor 104** has a DQ score (appearance=1) with a pending correction request
- **Tables 2–4** have no scores yet
- **Categories**: Chicken (ACTIVE), Pork Ribs, Pork, Brisket (PENDING)

## Tech Stack

- [Next.js 14](https://nextjs.org) (App Router)
- [TypeScript](https://typescriptlang.org) (strict mode)
- [Tailwind CSS v3](https://tailwindcss.com)
- [Prisma 5](https://prisma.io) + Supabase (Postgres)
- [next-auth v5](https://authjs.dev) (beta)
- [Zustand](https://zustand.docs.pmnd.rs)
- [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev)
- [Vitest](https://vitest.dev) for unit testing

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed development data |
| `npm run db:reset` | Reset database and re-seed |

## Project Structure

```
src/
  app/                    — Next.js App Router pages
    (auth)/login/         — Two-tab login (Judge / Organizer)
    (dashboard)/          — Dashboard shell (sidebar, top bar, mobile drawer)
      organizer/          — Competition management pages
        [competitionId]/
          teams/          — BBQ team roster, check-in, box distribution
          judges/         — Judge roster, check-in, table assignments
          competition/    — Category stepper, comment cards toggle
          results/        — Progress, leaderboard, score audit, audit log
      judge/              — Judge scoring dashboard
      captain/            — Table captain review dashboard
  features/               — Feature modules
    competition/          — Competition CRUD, CompetitionProvider context
    judging/              — Judge scoring, comment cards
    scoring/              — Table captain scoring review
    tabulation/           — Results tabulation
    users/                — Judge import
  shared/                 — Shared code
    components/           — Design system + UI primitives
    constants/            — KCBS rules and enums
    lib/                  — Auth, Prisma, rate limiting, utilities
  middleware.ts           — Role-based route protection
prisma/
  schema.prisma           — Database schema
  seed.ts                 — Development seed data
```

## Features

### Auth & Navigation

- Two-tab login page: Judge (CBJ number + PIN) / Organizer (email + password)
- Role-based routing: middleware redirects to `/judge`, `/captain`, or `/organizer`
- Protected routes with callback URL redirect
- Dashboard shell with collapsible sidebar (Sheet drawer on mobile)
- Role-filtered navigation, competition selector, theme toggle, user menu
- Rate limiting on login (5 attempts per 15 minutes)
- Passwords and PINs hashed with bcrypt

### Competition Management

- Create competitions with name, date, and location
- Register BBQ teams with anonymous 3-digit numbers and check-in tracking
- Assign judges to tables (6 seats per table) with captain designation
- Visual status stepper for category round progression
- Sequential category advancement (Chicken → Pork Ribs → Pork → Brisket)
- Box distribution algorithm with BR-2 validation

### Judging

- Active category banner with progress ring
- Multi-phase scoring: event info → box entry → appearance → taste/texture → comment cards
- Score picker with valid KCBS scores only (1, 2, 5, 6, 7, 8, 9)
- DQ warning when any dimension scores 1
- Score cards lock on submission; corrections via table captain
- Anonymous numbers only — team names never shown to judges (BR-4)
- Other judges' scores never visible during active judging (BR-5)
- Adjustable font size for scoring screens

### Table Captain / Scoring

- Per-judge progress tracking with status badges
- Score review table with DQ highlighting
- Correction request management (approve unlocks card, deny keeps lock)
- Submit category to organizer with validation (all judges done, no pending corrections)

### Tabulation & Results

- Live progress dashboard per category (15s polling)
- Ranked leaderboard with expandable per-judge score breakdowns
- Score audit view with per-judge formula breakdown
- Outlier detection (>2 pts from average)
- Winner declaration with confirmation and audit logging
- Export results as CSV or JSON
- Audit log viewer with filtering

## KCBS Scoring Rules

- **Categories**: Chicken, Pork Ribs, Pork, Brisket (mandatory, judged sequentially)
- **Valid scores**: 1, 2, 5, 6, 7, 8, 9 (scores of 0, 3, 4 are not used)
- **Score of 1**: DQ/Penalty (requires KCBS Rep approval)
- **Score of 9**: Excellent
- **Three dimensions**: Appearance (×0.56), Taste (×2.2972), Texture (×1.1428)
- **Max weighted score per judge**: 36
- **Drop lowest**: 6 judges per table, lowest dropped, top 5 count. Perfect score = 180
- **Tiebreaking**: Taste → Texture → Appearance → dropped score → deterministic coin toss
- **No repeat competitors**: Same competitor cannot appear at the same table twice (BR-2)
- **Locked scores**: Submitted cards are locked; corrections via table captain (BR-3)
- **Captain gate**: Cannot submit until all judges done and corrections resolved (BR-6)
