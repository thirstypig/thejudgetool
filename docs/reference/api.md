# Server Actions API Reference

All server actions use Next.js `"use server"` directive and require auth guards. Actions are organized by feature module.

## Competition (`@features/competition`)

**File**: `src/features/competition/actions/index.ts`

### Competition CRUD
| Action | Auth | Description |
|--------|------|-------------|
| `createCompetition(data)` | Organizer | Create competition with name, date, location, categories |
| `getCompetitions()` | Any | List all competitions |
| `getCompetitionById(id)` | Any | Get competition with all relations |

### BBQ Teams
| Action | Auth | Description |
|--------|------|-------------|
| `addCompetitor(competitionId, data)` | Organizer | Add single team (unique anonymous number) |
| `addCompetitorsBulk(competitionId, teams)` | Organizer | Bulk import teams (max 200) |
| `checkInTeam(competitorId)` | Organizer | Check in a team |
| `uncheckInTeam(competitorId)` | Organizer | Uncheck a team |

### Judges & Tables
| Action | Auth | Description |
|--------|------|-------------|
| `registerJudgeForCompetition(competitionId, userId)` | Organizer | Register judge for competition |
| `registerJudgesBulkForCompetition(competitionId, userIds)` | Organizer | Bulk register (max 100) |
| `unregisterJudgeFromCompetition(competitionJudgeId)` | Organizer | Remove judge from competition |
| `getCompetitionRoster(competitionId)` | Organizer | Get roster with table assignments |
| `checkInJudge(competitionJudgeId)` | Organizer | Check in judge |
| `uncheckInJudge(competitionJudgeId)` | Organizer | Uncheck judge |
| `assignJudgeToTable(competitionId, cbjNumber, tableNumber, seatNumber, isCaptain, isJudging?)` | Organizer | Assign judge to table with optional seat |
| `assignJudgeToTableOnly(competitionId, userId, tableNumber)` | Organizer | Assign judge to table (no seat) |
| `randomAssignTables(competitionId)` | Organizer | Random-assign checked-in judges |
| `toggleCaptainJudging(competitionId, tableId, isJudging)` | Organizer | Toggle captain's judging role |

### PIN Management
| Action | Auth | Description |
|--------|------|-------------|
| `generateJudgePin(competitionId)` | Organizer | Generate 4-digit PIN |
| `togglePinLock(competitionId, locked)` | Organizer | Lock/unlock PIN regeneration |

### Box Distribution
| Action | Auth | Description |
|--------|------|-------------|
| `generateDistribution(competitionId)` | Organizer | Generate distribution preview |
| `approveDistribution(competitionId)` | Organizer | Approve and create Submissions |
| `getExistingDistribution(competitionId)` | Organizer | Get approved distribution |
| `resetDistribution(competitionId)` | Organizer | Reset (blocked if locked scores) |

### Category Rounds
| Action | Auth | Description |
|--------|------|-------------|
| `advanceCategoryRound(competitionId)` | Organizer | Advance to next category (BR-1) |
| `markCategoryRoundSubmittedIfReady(competitionId, categoryRoundId, tableId)` | Captain | Mark submitted if all tables done |
| `toggleCommentCards(competitionId, enabled)` | Organizer | Enable/disable comment cards |

---

## Judging (`@features/judging`)

**File**: `src/features/judging/actions/index.ts`

### Setup & Session
| Action | Auth | Description |
|--------|------|-------------|
| `getJudgeSetupState()` | Judge | Get phase (not-registered/awaiting-table/pick-seat/ready) |
| `claimSeat(assignmentId, seatNumber)` | Judge | Claim seat 1-6 at table |
| `getJudgeSession(competitionId?)` | Judge | Get active session with submissions |
| `getActiveCompetitionForJudge()` | Judge | Get judge's active competition |
| `registerJudgeAtTable(competitionId, tableNumber, seatNumber)` | Judge | Self-register at table + seat |
| `markJudgingStarted(competitionId)` | Judge | Mark judge has started |

### Scoring
| Action | Auth | Description |
|--------|------|-------------|
| `getSubmissionsForJudge(categoryRoundId)` | Judge | Get submissions for current category |
| `submitAppearanceScores(scores[])` | Judge | Batch submit appearance scores |
| `submitTasteTextureScores(submissionId, scores)` | Judge | Submit taste/texture (locks card) |
| `submitScoreCard(submissionId, scores)` | Judge | Submit complete score card (locks) |
| `requestCorrection(scorecardId, reason)` | Judge | Request correction on locked card |

### Boxes & Comment Cards
| Action | Auth | Description |
|--------|------|-------------|
| `addBoxToTable(tableId, categoryRoundId, boxCode)` | Judge | Add box code to table |
| `removeBoxFromTable(submissionId)` | Judge | Remove box (if no scores) |
| `getBoxesForTable(tableId, categoryRoundId)` | Judge | Get boxes (verifies table membership) |
| `submitCommentCard(submissionId, categoryRoundId, data)` | Judge | Submit optional comment card |
| `getCommentCardsForJudge(categoryRoundId)` | Judge | Get judge's comment cards |

---

## Scoring (`@features/scoring`)

**File**: `src/features/scoring/actions/index.ts`

| Action | Auth | Description |
|--------|------|-------------|
| `getTableScoringStatus(tableId, categoryRoundId)` | Captain | Per-judge scoring progress |
| `getTableScoreCards(tableId, categoryRoundId)` | Captain+Owner | All score cards for table |
| `getTableCommentCards(tableId, categoryRoundId)` | Captain+Owner | Comment cards for table |
| `getPendingCorrectionRequests(tableId)` | Captain+Owner | Pending corrections |
| `approveCorrectionRequest(requestId)` | Captain+Owner | Approve (unlocks card) |
| `denyCorrectionRequest(requestId)` | Captain+Owner | Deny correction |
| `isCategorySubmittedByTable(tableId, categoryRoundId)` | Captain | Check if already submitted |
| `submitCategoryToOrganizer(tableId, categoryRoundId)` | Captain+Owner | Submit category (BR-6 enforced) |

---

## Tabulation (`@features/tabulation`)

**File**: `src/features/tabulation/actions/index.ts`

| Action | Auth | Description |
|--------|------|-------------|
| `getCompetitionProgress(competitionId)` | Organizer | Category progress (tables submitted) |
| `tabulateCategory(competitionId, categoryRoundId)` | Organizer | Rank with KCBS weighting + tiebreakers |
| `getAllCategoryResults(competitionId)` | Organizer | Results for all categories |
| `getDetailedCategoryResults(competitionId, categoryRoundId)` | Organizer | Per-judge score audit breakdown |
| `declareWinner(competitionId, categoryRoundId, competitorId)` | Organizer | Declare winner (idempotent, audited) |
| `exportResults(competitionId, format)` | Organizer | Export as CSV or JSON |
| `getAuditLog(competitionId)` | Organizer | Audit log (desc by timestamp) |

---

## Users (`@features/users`)

**File**: `src/features/users/actions/index.ts`

| Action | Auth | Description |
|--------|------|-------------|
| `importSingleJudge(data)` | Organizer | Import judge (CBJ + name) |
| `searchJudges(query)` | Organizer | Search by CBJ# or name (max 20) |
| `importJudgesBulk(raw)` | Organizer | Bulk import from CSV/TSV |
