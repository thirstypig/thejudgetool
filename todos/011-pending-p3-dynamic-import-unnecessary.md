---
status: pending
priority: p3
issue_id: "011"
tags: [code-review, quality]
dependencies: []
---

# Unnecessary dynamic import in generateDistribution

## Problem Statement

`generateDistribution` uses `await import("../utils/generateBoxDistribution")` which is unnecessary for a server action. Server actions run server-side and tree-shaking handles client bundles. A static import is simpler.

Flagged by: Architecture Strategist.

## Findings

- **Location:** `src/features/competition/actions/index.ts` line ~581

## Proposed Solutions

Replace with static import at top of file.

## Acceptance Criteria

- [ ] Static import used instead of dynamic import

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | |
