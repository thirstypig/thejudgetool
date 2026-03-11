---
status: pending
priority: p3
issue_id: "038"
tags: [code-review, quality, dead-code]
dependencies: []
---

# Dead compound export in TableSetupPanel

## Problem Statement

`src/features/competition/components/TableSetupPanel.tsx` (lines 194-200) defines a compound export `TableSetupPanel = { Root, TableCard, AssignForm }` that is not re-exported from the barrel (`competition/index.ts`). Only the named exports are used.

Flagged by: Simplicity Reviewer (#12).

## Proposed Solutions

Remove lines 194-200 (the unused compound export object).

- Effort: Small (7 lines)
- Risk: Low

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | — |
