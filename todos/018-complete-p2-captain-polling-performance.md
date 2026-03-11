---
status: complete
priority: p2
issue_id: "018"
tags: [code-review, performance]
dependencies: []
---

# Captain Dashboard Fires 6 Server Actions Every 5 Seconds

## Problem Statement

`CaptainDashboardClient` calls `loadData()` every 5 seconds, which fires 6 independent server actions (getJudgeSession, getTableScoringStatus, getScoreCardsForTable, getCorrectionRequests, getTableCommentCards, plus router.refresh). Each action makes multiple DB queries, resulting in ~20+ DB queries per poll cycle per captain.

## Findings

**File:** `src/app/(dashboard)/captain/CaptainDashboardClient.tsx` — `loadData` + polling interval

## Proposed Solutions

### Solution A: Consolidate into single server action
Create `getCaptainDashboardData(competitionId)` that returns all data in one round-trip with optimized queries.
- **Effort:** Medium
- **Risk:** Low

### Solution B: Increase poll interval
Change from 5s to 15-30s. Captain doesn't need real-time updates.
- **Effort:** Small
- **Risk:** Slightly stale data

## Acceptance Criteria

- [ ] Polling generates fewer than 10 DB queries per cycle
