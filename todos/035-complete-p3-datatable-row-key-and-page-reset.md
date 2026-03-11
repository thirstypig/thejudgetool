---
status: pending
priority: p3
issue_id: "035"
tags: [code-review, quality, react]
dependencies: []
---

# DataTable: Array index as key + page not reset on data change

## Problem Statement

`src/shared/components/common/DataTable.tsx`:
1. Line 116: Uses array index as React key (`key={i}`), causing incorrect DOM recycling on filter/paginate.
2. Page state not reset when `data` prop changes — user can see empty page if data shrinks.

Flagged by: TypeScript Reviewer (#7, #9).

## Proposed Solutions

1. Accept optional `rowKey` prop: `rowKey?: (row: T) => string | number`
2. Add `useEffect(() => setPage(0), [data])` to reset page on data change.

- Effort: Small
- Risk: Low

## Acceptance Criteria

- [ ] rowKey prop available and used when provided
- [ ] Page resets to 0 when data prop changes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | — |
