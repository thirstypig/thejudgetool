# Getting Started

A step-by-step guide to setting up BBQ Judge for local development.

## Prerequisites

- **Node.js 18+** (LTS recommended)
- **npm** (comes with Node.js)
- A **Supabase** account (free tier works) for the Postgres database

## 1. Clone and Install

```bash
git clone <repo-url>
cd bbq-judge
npm install
```

## 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings > Database** and copy:
   - **Connection string (pooler)** — this is your `DATABASE_URL`
   - **Connection string (direct)** — this is your `DIRECT_URL`

## 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
AUTH_SECRET="generate-a-random-secret-here"
AUTH_URL="http://localhost:3030"
```

Generate `AUTH_SECRET` with:

```bash
openssl rand -base64 32
```

## 4. Initialize the Database

Run Prisma migrations to create tables, then seed with sample data:

```bash
npm run db:migrate
npm run db:seed
```

## 5. Start the Dev Server

```bash
npm run dev
```

Open [http://localhost:3030](http://localhost:3030).

## 6. Log In

The seed data creates test accounts. Try these:

| Role | Login | Password |
|------|-------|----------|
| Organizer | organizer@bbq-judge.test | organizer123 |
| Table Captain (Table 1) | 100001 | 1234 |
| Judge | 100002 | 1234 |

The login page has two tabs: **Judge** (CBJ number + PIN) and **Organizer** (email + password). After login, you're redirected based on your role.

## Next Steps

- [Run your first competition](./first-competition.md) — walkthrough of a full judging round
- [Project architecture](../reference/architecture.md) — understand the codebase
- [Run tests](../how-to/run-tests.md) — verify everything works
