---
status: complete
priority: p2
issue_id: "016"
tags: [code-review, architecture, data-integrity]
dependencies: []
---

# Auto-SUBMITTED Transition Not in a Transaction

## Problem Statement

In `submitCategoryToOrganizer`, the check for "all tables submitted" and the subsequent `CategoryRound.update` to SUBMITTED are not wrapped in a transaction. If two captains submit simultaneously, both could read incomplete state and neither triggers the transition, or both could trigger it.

## Findings

**File:** `src/features/scoring/actions/index.ts` — end of `submitCategoryToOrganizer`

The audit log count query and the status update are separate operations outside a transaction.

## Proposed Solutions

### Solution A: Wrap in Prisma transaction (Recommended)
Use `prisma.$transaction()` to atomically check all submissions and update the round status.
- **Effort:** Small
- **Risk:** Low — idempotent update

### Solution B: Use Prisma's conditional update
```typescript
await prisma.categoryRound.updateMany({
  where: { id: categoryRoundId, status: "ACTIVE" },
  data: { status: "SUBMITTED" },
});
```
- **Effort:** Small — already idempotent

## Acceptance Criteria

- [ ] Concurrent submissions don't skip or double-trigger the transition
