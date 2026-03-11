---
status: complete
priority: p2
issue_id: "019"
tags: [code-review, typescript, error-handling]
dependencies: []
---

# `handleGeneratePin` Has No Error Handling

## Problem Statement

In `CheckInTab.tsx`, `handleGeneratePin` calls `generateJudgePin()` without try/catch. If the server action throws, the error is an unhandled promise rejection with no user feedback.

## Findings

**File:** `src/features/competition/components/CheckInTab.tsx:66-69`

## Proposed Solutions

### Solution A: Add try/catch with error state
- **Effort:** Small
- **Risk:** None

## Acceptance Criteria

- [ ] Errors from `generateJudgePin` are caught and displayed
