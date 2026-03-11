---
status: pending
priority: p2
issue_id: "051"
tags: [code-review, performance]
dependencies: []
---

# AuditLog `endsWith` Filter Causes Sequential Scan

## Problem Statement

`advanceCategoryRound` and `markCategoryRoundSubmittedIfReady` use `entityId: { endsWith: ':categoryRoundId' }` which translates to `LIKE '%:abc'` — preventing index usage. The AuditLog table grows monotonically.

## Findings

- **Source**: Performance Oracle
- Lines 589-594 and 1022-1028 in `competition/actions/index.ts`
- The existing `@@index([competitionId, action, entityType])` narrows the scan but `entityId` filtering is still a post-filter

## Proposed Solutions

### Option A: Reverse entityId format, use `startsWith`
- Store as `categoryRoundId:tableId` instead of `tableId:categoryRoundId`
- Query with `startsWith` which can use an index
- **Effort**: Small (update format + existing data). **Risk**: Low.

### Option B: Add separate columns to AuditLog
- Add `categoryRoundId` and `tableId` columns, query directly
- **Effort**: Medium (migration + update all writes). **Risk**: Low.

## Acceptance Criteria

- [ ] No `endsWith` filters on AuditLog queries
- [ ] Index-friendly query pattern
