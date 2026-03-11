---
status: pending
priority: p3
issue_id: "045"
tags: [code-review, quality]
dependencies: []
---

# Rules Page Hardcoded `.0000` Instead of `.toFixed(4)`

## Problem Statement

In the rules page scoring weights table, the total row's max score cell uses `{MAX_WEIGHTED_SCORE}.0000` (hardcoded string) instead of `{MAX_WEIGHTED_SCORE.toFixed(4)}`. If `MAX_WEIGHTED_SCORE` were ever changed to a non-integer, this would display incorrectly.

## Findings

**Source:** architecture-strategist agent

**Location:** `src/app/(dashboard)/rules/page.tsx` line ~169

```tsx
<td ...>{MAX_WEIGHTED_SCORE}.0000</td>
```

Should be:
```tsx
<td ...>{MAX_WEIGHTED_SCORE.toFixed(4)}</td>
```

## Proposed Solutions

### Option A: Use `.toFixed(4)` (Recommended)
- **Effort:** Trivial (1 line)
- **Risk:** None

## Technical Details

- **Affected files:** `src/app/(dashboard)/rules/page.tsx`

## Acceptance Criteria

- [ ] Total max score uses `.toFixed(4)` for consistency

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | Consistency in computed vs hardcoded display |
