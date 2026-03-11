---
status: pending
priority: p1
issue_id: "001"
tags: [code-review, security, data-integrity]
dependencies: []
---

# approveDistribution accepts untrusted client data (IDOR + BR-2 bypass)

## Problem Statement

`approveDistribution` in `src/features/competition/actions/index.ts` accepts the full distribution matrix from the client, including `categoryRoundId`, `tableId`, and `competitorId` values. These IDs are used to create `Submission` records without verifying they belong to the specified competition. A malicious client could:

1. Submit arbitrary IDs linking competitors from one competition to tables in another
2. Bypass BR-2 validation entirely (no server-side check before persisting)
3. Submit stale data if competitors/tables changed between generation and approval

Flagged independently by: Security Sentinel, Data Integrity Guardian, Architecture Strategist, TypeScript Reviewer.

## Findings

- **Location:** `src/features/competition/actions/index.ts` lines 610-672
- **Client sends:** Full distribution array with all IDs from React state
- **Server does:** Creates Submission records directly without validation
- **No Zod schema:** Payload is not validated against a schema
- **No BR-2 check:** `validateDistribution` is never called server-side

## Proposed Solutions

### Option A: Regenerate server-side on approve (Recommended)
- `approveDistribution(competitionId)` takes only competitionId
- Server regenerates the distribution and validates BR-2 before persisting
- **Pros:** Eliminates all trust issues, always uses fresh data
- **Cons:** Distribution may differ from what organizer previewed
- **Effort:** Small
- **Risk:** Low

### Option B: Store draft in DB, approve from stored draft
- `generateDistribution` saves draft to a JSON column on Competition
- `approveDistribution` reads from DB, validates, then creates submissions
- **Pros:** Organizer approves exactly what they saw
- **Cons:** More schema changes, JSON column management
- **Effort:** Medium
- **Risk:** Low

### Option C: Keep client-sent data but add validation
- Add Zod schema for payload
- Verify all IDs belong to the competition
- Run `validateDistribution` server-side before persisting
- **Pros:** Minimal flow change
- **Cons:** Still accepts client data (defense in depth, not elimination)
- **Effort:** Small
- **Risk:** Medium

## Recommended Action

Option A — regenerate server-side. Simplest and most secure.

## Technical Details

- **Affected files:** `src/features/competition/actions/index.ts`, `src/features/competition/components/BoxDistributionPanel.tsx`
- **Database changes:** None

## Acceptance Criteria

- [ ] `approveDistribution` does not accept distribution data from client
- [ ] Server regenerates distribution on approve
- [ ] `validateDistribution` is called server-side before persisting
- [ ] All created Submission IDs verified to belong to the competition

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | Flagged by 4 agents independently |

## Resources

- `src/features/competition/actions/index.ts`
- `src/features/competition/utils/generateBoxDistribution.ts`
