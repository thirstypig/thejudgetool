---
status: pending
priority: p2
issue_id: "032"
tags: [code-review, performance]
dependencies: []
---

# registerJudgesBulkForCompetition: N+1 sequential queries

## Problem Statement

`registerJudgesBulkForCompetition` in `src/features/competition/actions/index.ts` (lines 293-314) processes each userId in a sequential loop with findUnique + create, same pattern as addCompetitorsBulk.

Flagged by: Performance Oracle (CRITICAL-2), TypeScript Reviewer (#1).

## Proposed Solutions

Replace with `createMany` + `skipDuplicates`:
```typescript
await prisma.competitionJudge.createMany({
  data: userIds.map((userId) => ({ competitionId, userId })),
  skipDuplicates: true,
});
```

- Effort: Small
- Risk: Low

## Acceptance Criteria

- [ ] Uses createMany with skipDuplicates
- [ ] Add array length validation (max 100)

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | — |
