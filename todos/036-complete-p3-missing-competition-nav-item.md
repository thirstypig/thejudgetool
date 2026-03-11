---
status: pending
priority: p3
issue_id: "036"
tags: [code-review, architecture, ux]
dependencies: []
---

# Missing "Competition" nav item in DashboardShell sidebar

## Problem Statement

The `/organizer/[id]/competition` route exists but is not included in the `navItems` array in `src/app/(dashboard)/DashboardShell.tsx`. The route is unreachable from sidebar navigation. Additionally, the `resolveHref` regex (line 174) does not include `competition` in its match pattern.

Flagged by: Architecture Strategist (2.2).

## Proposed Solutions

Add a "Competition" nav item between "Judges" and "Results" in the navItems array, and add `competition` to the resolveHref regex.

- Effort: Small
- Risk: Low

## Acceptance Criteria

- [ ] Competition page accessible from sidebar navigation
- [ ] resolveHref correctly injects competition ID

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | — |
