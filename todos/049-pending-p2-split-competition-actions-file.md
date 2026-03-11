---
status: pending
priority: p2
issue_id: "049"
tags: [code-review, architecture]
dependencies: []
---

# Split competition/actions/index.ts (1060 Lines)

## Problem Statement

`src/features/competition/actions/index.ts` is 1060 lines with 20+ exported server actions spanning 5 distinct domains. This is the largest action file by far and is increasingly hard to navigate and review.

## Findings

- **Source**: Architecture Strategist
- Suggested split: competition-crud.ts, competitor-actions.ts, judge-actions.ts, distribution.ts, round-actions.ts
- Barrel export in `index.ts` already selectively re-exports, so external consumers unaffected

## Proposed Solutions

### Option A: Split into 5 domain files
- Move shared helper `guardAndCascadeDeleteSubmissions` to shared utility within feature
- Re-export everything from a barrel `actions/index.ts`
- **Effort**: Medium. **Risk**: Low.

## Acceptance Criteria

- [ ] No single actions file exceeds ~300 lines
- [ ] All existing imports still work
- [ ] Tests still pass
