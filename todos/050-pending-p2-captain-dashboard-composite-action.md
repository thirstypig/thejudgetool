---
status: pending
priority: p2
issue_id: "050"
tags: [code-review, performance]
dependencies: []
---

# Captain Dashboard: 5 Parallel Actions with Redundant Auth Checks

## Problem Statement

`CaptainDashboardClient` polls 5 server actions every 15 seconds. Each performs its own auth check + table ownership verification (2 queries each), resulting in ~30 database queries per poll cycle. ~60% of queries are redundant auth/ownership checks.

## Findings

- **Source**: Performance Oracle
- Each of the 5 scoring actions in `scoring/actions/index.ts` has duplicate `findFirst` for captain ownership + organizer role check
- At 4 captains polling simultaneously = ~120 queries per 15 seconds = ~8 qps of redundant auth

## Proposed Solutions

### Option A: Create composite `getCaptainDashboardData` action
- Single auth check, single ownership verification, batch data queries
- Reduces per-poll queries from ~30 to ~10
- **Effort**: Medium. **Risk**: Low.

## Acceptance Criteria

- [ ] Captain dashboard uses single composite server action
- [ ] Auth/ownership checked once per poll, not 5 times
