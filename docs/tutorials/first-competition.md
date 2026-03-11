# Your First Competition

Walk through creating and running a KCBS BBQ competition from start to finish using the seed data.

## Overview

A KCBS competition flows through these stages:

1. **Setup** — Register teams, import judges, assign tables
2. **Distribution** — Generate and approve box assignments
3. **Judging** — Judges score entries category by category
4. **Tabulation** — Review results and declare winners

The seed data gives you a head start: 24 judges, 24 teams, 4 tables, and Chicken already active.

## Step 1: Log In as Organizer

Go to [http://localhost:3030/login](http://localhost:3030/login) and use:
- **Email**: `organizer@bbq-judge.test`
- **Password**: `organizer123`

You'll land on the organizer dashboard.

## Step 2: Review BBQ Teams

Navigate to **BBQ Teams**. You'll see 24 teams (101-124). Teams with a green check are checked in (16 of 24). You can:
- Add individual teams or bulk-import from CSV
- Check in / uncheck teams on the Check-in tab

## Step 3: Review Judges & Tables

Navigate to **Judges**. The roster shows 24 judges across 4 tables. Each table has:
- 1 captain (100001, 100007, 100013, 100019)
- 5 additional judges
- Maximum 6 judging seats per table

## Step 4: Review Box Distribution

Navigate to **Competition**. The box distribution shows which competitor boxes go to which table for each category. The seed data has this pre-generated.

The distribution algorithm ensures **no competitor appears at the same table twice** across categories (Business Rule BR-2). You can:
- **Generate** a new distribution
- **Approve** to lock it in (creates Submission records)
- **Reset** to start over (only if no scores are locked)

## Step 5: Experience Judging (as a Judge)

Open an incognito window and log in as Judge 100002 (PIN: 1234).

The judge dashboard shows:
1. **Event info** — Competition details, click Start to begin
2. **Scoring** — For each box: score Appearance first, then Taste + Texture
3. Valid KCBS scores: 1, 2, 5, 6, 7, 8, 9
4. Score of 1 = DQ (shows a warning)
5. Once submitted, score cards are **locked** (BR-3)

## Step 6: Captain Review

Open another incognito window and log in as Captain 100001 (PIN: 1234).

The captain dashboard shows:
- Per-judge progress for their table
- Score review table with all submitted cards
- Correction request management (approve/deny)
- **Submit Category** button — only enabled when all judges are done and no pending corrections (BR-6)

## Step 7: Advance Categories

Back as organizer, navigate to **Competition**. After all tables submit Chicken:
- Click **Advance** to move to Pork Ribs
- Categories must advance sequentially: Chicken -> Pork Ribs -> Pork -> Brisket (BR-1)

## Step 8: View Results

Navigate to **Results**. Four tabs:
- **Progress** — Live completion dashboard (auto-refreshes every 15s)
- **Results** — Ranked leaderboard with expandable score breakdowns
- **Score Audit** — Per-judge weighted formula breakdown
- **Audit Log** — All competition events

You can declare winners and export results as CSV or JSON.

## Key Business Rules

| Rule | Description |
|------|-------------|
| BR-1 | Categories advance sequentially, no skipping |
| BR-2 | No repeat competitor at same table across rounds |
| BR-3 | Submitted score cards are locked |
| BR-4 | Team names never shown to judges |
| BR-5 | Judges can't see other judges' scores |
| BR-6 | Captain can't submit until all judges done + corrections resolved |

## Next Steps

- [KCBS scoring rules](../reference/scoring-rules.md) — weights, tiebreaking, drop-lowest
- [Auth & security](../reference/auth.md) — how roles and guards work
- [Seed data details](../reference/seed-data.md) — full breakdown of test data
