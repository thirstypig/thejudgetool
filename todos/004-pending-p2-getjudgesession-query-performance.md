---
status: pending
priority: p2
issue_id: "004"
tags: [code-review, performance]
dependencies: []
---

# getJudgeSession makes 5-7 sequential DB queries per poll (336+ queries/min with 12 judges)

## Problem Statement

`getJudgeSession()` makes 5-7 sequential database queries every 15 seconds per judge. With 12 judges polling, this creates 336-384 queries/minute. The queries for competition, registration, active category, and submissions could be batched.

Flagged by: Performance Oracle, Architecture Strategist.

## Findings

- **Location:** `src/features/judging/actions/index.ts` lines 116-224
- Sequential queries: findUnique(user), findFirst(assignment), findUnique(competition), findUnique(registration), findFirst(activeCategory), findMany(submissions), count(commentCards)

## Proposed Solutions

### Option A: Consolidate with Prisma includes
- Use nested `include` on the initial user/assignment query to fetch related data in fewer round trips
- **Effort:** Medium
- **Risk:** Low

### Option B: Add stale-while-revalidate caching
- Cache session data for 5-10 seconds, return cached on subsequent polls
- **Effort:** Medium
- **Risk:** Medium (stale data risk)

## Acceptance Criteria

- [ ] getJudgeSession uses 2-3 queries max instead of 5-7
- [ ] All existing test behavior preserved

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | |
