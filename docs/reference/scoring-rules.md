# KCBS Scoring Rules Reference

## Categories

Four mandatory categories, judged sequentially:

1. **Chicken**
2. **Pork Ribs**
3. **Pork**
4. **Brisket**

Categories must advance in order (BR-1). The organizer advances each round after all tables submit.

## Valid Scores

| Score | Meaning |
|-------|---------|
| 9 | Excellent |
| 8 | Very Good |
| 7 | Good |
| 6 | Fair |
| 5 | Poor |
| 2 | Inedible |
| 1 | DQ / Penalty (requires KCBS Rep approval) |

Scores of 0, 3, and 4 are **not used** in KCBS judging.

## Scoring Dimensions & Weights

| Dimension | Weight | Max weighted |
|-----------|--------|-------------|
| Appearance | 0.5600 | 5.04 |
| Taste | 2.2972 | 20.6748 |
| Tenderness/Texture | 1.1428 | 10.2852 |
| **Total** | **4.0000** | **36** |

Taste is the heaviest weight — a 5-9-9 can outscore a 9-8-9.

## Drop Lowest

Each table has 6 judges. The **lowest weighted total** is dropped. Only the **top 5 judges** count toward the competitor's score.

**Perfect score**: 180 (5 judges x 36 max each)

## Tiebreaking

When two competitors have the same total, ties are broken in this order:

1. **Cumulative Taste** scores across all 6 judges (higher wins)
2. **Cumulative Tenderness/Texture** scores across all 6 judges
3. **Cumulative Appearance** scores across all 6 judges
4. **Dropped judge's weighted score** (higher wins)
5. **Deterministic coin toss**

## Business Rules

| Rule | Description |
|------|-------------|
| **BR-1** | Category rounds advance sequentially. No skipping. Organizer-only. |
| **BR-2** | No repeat competitor at the same table across rounds. |
| **BR-3** | Submitted score cards are locked. Corrections via table captain. |
| **BR-4** | Never show team names to judges — only anonymous 3-digit numbers. |
| **BR-5** | Never show other judges' scores or rankings during active judging. |
| **BR-6** | Captain cannot submit until all judges done + all corrections resolved. |

## Tables

- Max **6 judge seats** per table
- Table captains may or may not be judges
- A table can have 6 judges + 1 non-judging captain = 7 people total
- `captainId` on Table is separate from `TableAssignment` seats

## Constants

Defined in `src/shared/constants/kcbs.ts`:

- `VALID_SCORES` — [1, 2, 5, 6, 7, 8, 9]
- `SCORE_WEIGHTS` — { appearance: 0.56, taste: 2.2972, texture: 1.1428 }
- `MAX_WEIGHTED_SCORE` — 36
- `JUDGES_PER_TABLE` — 6
- `COUNTING_JUDGES` — 5
- `PERFECT_SCORE` — 180
- `DQ_SCORE` — 1

## Rules Page

`/rules` — accessible to all roles. Contains 2025 KCBS Judging Procedures, Judges' Creed, scoring tables, and tiebreaking rules. KCBS logo at `public/images/kcbs-logo.png`.
