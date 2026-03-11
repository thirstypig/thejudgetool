---
status: pending
priority: p3
issue_id: "056"
tags: [code-review, simplicity]
dependencies: []
---

# Dead Server Action: validateNoRepeatCompetitor

## Problem Statement

The server action `validateNoRepeatCompetitor` in `competition/actions/index.ts` (lines 350-360) is never imported by any component. The utility function of the same name in `competition/utils/` is the one used in tests.

## Findings

- **Source**: Code Simplicity Reviewer

## Proposed Solutions

### Option A: Remove the dead server action
- **Effort**: Small. **Risk**: None.

## Acceptance Criteria

- [ ] Dead server action removed
- [ ] No broken imports
