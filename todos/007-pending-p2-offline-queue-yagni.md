---
status: pending
priority: p2
issue_id: "007"
tags: [code-review, quality, yagni]
dependencies: []
---

# Offline queue is over-engineered — consider removing entirely

## Problem Statement

The offline queue (`useOfflineQueue.ts`, 173 lines + `OfflineIndicator.tsx`, 51 lines + ~60 lines prop threading) adds significant complexity for a scenario that may not warrant it. BBQ competitions happen at physical venues. The existing error handling already shows errors and lets judges retry manually. The queue also introduces risks:

1. Optimistic advancement — judge moves to next phase before data is persisted
2. Silent data loss — items dropped after MAX_RETRIES=5 with no notification
3. Triggers on ALL errors, not just network errors (e.g., validation failures get queued)
4. Unsafe `as` casts in processItem

Flagged by: Code Simplicity Reviewer (major YAGNI), TypeScript Reviewer, Architecture Strategist.

## Findings

- **Files:** `src/features/judging/hooks/useOfflineQueue.ts`, `src/features/judging/components/OfflineIndicator.tsx`
- **Prop threading:** AppearanceScoringScreen, TasteTextureScoringScreen, CommentCardScreen, JudgeDashboardClient
- **~284 LOC** that could be removed

## Proposed Solutions

### Option A: Remove entirely (Recommended by simplicity reviewer)
- Remove useOfflineQueue hook and OfflineIndicator component
- Remove onOfflineEnqueue props from all scoring screens
- Keep existing try/catch + error display (already works)
- **Effort:** Small
- **Risk:** Low (reverting to simpler behavior)

### Option B: Keep but fix issues
- Only enqueue on network errors (check `TypeError: Failed to fetch`)
- Surface persistent failures in OfflineIndicator
- Remove unsafe casts
- **Effort:** Medium
- **Risk:** Medium

## Acceptance Criteria

- [ ] Decision made: keep or remove
- [ ] If removed: no offline queue code remains
- [ ] If kept: only network errors queued, failures surfaced

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | 284 LOC, flagged as major YAGNI by simplicity reviewer |
