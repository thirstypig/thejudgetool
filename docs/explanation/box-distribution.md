# Box Distribution Algorithm

How the box distribution system works and why it's designed as a constrained assignment problem.

## The Problem

In a KCBS BBQ competition, each competitor submits one box of meat per category (Chicken, Pork Ribs, Pork, Brisket). Each box must be assigned to a table for judging. The core constraint:

> **No competitor's box can appear at the same table more than once across all categories (BR-2).**

If competitor 101's chicken box goes to Table 1, their pork ribs, pork, and brisket boxes must go to Tables 2, 3, or 4.

## Why This Matters

Without this constraint, a single table's judges could develop bias toward (or against) a competitor after tasting their first entry. BR-2 ensures each competitor's entries are evaluated by different groups of judges across categories, producing fairer results.

## The Ideal Case

With **24 competitors**, **4 tables**, and **4 categories**, the math works out perfectly:

- Each table judges 6 competitors per category (24 / 4 = 6)
- Each competitor appears at exactly 4 different tables across 4 categories
- No overlaps are possible if the distribution is a **Latin square variant**

This is the "golden path" — a cyclic rotation produces a valid distribution with zero conflicts:

```
Category 1: Table 1 gets [1-6],   Table 2 gets [7-12],  Table 3 gets [13-18], Table 4 gets [19-24]
Category 2: Table 1 gets [7-12],  Table 2 gets [13-18], Table 3 gets [19-24], Table 4 gets [1-6]
Category 3: Table 1 gets [13-18], Table 2 gets [19-24], Table 3 gets [1-6],   Table 4 gets [7-12]
Category 4: Table 1 gets [19-24], Table 2 gets [1-6],   Table 3 gets [7-12],  Table 4 gets [13-18]
```

## Non-Ideal Cases

Real competitions may have:
- **Fewer than 24 competitors** — Some tables get fewer boxes
- **More than 24 competitors** — Some tables get more, increasing constraint pressure
- **Uneven tables** — Not all tables may have 6 judges
- **Late additions/withdrawals** — Teams check in or drop out

The algorithm handles these with a **two-phase approach**:

1. **Cyclic assignment** (fast path) — If competitors divide evenly across tables, use the rotation pattern
2. **Greedy assignment** (fallback) — For remaining competitors, assign to the table with the fewest boxes that hasn't seen this competitor yet

## Implementation

The pure function `generateBoxDistribution()` in `features/competition/utils/` takes:
- List of checked-in competitors
- List of tables
- List of category rounds

And returns a distribution matrix: `{ tableId, categoryRoundId, competitorId, boxNumber }[]`

The function is **pure** (no database access) for testability. The server action `generateDistribution()` wraps it with database queries and auth.

## Validation

`validateNoRepeatCompetitor()` checks BR-2 compliance for a single table-competitor pair. The distribution generator calls this internally, and the UI also validates before approval.

## Approval Flow

1. **Generate** — Organizer previews the proposed distribution (not yet saved)
2. **Approve** — Creates `Submission` records in a single transaction. Sets `distributionStatus: APPROVED`
3. **Reset** — Deletes submissions and reverts to `DRAFT`. **Blocked if any score cards are locked** to prevent data loss

The approval step is atomic — if any submission fails to create, the entire batch rolls back.

## Testing

The distribution algorithm has extensive unit tests:

- `generateBoxDistribution.test.ts` — Happy path: cyclic and greedy assignment
- `generateBoxDistribution.edge.test.ts` — Edge cases: boundary conditions, sorting stability, box number integrity

These tests verify BR-2 compliance across various competitor counts and table configurations.

## Future: Table Organizer Role

The distribution feeds into a planned **TABLE_ORGANIZER** role — a person who physically receives boxes of meat and routes them to the correct table based on the distribution plan. This role is logistics-only (no judging or scoring). Status: deferred to post-MVP.
