---
status: pending
priority: p3
issue_id: "057"
tags: [code-review, performance]
dependencies: []
---

# Simulation Script: Sequential Creates Instead of createMany

## Problem Statement

`scripts/simulate-competition.ts` creates 576 score cards one at a time (~5.8s on Supabase) and 104 seed entities sequentially (~1-2s). Using `createMany` would reduce this dramatically.

## Findings

- **Source**: Performance Oracle
- Lines 370-412 (score cards), lines 120-196 (seed entities)

## Proposed Solutions

### Option A: Batch with createMany
- Collect score card data in arrays, use `prisma.scoreCard.createMany`
- Use `createMany` for users, competitionJudges, tableAssignments, competitors
- **Effort**: Medium. **Risk**: Low.

## Acceptance Criteria

- [ ] Score card creation uses batch operations
- [ ] Simulation runs in under 10 seconds
