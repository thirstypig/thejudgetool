---
status: pending
priority: p2
issue_id: "052"
tags: [code-review, performance]
dependencies: []
---

# randomAssignTables: N Sequential Queries in Transaction

## Problem Statement

`randomAssignTables` executes 2-4 queries per judge inside a transaction loop. With 24 unassigned judges, that's 72-96 sequential queries taking 360ms-1.9s over network to Supabase.

## Findings

- **Source**: Performance Oracle
- Lines 732-765 in `competition/actions/index.ts`

## Proposed Solutions

### Option A: Pre-fetch + batch createMany
- Pre-fetch all tables and existing assignments before transaction
- Build assignment data in memory, use `createMany` in transaction
- **Effort**: Medium. **Risk**: Low.

## Acceptance Criteria

- [ ] Bulk assignment uses fewer than 10 queries regardless of judge count
