# Seed Data Reference

The seed script (`prisma/seed.ts`) creates a complete test environment. Run with `npm run db:seed`.

## Login Credentials

| Role | Login | Password |
|------|-------|----------|
| Organizer | organizer@bbq-judge.test | organizer123 |
| Table 1 Captain | 100001 | 1234 |
| Table 2 Captain | 100007 | 1234 |
| Table 3 Captain | 100013 | 1234 |
| Table 4 Captain | 100019 | 1234 |
| Judges | 100002-100006, 100008-100012, 100014-100018, 100020-100024 | 1234 |

Judge login uses the **Judge** tab (CBJ number + PIN). Organizer login uses the **Organizer** tab (email + password).

## Competition

- **Name**: American Royal Open 2026
- **Status**: ACTIVE
- **Judge PIN**: 1234 (shared competition PIN)
- **Comment cards**: Disabled by default

## Judges (24 total)

- CBJ numbers: 100001-100024
- All PIN: 1234
- All checked in (`CompetitionJudge.checkedIn: true`)
- Distributed across 4 tables (6 per table)

## Tables (4)

| Table | Captain (CBJ) | Judges (CBJ) |
|-------|---------------|---------------|
| Table 1 | 100001 | 100001-100006 |
| Table 2 | 100007 | 100007-100012 |
| Table 3 | 100013 | 100013-100018 |
| Table 4 | 100019 | 100019-100024 |

## BBQ Teams (24)

- Anonymous numbers: 101-124
- **16 checked in**, 8 not checked in
- Team names are visible to organizers only (BR-4)

## Category Rounds

| Category | Order | Status |
|----------|-------|--------|
| Chicken | 1 | ACTIVE |
| Pork Ribs | 2 | PENDING |
| Pork | 3 | PENDING |
| Brisket | 4 | PENDING |

## Pre-filled Scores

**Table 1, Chicken round** has pre-submitted score cards for competitors 101-104:
- All 6 judges have submitted scores
- **Competitor 104** has a DQ score (appearance = 1) with a **pending correction request**
- Tables 2-4 have no scores yet

## Resetting

```bash
npm run db:reset    # Drop all tables, re-migrate, re-seed
npm run db:seed     # Re-seed only (may fail if data exists)
```
