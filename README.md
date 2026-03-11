# BBQ Judge

A web application for managing KCBS-style BBQ competitions. Organizers create competitions, register competitors, assign judges to tables, and advance through judging rounds. Judges score entries on appearance, taste, and texture. Table captains oversee scoring at their table.

## Quick Start

```bash
npm install
cp .env.example .env        # Fill in DATABASE_URL, DIRECT_URL, AUTH_SECRET
npm run db:migrate && npm run db:seed
npm run dev                  # http://localhost:3030
```

See [Getting Started](docs/tutorials/getting-started.md) for the full setup walkthrough.

## Login Credentials (Dev Seed)

| Role | Login | Password |
|------|-------|----------|
| Organizer | organizer@bbq-judge.test | organizer123 |
| Table Captain | 100001 | 1234 |
| Judge | 100002 | 1234 |

All 24 judges (100001-100024) use PIN 1234. Captains: 100001, 100007, 100013, 100019. See [seed data reference](docs/reference/seed-data.md) for full details.

## Tech Stack

Next.js 14 (App Router) | TypeScript | Tailwind CSS v3 | Prisma 5 + Supabase | next-auth v5 | Zustand | React Hook Form + Zod | Vitest

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed development data |
| `npm run db:reset` | Reset database and re-seed |

## Documentation

Documentation follows the [Diataxis framework](https://diataxis.fr/) — organized by purpose:

### Tutorials (learning-oriented)
- [Getting Started](docs/tutorials/getting-started.md) — First-time setup walkthrough
- [Your First Competition](docs/tutorials/first-competition.md) — Run a full judging round end-to-end

### How-To Guides (task-oriented)
- [Add a Feature Module](docs/how-to/add-a-feature-module.md) — Create a new feature following project patterns
- [Run Tests](docs/how-to/run-tests.md) — Run, write, and debug unit tests
- [Manage the Database](docs/how-to/manage-database.md) — Migrations, seeding, resetting

### Reference (information-oriented)
- [Architecture](docs/reference/architecture.md) — Project structure, design system, tech stack
- [Auth](docs/reference/auth.md) — Providers, guards, middleware, security headers
- [Scoring Rules](docs/reference/scoring-rules.md) — KCBS scoring, weights, tiebreaking, business rules
- [Server Actions API](docs/reference/api.md) — All actions by feature module
- [Seed Data](docs/reference/seed-data.md) — Dev credentials, teams, tables, pre-filled scores
- [Database Schema](docs/reference/database-schema.md) — Prisma models and relationships

### Explanation (understanding-oriented)
- [Judge Flow](docs/explanation/judge-flow.md) — Why the multi-phase judge experience works this way
- [Security Model](docs/explanation/security-model.md) — Design rationale for auth and access control
- [Box Distribution](docs/explanation/box-distribution.md) — Algorithm design and BR-2 constraint
