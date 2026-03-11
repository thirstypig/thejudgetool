---
status: pending
priority: p2
issue_id: "006"
tags: [code-review, quality, typescript]
dependencies: []
---

# CaptainDashboardClient uses non-null assertions (session!) throughout

## Problem Statement

`CaptainDashboardClient.tsx` uses `session!` non-null assertions throughout the render. While safe due to phase-based early returns, it's fragile — any change to phase derivation could cause runtime errors. Also, the polling interval depends on `phase` in the effect dependency array, causing interval resets on phase changes.

Flagged by: TypeScript Reviewer, Architecture Strategist.

## Findings

- **Location:** `src/app/(dashboard)/captain/CaptainDashboardClient.tsx`
- Non-null assertions at lines 158, 159, 169, 177, 192, 199
- Polling interval oscillation from `phase` in useEffect deps (line 89)

## Proposed Solutions

### Option A: Early return with narrowed type
- After phase check, destructure session with fallback or use explicit null check + return
- Extract `getPhase` to a pure utility for testability
- Remove `phase` from useEffect deps, use a ref for interval timing
- **Effort:** Small
- **Risk:** Low

## Acceptance Criteria

- [ ] No `!` non-null assertions on session
- [ ] Polling interval stable (no oscillation on phase change)
- [ ] getPhase extracted as pure function with test

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | |
