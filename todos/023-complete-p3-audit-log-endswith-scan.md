---
status: complete
priority: p3
issue_id: "023"
tags: [code-review, performance, database]
dependencies: []
---

# `endsWith` on AuditLog entityId Forces Full Table Scan

## Problem Statement

Multiple queries use `entityId: { endsWith: ':${categoryRoundId}' }` on AuditLog. The `endsWith` operator cannot use a B-tree index, forcing a sequential scan on the audit log table.

## Findings

**Files:** `src/features/scoring/actions/index.ts`, `src/features/competition/actions/index.ts`

## Proposed Solutions

### Solution A: Add separate `categoryRoundId` column to AuditLog
- **Effort:** Medium — migration + update all log writes
- **Risk:** Low

### Solution B: Use `startsWith` with `tableId:categoryRoundId` format
Reverse the compound key format so the more selective field is first.
- **Effort:** Medium — update all reads/writes

### Solution C: Accept for now
Audit log table is small in practice (dozens of rows per competition). Full scan is fine at this scale.
- **Effort:** None

## Acceptance Criteria

- [ ] Decision made on approach
