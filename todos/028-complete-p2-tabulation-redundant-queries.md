---
status: pending
priority: p2
issue_id: "028"
tags: [code-review, performance]
dependencies: []
---

# getAllCategoryResults: Redundant N+1 queries per category

## Problem Statement

`getAllCategoryResults` in `src/features/tabulation/actions/index.ts` (lines 166-184) calls `tabulateCategory` independently for each of 4 categories. Each call repeats `requireOrganizer()`, fetches all submissions for one round, and fetches the same `DECLARE_WINNER` audit logs for the entire competition. This results in 12+ queries where 3 would suffice.

Flagged by: Performance Oracle (CRITICAL-3).

## Findings

- 4x `requireOrganizer()` auth checks (identical)
- 4x `submission.findMany` (could be 1 query across all rounds)
- 4x identical `auditLog.findMany` for DECLARE_WINNER (same query repeated)
- Called every 15 seconds via polling on the results page

## Proposed Solutions

### Option A: Single-pass fetch with in-memory grouping

Fetch all submissions and audit logs in 3 parallel queries, group by categoryRoundId in memory, then tabulate each.

- Pros: Reduces 12+ queries to 3. Eliminates redundant auth checks.
- Cons: Requires refactoring tabulateCategory to accept pre-fetched data.
- Effort: Medium
- Risk: Low

## Acceptance Criteria

- [ ] Single auth check, single submissions query, single audit log query
- [ ] Results identical to current implementation
- [ ] Existing tabulation tests still pass

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | — |
