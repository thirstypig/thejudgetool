---
status: pending
priority: p3
issue_id: "037"
tags: [code-review, quality, yagni]
dependencies: []
---

# Simplify generateUniqueBoxNumbers — remove dead 1000-box branch

## Problem Statement

`generateUniqueBoxNumbers` in `src/features/competition/utils/generateBoxDistribution.ts` (lines 55-62) has a conditional branch for 1000+ boxes (`start = 1000`). Max realistic box count is ~160 (40 teams x 4 categories). The branch will never execute.

Flagged by: Simplicity Reviewer (#4).

## Proposed Solutions

Simplify to: `return Array.from({ length: count }, (_, i) => 100 + i);`

- Effort: Small (5 lines → 1)
- Risk: Low

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | — |
