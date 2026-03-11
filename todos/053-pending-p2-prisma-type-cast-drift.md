---
status: pending
priority: p2
issue_id: "053"
tags: [code-review, typescript]
dependencies: []
---

# CompetitionWithRelations Type Cast Can Drift from Query

## Problem Statement

`getCompetitionById` returns `competition as CompetitionWithRelations | null` — a manual cast that can silently drift from the actual Prisma `include` shape. The TODO comment acknowledges this.

## Findings

- **Source**: TypeScript Reviewer
- Line 141 in `competition/actions/index.ts`
- The manually defined `CompetitionWithRelations` type in `competition/types/index.ts` must be kept in sync manually

## Proposed Solutions

### Option A: Use `Prisma.CompetitionGetPayload`
- Extract the include object as a const, derive the type with `Prisma.CompetitionGetPayload<{ include: typeof include }>`
- Eliminates the cast entirely
- **Effort**: Small. **Risk**: None.

## Acceptance Criteria

- [ ] No `as CompetitionWithRelations` cast
- [ ] Type is derived from query shape
