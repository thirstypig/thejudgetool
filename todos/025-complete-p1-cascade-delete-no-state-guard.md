---
status: pending
priority: p1
issue_id: "025"
tags: [code-review, security, data-integrity]
dependencies: []
---

# approveDistribution and resetDistribution: No guard against deleting scored data

## Problem Statement

Both `approveDistribution` (lines 678-730) and `resetDistribution` (lines 802-831) in `src/features/competition/actions/index.ts` cascade-delete ALL CommentCards, CorrectionRequests, ScoreCards, and Submissions for the entire competition. Neither checks whether any category rounds are ACTIVE/SUBMITTED or whether any scores exist.

Flagged by: Security Sentinel (C-2), Architecture Strategist (P0 #1).

## Findings

- **No state guard**: If called during active judging, all judge scores are permanently destroyed.
- **No audit log**: The deletion is not logged.
- **UI-only protection**: `resetDistribution` dialog warns "only possible if no scoring has started" but the server does not enforce this.
- **approveDistribution previously had a guard** (checking `hasScores`) that was removed in this diff.

## Proposed Solutions

### Option A: Add server-side guard (Recommended)

```typescript
const hasLockedScores = await tx.scoreCard.findFirst({
  where: { submission: { categoryRound: { competitionId } }, locked: true },
});
if (hasLockedScores) {
  throw new Error("Cannot modify distribution after scoring has begun");
}
```

Add to both `approveDistribution` and `resetDistribution` before the cascade delete.

- Pros: Prevents irreversible data loss. Simple check.
- Cons: None.
- Effort: Small
- Risk: Low

## Acceptance Criteria

- [ ] Both functions reject if any locked score cards exist for the competition
- [ ] Error message is clear and actionable
- [ ] Audit log entry created before destructive operation

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | Guard was previously present but removed in this diff |
