# Judge Multi-Phase Flow

Why the judge experience is split into distinct phases, and how state transitions work.

## The Problem

A BBQ judge's day involves multiple sequential activities: checking in, finding their table, sitting down, waiting for the event to start, scoring entries across multiple categories, and optionally filling out comment cards. Each step has prerequisites — you can't score until you're seated, you can't start until the organizer says go.

A naive "show everything at once" UI would overwhelm judges (many of whom are volunteers, not tech-savvy) and create opportunities for errors (scoring before boxes arrive, submitting before being seated).

## The Phase Model

The judge dashboard uses a **linear phase progression** that gates what the judge sees at each step:

```
not-registered → awaiting-table → pick-seat → ready → event-info → scoring → comment-cards
```

Each phase maps to a distinct screen. The judge only sees one screen at a time.

### Phase Details

| Phase | What the judge sees | Gate to next |
|-------|-------------------|--------------|
| `not-registered` | Registration prompt | Organizer registers judge for competition |
| `awaiting-table` | "Waiting for table assignment" | Organizer assigns judge to a table |
| `pick-seat` | Seat selection grid (1-6) | Judge picks an available seat |
| `ready` | "Ready" confirmation | Automatic transition |
| `event-info` | Competition details + Start button | Judge clicks Start |
| `scoring` | Score entry per box | All boxes scored for current category |
| `comment-cards` | Comment card forms | All cards filled (or skipped if disabled) |

### Why "Event Info" Exists

The `event-info` phase serves as a **deliberate gate** between setup and scoring. It shows the competition name, organizer, KCBS rep, and location. The judge must explicitly tap "Start Judging" to proceed.

This prevents accidental early scoring and gives organizers time to distribute boxes before judges begin. The `hasStartedJudging` flag on `CompetitionJudge` tracks this transition server-side.

### Why Appearance is Separate

Within the `scoring` phase, appearance scores are submitted first (all boxes at once), then taste/texture are submitted per box. This mirrors the physical KCBS process: judges see all boxes lined up and score appearance as a group, then taste each one individually.

The `appearanceSubmittedAt` timestamp on `ScoreCard` tracks this two-step process.

## State Storage

Phase state is tracked in three places:

1. **Database** — `CompetitionJudge.hasStartedJudging`, `TableAssignment.seatNumber`, `ScoreCard.locked`
2. **localStorage** — `bbq-judge-started-{compId}`, `bbq-judge-comments-done-{categoryRoundId}`
3. **Derived** — The current phase is computed from database state + localStorage in `getJudgeSetupState()` and the judge dashboard

localStorage is used for client-only gates (like the Start button) that don't need server enforcement. The server re-derives phase from authoritative DB state on every action.

## Category Transitions

When a category round advances (Chicken → Pork Ribs), judges automatically see the new active category. The scoring phase resets for the new round while previous scores remain locked.

Comment cards, if enabled, appear between the end of scoring for one category and the start of the next. The `bbq-judge-comments-done-{categoryRoundId}` localStorage key tracks whether the judge has completed (or skipped) comment cards for a given round.

## Design Decisions

**Why phases instead of tabs?** Tabs imply all content is available simultaneously. Phases enforce a linear flow that matches the physical event timeline. A judge at a BBQ competition doesn't flip between setup and scoring — they progress through stages.

**Why localStorage for some gates?** The Start button gate (`event-info` → `scoring`) is a UX convenience, not a security boundary. Server actions validate all scoring prerequisites regardless of client state. Using localStorage avoids unnecessary server round-trips for a non-critical gate.

**Why not WebSockets for real-time updates?** The judge dashboard polls on focus/refetch rather than maintaining a persistent connection. At competition scale (24-50 judges), polling is simpler and sufficient. Real-time updates would add complexity without meaningful UX improvement — judges don't need sub-second updates.
