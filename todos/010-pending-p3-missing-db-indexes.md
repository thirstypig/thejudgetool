---
status: pending
priority: p3
issue_id: "010"
tags: [code-review, performance]
dependencies: []
---

# Missing database indexes on AuditLog and CategoryRound queries

## Problem Statement

Several queries used in polling paths lack supporting indexes:
- `AuditLog(competitionId, action, entityId, entityType)` — used by `isCategorySubmittedByTable`
- `CategoryRound` ordering/filtering queries

Flagged by: Performance Oracle, Architecture Strategist.

## Proposed Solutions

### Option A: Add composite indexes
- Add `@@index([competitionId, action, entityType])` on AuditLog
- **Effort:** Small
- **Risk:** Low

## Acceptance Criteria

- [ ] Composite index on AuditLog for common query pattern
- [ ] Migration applied

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | |
