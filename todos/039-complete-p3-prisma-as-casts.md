---
status: pending
priority: p3
issue_id: "039"
tags: [code-review, typescript, quality]
dependencies: []
---

# Blanket `as` casts on Prisma query results

## Problem Statement

Multiple server action files cast Prisma query results to hand-written types using `as`:
- `src/features/scoring/actions/index.ts`: lines 118, 152, 249
- `src/features/competition/actions/index.ts`: line 98

If the Prisma `include` shape drifts from the hand-written types, TypeScript will not catch the mismatch.

Flagged by: TypeScript Reviewer (#4, #5).

## Proposed Solutions

### Option A: Use Prisma.GetPayload (ideal but larger refactor)

Define types using `Prisma.validator` + `Prisma.GetPayload` to tie types to actual query shapes.

### Option B: Add TODO comments (minimal)

Add `// TODO: replace with Prisma.GetPayload` on each cast as a reminder.

- Effort: Small (Option B) / Medium (Option A)
- Risk: Low

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | — |
