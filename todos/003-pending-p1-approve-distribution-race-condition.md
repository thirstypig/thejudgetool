---
status: pending
priority: p1
issue_id: "003"
tags: [code-review, data-integrity, security]
dependencies: []
---

# approveDistribution deletes scored submissions + no unique constraint guard

## Problem Statement

`approveDistribution` deletes existing submissions before creating new ones. If judges have already started scoring, their scores are silently destroyed. Additionally, re-approving can cause unique constraint collisions.

Flagged by: Data Integrity Guardian, Security Sentinel.

## Findings

- **Location:** `src/features/competition/actions/index.ts` lines 620-650
- **Issue 1:** `deleteMany` on Submission removes records that may have associated ScoreCards
- **Issue 2:** No check for existing scores before deletion
- **Issue 3:** No guard against re-approval creating duplicate submissions

## Proposed Solutions

### Option A: Guard against scored submissions (Recommended)
- Before deleting, check if any submissions have associated ScoreCards
- If scores exist, throw an error: "Cannot regenerate — scoring has begun"
- Add `distributionStatus === "APPROVED"` check to prevent re-approval
- **Effort:** Small
- **Risk:** Low

## Acceptance Criteria

- [ ] Cannot approve distribution if any submissions already have scores
- [ ] Cannot re-approve an already-approved distribution
- [ ] Error message clearly explains why action was blocked

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | |
