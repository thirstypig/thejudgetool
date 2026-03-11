---
status: pending
priority: p2
issue_id: "033"
tags: [code-review, security, business-rules]
dependencies: []
---

# getTableScoringStatus and getTableCommentCards expose scores to all users (BR-5)

## Problem Statement

`getTableScoringStatus`, `getTableScoreCards`, and `getTableCommentCards` in `src/features/scoring/actions/index.ts` all use `requireAuth()` which allows any authenticated user (including judges) to read any table's scores and comment cards. BR-5 states: "Never show other judges' scores or rankings during active judging."

Flagged by: Security Sentinel (M-2, M-3).

## Findings

- Comment cards include `appearanceScore`, `tasteScore`, `textureScore` — leaks individual scores
- Judge names included in response — allows identifying whose scores are whose
- A judge could call these actions via browser dev tools during active judging

## Proposed Solutions

### Option A: Restrict to captain/organizer during active rounds

Check caller role and category round status. If caller is a judge, only allow access if the round is SUBMITTED or later.

- Effort: Medium
- Risk: Low (may break existing judge UI flows — need to verify judges don't use these actions)

## Acceptance Criteria

- [ ] Judges cannot access other tables' score cards during active judging
- [ ] Captains and organizers retain full access
- [ ] BR-5 enforced server-side

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | — |
