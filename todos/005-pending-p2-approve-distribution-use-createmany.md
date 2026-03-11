---
status: pending
priority: p2
issue_id: "005"
tags: [code-review, performance]
dependencies: []
---

# approveDistribution creates 96 individual INSERTs — use createMany

## Problem Statement

`approveDistribution` creates Submission records one at a time in a loop. For 4 categories x 4 tables x 6 competitors = 96 individual INSERT statements. Should use `prisma.submission.createMany()` for a single batch insert.

Flagged by: Performance Oracle.

## Findings

- **Location:** `src/features/competition/actions/index.ts` inside approveDistribution transaction

## Proposed Solutions

### Option A: Use createMany (Recommended)
- Build array of submission data, call `prisma.submission.createMany({ data: submissions })`
- **Effort:** Small
- **Risk:** Low

## Acceptance Criteria

- [ ] Uses createMany instead of individual creates
- [ ] Same Submission records created

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | |
