---
status: pending
priority: p3
issue_id: "058"
tags: [code-review, simplicity]
dependencies: []
---

# Delete Placeholder docs/how-to/deploy.md

## Problem Statement

`docs/how-to/deploy.md` (43 lines) contains "Status: Deployment is not yet configured" and a TODO list. Committed placeholder docs add maintenance burden with no current value.

## Findings

- **Source**: Code Simplicity Reviewer

## Proposed Solutions

### Option A: Delete the file, add back when deployment is configured
- **Effort**: Small. **Risk**: None.

## Acceptance Criteria

- [ ] Placeholder deploy doc removed
- [ ] CLAUDE.md docs section updated to remove link
