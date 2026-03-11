---
status: pending
priority: p1
issue_id: "048"
tags: [code-review, security, race-condition]
dependencies: []
---

# TOCTOU Race Condition in generateJudgePin

## Problem Statement

`generateJudgePin` (actions/index.ts:364-385) checks `judgePinLocked` in one query, then updates the PIN in a separate query. Two concurrent organizer requests could both read `judgePinLocked = false` and both overwrite the PIN. The lock check and PIN update are not atomic.

## Findings

- **Source**: Data Integrity Guardian, Security Sentinel
- **Evidence**: Lines 368-374 read lock state, lines 376-381 update PIN — separate queries, no transaction.

## Proposed Solutions

### Option A: Wrap in transaction
```typescript
await prisma.$transaction(async (tx) => {
  const comp = await tx.competition.findUniqueOrThrow({ where: { id: competitionId }, select: { judgePinLocked: true } });
  if (comp.judgePinLocked) throw new Error("PIN is locked");
  const pin = String(Math.floor(1000 + Math.random() * 9000));
  await tx.competition.update({ where: { id: competitionId }, data: { judgePin: pin } });
  return pin;
});
```
- **Pros**: Atomic. **Cons**: None. **Effort**: Small. **Risk**: None.

### Option B: Atomic conditional update
```typescript
const result = await prisma.competition.updateMany({ where: { id: competitionId, judgePinLocked: false }, data: { judgePin: pin } });
if (result.count === 0) throw new Error("PIN is locked");
```
- **Pros**: Single query, no transaction needed. **Cons**: Slightly less clear. **Effort**: Small. **Risk**: None.

## Acceptance Criteria

- [ ] Lock check and PIN update are atomic
