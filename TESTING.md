# Testing

For how to run, write, and debug unit tests, see [docs/how-to/run-tests.md](docs/how-to/run-tests.md).

Quick reference: `npm test` (single run) | `npm run test:watch` (watch mode) | 7 test files, 113 tests.

## E2E Competition Simulation

Runs a full KCBS competition lifecycle with 2000+ assertions and generates a markdown report:

```bash
npx tsx scripts/simulate-competition.ts
# Report → reports/simulation-report.md
npm run db:reset  # Restore dev seed data afterward
```

Covers: seed → box distribution (BR-2 validation) → scoring all 4 categories (24 judges × 24 teams) → tabulation → cross-category validation → overall standings + grand champion.

## Integration Smoke Test (Manual)

### Auth & Login
- [ ] Organizer can log in with `organizer@bbq-judge.test` / `organizer123`
- [ ] Judge 100001 can log in with CBJ number `100001` / PIN `1234`
- [ ] Judge 100001 redirects to `/captain` (TABLE_CAPTAIN role)
- [ ] Judge 100002 redirects to `/judge` (JUDGE role)
- [ ] Unauthenticated user is redirected to `/login` with `callbackUrl`
- [ ] Role mismatch redirects to correct dashboard (e.g., judge → `/judge`, captain → `/captain`)
- [ ] CBJ number accepts raw digits (no "CBJ-" prefix needed)

### Organizer — BBQ Teams
- [ ] `/organizer/[id]/teams` — Registration page loads with team list
- [ ] Organizer can add single competitor with unique anonymous number
- [ ] Organizer can bulk-import competitors via CSV
- [ ] System rejects duplicate anonymous number within same competition
- [ ] `/organizer/[id]/teams/checkin` — Check-in page shows check-in status
- [ ] Organizer can check in / uncheck teams
- [ ] `/organizer/[id]/teams/boxes` — Box distribution overview

### Organizer — Judges
- [ ] `/organizer/[id]/judges` — Judge registration page loads
- [ ] Organizer can import judges (single + bulk)
- [ ] `/organizer/[id]/judges/checkin` — Check-in page shows judge check-in status
- [ ] `/organizer/[id]/judges/tables` — Table assignment page loads
- [ ] Organizer can assign judges to tables (6 seats max per table)
- [ ] Organizer can random-assign checked-in judges to tables
- [ ] System rejects assigning same judge to same table twice

### Organizer — Competition
- [ ] `/organizer/[id]/competition` — Competition page loads
- [ ] Organizer can generate box distribution (requires ≥1 table, ≥6 competitors)
- [ ] Distribution shows no BR-2 violations (no competitor at same table twice)
- [ ] Organizer can approve distribution (creates Submission records)
- [ ] Organizer can reset distribution (only if no locked scores)
- [ ] Organizer can toggle comment cards on/off
- [ ] Organizer can advance category round (BR-1: sequential only)
- [ ] System prevents advancing if active category still has pending tables

### Judging (Judge)
- [ ] Judge 100002 sees Chicken as active category
- [ ] Judge sees anonymous numbers only — no team names (BR-4)
- [ ] Judge cannot see other judges' scores (BR-5)
- [ ] Judge can score a submission (appearance, taste, texture: valid KCBS scores 1,2,5,6,7,8,9)
- [ ] Submitted score card is locked (BR-3)
- [ ] Judge cannot edit a locked card directly
- [ ] Judge can request correction on locked card with reason (20+ chars)
- [ ] Score of 1 shows DQ warning
- [ ] Comment card screen appears after scoring (if enabled)

### Table Captain
- [ ] Captain 100001 sees all 6 judges' scoring status for Table 1
- [ ] Captain sees progress bars per judge
- [ ] Captain can view score cards in review table
- [ ] Captain can view comment cards in review table
- [ ] Captain can approve a correction request (unlocks the score card)
- [ ] Captain can deny a correction request
- [ ] Captain cannot approve/deny corrections for other tables (IDOR protection)
- [ ] Captain cannot submit Chicken until all judges have submitted all score cards
- [ ] Captain cannot submit if pending correction requests exist (BR-6)
- [ ] Captain can submit Chicken when all conditions met

### Category Advancement (Organizer)
- [ ] Organizer sees submitted tables on competition page
- [ ] Organizer can advance to Pork Ribs only when all tables submitted Chicken
- [ ] System prevents skipping categories (BR-1)
- [ ] After advancement, judges see new active category

### Tabulation & Results (Organizer)
- [ ] `/organizer/[id]/results` — Results page loads with 4 tabs
- [ ] Progress tab shows live completion per category (auto-refreshes every 15s)
- [ ] Results tab shows ranked results after all tables submit
- [ ] Score Audit tab shows per-judge weighted score breakdown
- [ ] Audit Log tab shows all competition events
- [ ] DQ entries appear at bottom of rankings
- [ ] Outlier scores are highlighted (>2 pts from average)
- [ ] Organizer can declare a winner
- [ ] Winner declaration is logged in audit log
- [ ] Export results as CSV includes de-anonymized team names
- [ ] Export results as JSON includes all score breakdowns

### Security & Access Control
- [ ] Server actions enforce auth guards (not just route middleware)
- [ ] Captain actions verify table ownership (IDOR protection)
- [ ] `getTableScoreCards` requires captain role (BR-5)
- [ ] `getTableCommentCards` requires captain role
- [ ] `claimSeat` verifies judge owns the assignment
- [ ] `getPendingCorrectionRequests` requires captain + table ownership
- [ ] Correction approve/deny verifies captain owns the table
- [ ] `submitCategoryToOrganizer` verifies captain owns the table
- [ ] Distribution approve/reset blocked when locked scores exist

### Seed Data Verification
- [ ] Competition "American Royal Open 2026" exists with ACTIVE status
- [ ] 24 judges (100001–100024) across 4 tables (6 each)
- [ ] 24 BBQ teams (101–124), 16 checked in
- [ ] 4 tables with captains: 100001, 100007, 100013, 100019
- [ ] Chicken round is ACTIVE, Pork Ribs / Pork / Brisket are PENDING
- [ ] Table 1 has pre-submitted score cards for competitors 101–104
- [ ] Competitor 104 has a DQ score with pending correction request
- [ ] Competition judgePin: "1234"
