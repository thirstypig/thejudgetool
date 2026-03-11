---
status: pending
priority: p2
issue_id: "031"
tags: [code-review, architecture, typescript]
dependencies: []
---

# Type interfaces exported from server action file

## Problem Statement

`src/features/tabulation/actions/index.ts` (lines 264-299) defines and exports 4 type interfaces (`DetailedJudgeScore`, `DetailedCompetitorResult`, `DetailedTableResult`, `DetailedCategoryResult`). Types should live in `types/` per the feature module pattern. Additionally, a static constant is dynamically imported (line 326).

Flagged by: TypeScript Reviewer (#5, #6).

## Proposed Solutions

Move interfaces to `src/features/tabulation/types/index.ts` and re-export from barrel. Replace `await import("@/shared/constants/kcbs")` with a top-level import.

- Effort: Small
- Risk: Low

## Acceptance Criteria

- [ ] Types moved to types/index.ts
- [ ] Dynamic import replaced with static import
- [ ] Barrel export updated

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | — |
