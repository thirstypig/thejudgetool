# How to Manage the Database

## Database Setup

BBQ Judge uses **Supabase** (managed Postgres). You need two connection strings in `.env`:

```
DATABASE_URL="postgresql://...pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://...pooler.supabase.com:5432/postgres"
```

- `DATABASE_URL` — Pooled connection via pgbouncer (used at runtime)
- `DIRECT_URL` — Direct connection (required by Prisma for migrations)

## Common Commands

```bash
npm run db:migrate   # Apply pending migrations
npm run db:seed      # Seed development data
npm run db:reset     # Drop all tables, re-migrate, re-seed
```

## Running Migrations

After editing `prisma/schema.prisma`:

```bash
npx prisma migrate dev --name describe-your-change
```

This generates a migration file in `prisma/migrations/` and applies it.

To apply existing migrations (e.g., after pulling new code):

```bash
npm run db:migrate
```

## Seeding Data

The seed script (`prisma/seed.ts`) creates a full test environment:
- 1 competition, 24 judges, 24 teams, 4 tables
- Pre-filled scores for Table 1 Chicken round
- See [seed data reference](../reference/seed-data.md) for details

```bash
npm run db:seed
```

## Resetting the Database

To drop everything and start fresh:

```bash
npm run db:reset
```

This runs `prisma migrate reset` which drops all tables, re-applies migrations, and re-seeds.

## Prisma Studio

Browse your data in a web UI:

```bash
npx prisma studio
```

Opens at [http://localhost:5555](http://localhost:5555).

## Generating the Prisma Client

After schema changes (even without migrations):

```bash
npx prisma generate
```

This regenerates the TypeScript client so your code sees the updated types.

## Important Constraints

- **Prisma must stay on v5.** Prisma v7 uses `node:` protocol imports incompatible with Next.js 14. Do not upgrade.
- The Prisma singleton is at `src/shared/lib/prisma.ts` — always import from there.
