# Database Schema Reference

The database uses PostgreSQL (Supabase) with Prisma 5 as ORM. Schema defined in `prisma/schema.prisma`.

## Entity Relationship Overview

```
Competition
  ├── Competitor[]          (BBQ teams)
  ├── Table[]               (judging tables)
  │     ├── TableAssignment[]  (judge seats)
  │     └── Submission[]       (box entries)
  ├── CategoryRound[]       (Chicken, Ribs, Pork, Brisket)
  ├── CompetitionJudge[]    (per-competition registration)
  └── AuditLog[]

User
  ├── captainOfTables[]     (Table[])
  ├── tableAssignments[]    (TableAssignment[])
  ├── scoreCards[]          (ScoreCard[])
  ├── correctionsMade[]     (CorrectionRequest[])
  ├── correctionsDecided[]  (CorrectionRequest[])
  ├── commentCards[]        (CommentCard[])
  └── competitionRegistrations[]  (CompetitionJudge[])

Submission
  ├── ScoreCard[]           (one per judge)
  └── CommentCard[]         (one per judge, optional)

ScoreCard
  └── CorrectionRequest[]   (unlock requests)
```

## Models

### Competition

Core entity. Holds config and links to all competition data.

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| name | String | Competition name |
| date | DateTime | Competition date |
| location | String | Venue |
| status | String | `SETUP` / `ACTIVE` / `CLOSED` |
| judgePin | String? | Shared 4-digit PIN for judges |
| judgePinLocked | Boolean | Prevents PIN regeneration |
| organizerName | String? | For event info display |
| kcbsRepName | String? | KCBS representative |
| city, state | String? | Location details |
| commentCardsEnabled | Boolean | Toggle comment card feature |
| distributionStatus | Enum? | `DRAFT` / `APPROVED` |

### User

Judges, table captains, and organizers.

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| cbjNumber | String | Unique CBJ identifier |
| name | String | Display name |
| email | String | Unique email |
| role | String | `JUDGE` / `TABLE_CAPTAIN` / `ORGANIZER` |
| pin | String | Bcrypt-hashed PIN or password |

### Competitor

BBQ teams registered for a competition.

| Field | Type | Notes |
|-------|------|-------|
| competitionId | String | FK to Competition |
| anonymousNumber | String | 3-digit number (unique per competition) |
| teamName | String | Only visible to organizers (BR-4) |
| checkedIn | Boolean | Check-in status |
| checkedInAt | DateTime? | When checked in |

**Unique**: `[competitionId, anonymousNumber]`

### Table

Judging tables within a competition.

| Field | Type | Notes |
|-------|------|-------|
| competitionId | String | FK to Competition |
| tableNumber | Int | Table identifier |
| captainId | String? | FK to User (captain, separate from seats) |

**Unique**: `[competitionId, tableNumber]`

### TableAssignment

Judge seat assignments (max 6 per table).

| Field | Type | Notes |
|-------|------|-------|
| tableId | String | FK to Table |
| userId | String | FK to User |
| seatNumber | Int? | 1-6, null until judge picks seat |

**Unique**: `[tableId, seatNumber]`

### CompetitionJudge

Per-competition registration and check-in tracking.

| Field | Type | Notes |
|-------|------|-------|
| competitionId | String | FK to Competition |
| userId | String | FK to User |
| checkedIn | Boolean | Check-in status |
| hasStartedJudging | Boolean | Phase tracking gate |

**Unique**: `[competitionId, userId]`

### CategoryRound

Competition category progression.

| Field | Type | Notes |
|-------|------|-------|
| competitionId | String | FK to Competition |
| categoryName | String | e.g., "Chicken" |
| categoryType | String | `MANDATORY` / `OPTIONAL` |
| order | Int | Sequence (1-4) |
| status | String | `PENDING` / `ACTIVE` / `SUBMITTED` |

**Unique**: `[competitionId, categoryName]`

### Submission

A box entry at a table for a category round.

| Field | Type | Notes |
|-------|------|-------|
| competitorId | String? | FK to Competitor |
| categoryRoundId | String | FK to CategoryRound |
| tableId | String | FK to Table |
| boxNumber | Int | Position at table (1-6) |
| boxCode | String | Code entered by judge |
| enteredByJudgeId | String? | FK to User who entered the box |

**Unique**: `[categoryRoundId, tableId, boxCode]`

### ScoreCard

One per judge per submission.

| Field | Type | Notes |
|-------|------|-------|
| submissionId | String | FK to Submission |
| judgeId | String | FK to User |
| appearance | Int | 0-9 (0 = not yet scored) |
| taste | Int | 0-9 |
| texture | Int | 0-9 |
| locked | Boolean | True after submission (BR-3) |
| submittedAt | DateTime? | When fully submitted |
| appearanceSubmittedAt | DateTime? | When appearance scored |

**Unique**: `[submissionId, judgeId]`

### CorrectionRequest

Unlock request for a locked score card.

| Field | Type | Notes |
|-------|------|-------|
| scoreCardId | String | FK to ScoreCard |
| judgeId | String | FK to User (requester) |
| reason | String | Min 20 characters |
| status | String | `PENDING` / `APPROVED` / `DENIED` |
| decidedBy | String? | FK to User (captain/organizer) |

### CommentCard

Optional per-submission feedback.

| Field | Type | Notes |
|-------|------|-------|
| submissionId | String | FK to Submission |
| judgeId | String | FK to User |
| categoryRoundId | String | FK to CategoryRound |
| appearanceScore/tasteScore/textureScore | Int | Copied from ScoreCard |
| tasteChecks | String[] | Selected taste descriptors |
| tendernessChecks | String[] | Selected tenderness descriptors |
| appearanceText | String? | Free text |
| otherComments | String? | Free text |

**Unique**: `[submissionId, judgeId]`

### AuditLog

Immutable event log.

| Field | Type | Notes |
|-------|------|-------|
| competitionId | String | FK to Competition |
| actorId | String | FK to User |
| action | String | e.g., "DECLARE_WINNER" |
| entityId | String | Target entity ID |
| entityType | String | Target entity type |
| timestamp | DateTime | Auto-set |
