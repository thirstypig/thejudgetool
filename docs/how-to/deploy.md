# How to Deploy

> **Status**: Deployment is not yet configured. This is a placeholder for future documentation.

## Prerequisites

- A hosting platform that supports Next.js 14 (Vercel, Railway, etc.)
- A Supabase Postgres database (production instance)
- Environment variables configured on the hosting platform

## Environment Variables

Set these in your hosting platform:

```
DATABASE_URL=<production pooled connection>
DIRECT_URL=<production direct connection>
AUTH_SECRET=<production secret>
AUTH_URL=<production URL>
```

## Build

```bash
npm run build
```

## Database Migrations

Run migrations against production before deploying:

```bash
DATABASE_URL=<prod-url> DIRECT_URL=<prod-direct-url> npx prisma migrate deploy
```

## TODO

- [ ] Choose hosting platform
- [ ] Configure CI/CD pipeline
- [ ] Set up production Supabase instance
- [ ] Configure production environment variables
- [ ] Set up monitoring and error tracking
