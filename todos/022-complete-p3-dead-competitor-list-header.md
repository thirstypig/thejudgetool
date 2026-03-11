---
status: complete
priority: p3
issue_id: "022"
tags: [code-review, dead-code]
dependencies: []
---

# Dead `CompetitorListHeader` Export

## Problem Statement

`CompetitorListHeader` in `CompetitorList.tsx` is exported as `() => null` — it's dead code that serves no purpose.

## Findings

**File:** `src/features/competition/components/CompetitorList.tsx:339`

## Proposed Solutions

Remove the export and any imports.
- **Effort:** Small

## Acceptance Criteria

- [ ] `CompetitorListHeader` removed from source and barrel exports
