---
status: pending
priority: p2
issue_id: "030"
tags: [code-review, architecture]
dependencies: []
---

# Scoring module directly mutates CategoryRound status (cross-domain violation)

## Problem Statement

`submitCategoryToOrganizer` in `src/features/scoring/actions/index.ts` (lines 319-347) directly updates `CategoryRound.status` from ACTIVE to SUBMITTED. This is a competition-domain concern being handled by the scoring module, violating feature module boundaries.

Flagged by: Architecture Strategist (2.3).

## Proposed Solutions

### Option A: Extract to competition module

Create `markCategoryRoundSubmitted(categoryRoundId)` in `competition/actions` and call it from scoring via barrel import.

- Pros: Restores domain boundary. Single place for CategoryRound lifecycle logic.
- Cons: Cross-module call still exists (but via public API, not direct Prisma access).
- Effort: Small
- Risk: Low

## Acceptance Criteria

- [ ] CategoryRound status transitions live in competition module
- [ ] Scoring module calls competition's public API for the transition

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | — |
