---
status: pending
priority: p1
issue_id: "002"
tags: [code-review, data-integrity, bug]
dependencies: []
---

# isCategorySubmittedByTable doesn't filter by table

## Problem Statement

`isCategorySubmittedByTable(tableId, categoryRoundId)` in `src/features/scoring/actions/index.ts` queries the AuditLog for a `SUBMIT_CATEGORY` entry but does NOT filter by the specific table. It returns `true` if ANY table has submitted that category, not the specified table. This will cause incorrect captain phase detection in multi-table competitions.

Flagged independently by: TypeScript Reviewer, Data Integrity Guardian.

## Findings

- **Location:** `src/features/scoring/actions/index.ts` lines 217-236
- **Bug:** The `entityId` check likely uses `categoryRoundId` alone, not `tableId:categoryRoundId` or similar composite
- **Impact:** Captain sees "category submitted" even if a different table submitted
- **Auth issue:** Uses `requireAuth()` instead of `requireCaptain()`

## Proposed Solutions

### Option A: Fix the AuditLog query filter (Recommended)
- Include `tableId` in the `entityId` or add a separate field to AuditLog entries
- Change auth guard to `requireCaptain()`
- **Effort:** Small
- **Risk:** Low

## Acceptance Criteria

- [ ] Query filters by both tableId and categoryRoundId
- [ ] Auth uses `requireCaptain()` not `requireAuth()`
- [ ] Multi-table competition: Table 1 submit does not affect Table 2 captain

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | Flagged by 2 agents |
