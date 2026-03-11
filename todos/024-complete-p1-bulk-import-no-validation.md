---
status: pending
priority: p1
issue_id: "024"
tags: [code-review, security, performance]
dependencies: []
---

# addCompetitorsBulk: No input validation + N+1 sequential queries

## Problem Statement

`addCompetitorsBulk` in `src/features/competition/actions/index.ts` (lines 140-176) accepts a raw array of team objects with zero Zod validation and processes them in a sequential N+1 loop. The single-competitor `addCompetitor` validates via `competitorSchema.parse(data)`, but the bulk variant skips this entirely.

Flagged by: Security Sentinel (C-1), Performance Oracle (CRITICAL-1), TypeScript Reviewer (#1).

## Findings

- **No Zod validation**: `anonymousNumber` bypasses the `^\d{1,4}$` regex. `teamName` bypasses `min(1)`.
- **No array length limit**: A malicious payload of thousands of entries causes DoS via sequential DB writes.
- **N+1 queries**: For N teams, executes up to 2N sequential round trips (findUnique + create per team).
- **No transaction**: Partial failures leave inconsistent state.
- **`competitionId` not validated**: No check that it belongs to the calling organizer.

## Proposed Solutions

### Option A: createMany + skipDuplicates (Recommended)

```typescript
const bulkSchema = z.array(competitorSchema).min(1).max(200);

export async function addCompetitorsBulk(competitionId: string, teams: unknown) {
  await requireOrganizer();
  const parsed = bulkSchema.parse(teams);

  const beforeCount = await prisma.competitor.count({ where: { competitionId } });
  await prisma.competitor.createMany({
    data: parsed.map((t) => ({
      competitionId,
      teamName: t.teamName,
      anonymousNumber: t.anonymousNumber,
      headCookName: t.headCookName || null,
      headCookKcbsNumber: t.headCookKcbsNumber || null,
    })),
    skipDuplicates: true,
  });
  const afterCount = await prisma.competitor.count({ where: { competitionId } });
  return { added: afterCount - beforeCount, skipped: parsed.length - (afterCount - beforeCount) };
}
```

- Pros: Reduces 2N queries to 3. Adds validation. Atomic.
- Cons: None significant.
- Effort: Small
- Risk: Low

## Acceptance Criteria

- [ ] Input validated with Zod schema (reuse competitorSchema) with max array length
- [ ] Uses createMany with skipDuplicates instead of sequential loop
- [ ] Tests pass

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | — |
