---
status: complete
priority: p2
issue_id: "017"
tags: [code-review, architecture, security]
dependencies: []
---

# Review Gates Are Client-Side Only

## Problem Statement

The captain review gates (scoresReviewed, commentCardsReviewed) are enforced only in the client-side React state. A captain could bypass them by calling `submitCategoryToOrganizer` directly. The server action does not verify that scores and comments were reviewed.

## Findings

**File:** `src/features/scoring/components/TableStatusBoard.tsx` — SubmitGate
**File:** `src/features/scoring/actions/index.ts` — `submitCategoryToOrganizer`

The server action checks for unsubmitted judges and pending corrections but not review state.

## Proposed Solutions

### Solution A: Accept as UX-only gate
Review is an honor-system check for the captain. The server already gates on all judges submitted + no pending corrections. Review confirmation is a workflow UX feature, not a security boundary.
- **Effort:** None
- **Risk:** Captains could skip review, but scores are already submitted

### Solution B: Persist review state in DB
Add `scoresReviewed` and `commentsReviewed` fields to a new `TableCategorySubmission` model.
- **Effort:** Large — schema change, migration, new actions
- **Risk:** Over-engineering for MVP

## Recommended Action

Accept as UX-only gate (Solution A) for now. The server-side gates on judge completion and correction resolution are the real safety checks.

## Acceptance Criteria

- [ ] Decision documented — accepted as UX-only or implemented server-side
