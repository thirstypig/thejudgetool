---
status: pending
priority: p3
issue_id: "012"
tags: [code-review, quality]
dependencies: ["001"]
---

# validateDistribution is only used in tests — move to test file

## Problem Statement

`validateDistribution` is exported from the production module but only called in test files. It's a test assertion helper, not production code.

Note: If P1 todo #001 is resolved with Option A (regenerate server-side), `validateDistribution` WILL be needed in production. Defer this until #001 is resolved.

Flagged by: Code Simplicity Reviewer.

## Proposed Solutions

- If #001 uses validateDistribution server-side: keep in production module
- If #001 does NOT use it: move to test file

## Acceptance Criteria

- [ ] Decided based on #001 resolution

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | Depends on #001 |
