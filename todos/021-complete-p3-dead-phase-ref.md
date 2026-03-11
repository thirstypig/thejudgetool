---
status: complete
priority: p3
issue_id: "021"
tags: [code-review, dead-code]
dependencies: []
---

# Dead `phaseRef` in CaptainDashboardClient

## Problem Statement

`CaptainDashboardClient` has a `phaseRef` that is assigned but never read.

## Findings

**File:** `src/app/(dashboard)/captain/CaptainDashboardClient.tsx`

## Proposed Solutions

Remove the `phaseRef` and its assignment.
- **Effort:** Small

## Acceptance Criteria

- [ ] `phaseRef` removed, no references remain
