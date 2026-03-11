---
status: pending
priority: p3
issue_id: "034"
tags: [code-review, quality, dry]
dependencies: ["025"]
---

# Extract cascade-delete helper to eliminate duplication

## Problem Statement

The same 4-step cascade delete (commentCards → correctionRequests → scoreCards → submissions) is duplicated between `approveDistribution` (lines 694-707) and `resetDistribution` (lines 806-828) in `src/features/competition/actions/index.ts`.

Flagged by: TypeScript Reviewer (#16), Simplicity Reviewer (#9), Architecture Strategist (P0 #2).

## Proposed Solutions

Extract a shared `cascadeDeleteSubmissions(tx, competitionId)` helper function.

- Effort: Small (~20 lines saved)
- Risk: Low

## Acceptance Criteria

- [ ] Single helper function used by both approveDistribution and resetDistribution

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | — |
