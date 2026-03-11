---
status: complete
priority: p2
issue_id: "020"
tags: [code-review, performance, database]
dependencies: []
---

# N+1 ScoreCard Counts in `getTableScoringStatus`

## Problem Statement

`getTableScoringStatus` fetches each judge's submission count individually, resulting in N+1 queries (1 for assignments + N for each judge's count). With 6 judges per table and 5s polling, this generates 7 queries per poll just for status.

## Findings

**File:** `src/features/scoring/actions/index.ts` — `getTableScoringStatus`

## Proposed Solutions

### Solution A: Use `_count` in a single query
Prisma supports `include: { _count: { select: { scoreCards: true } } }` to get counts in a single query.
- **Effort:** Small
- **Risk:** None

## Acceptance Criteria

- [ ] Status check uses a single query instead of N+1
