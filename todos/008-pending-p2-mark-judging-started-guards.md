---
status: pending
priority: p2
issue_id: "008"
tags: [code-review, security]
dependencies: []
---

# markJudgingStarted missing registration + competition status guards

## Problem Statement

`markJudgingStarted` allows any authenticated judge to mark themselves as started without checking if they're registered for the competition or if the competition is still active/open.

Flagged by: Data Integrity Guardian, Security Sentinel.

## Findings

- **Location:** `src/features/judging/actions/index.ts`
- No check for CompetitionJudge registration existence
- No check for competition status (could mark started on closed competition)

## Proposed Solutions

### Option A: Add guards (Recommended)
- Verify CompetitionJudge record exists before updating
- Check competition status is ACTIVE
- **Effort:** Small
- **Risk:** Low

## Acceptance Criteria

- [ ] Throws if judge not registered for competition
- [ ] Throws if competition is not ACTIVE

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | |
