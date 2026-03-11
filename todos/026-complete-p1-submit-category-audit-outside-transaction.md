---
status: pending
priority: p1
issue_id: "026"
tags: [code-review, security, race-condition]
dependencies: []
---

# submitCategoryToOrganizer: Audit log created outside transaction (race condition)

## Problem Statement

In `src/features/scoring/actions/index.ts` (lines 277-351), the `submitCategoryToOrganizer` function creates the `SUBMIT_CATEGORY` audit log entry OUTSIDE the transaction that checks whether all tables have submitted. This creates a TOCTOU race condition.

Flagged by: Security Sentinel (H-1), TypeScript Reviewer (#3). Note: todo 016 marked this "complete" but the audit log placement issue persists.

## Findings

- **Line 309**: Audit log created via `prisma.auditLog.create()` (outside transaction)
- **Line 321**: Transaction reads audit logs to check all-tables-submitted
- **Race**: Two concurrent captain submissions could both create audit logs before either transaction runs
- **False positive**: If the transaction fails, the audit log persists as a false record of submission

## Proposed Solutions

### Option A: Move audit log inside transaction (Recommended)

```typescript
await prisma.$transaction(async (tx) => {
  await tx.auditLog.create({
    data: { competitionId, actorId: captainId, action: "SUBMIT_CATEGORY",
            entityId: `${tableId}:${categoryRoundId}`, entityType: "CategoryRound" },
  });
  const allTables = await tx.table.findMany({ where: { competitionId }, select: { id: true } });
  const submitLogs = await tx.auditLog.findMany({ ... });
  // ... check and transition
});
```

- Pros: Eliminates race condition. Audit log only persists if transaction succeeds.
- Cons: Slightly larger transaction scope.
- Effort: Small
- Risk: Low

## Acceptance Criteria

- [ ] Audit log creation is inside the transaction
- [ ] CategoryRound transition only occurs when all tables genuinely submitted
- [ ] No orphaned audit logs on transaction failure

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | Related to completed todo 016 but different issue |
