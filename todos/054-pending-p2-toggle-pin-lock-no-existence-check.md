---
status: pending
priority: p2
issue_id: "054"
tags: [code-review, security]
dependencies: []
---

# togglePinLock Has No Competition Existence Check

## Problem Statement

`togglePinLock` (actions/index.ts:389-398) uses a bare `prisma.competition.update` without `findUniqueOrThrow`. If an invalid competition ID is passed, the error message is a raw Prisma error rather than a meaningful message. Also, no competition ownership verification — any organizer can lock/unlock any competition's PIN.

## Findings

- **Source**: Data Integrity Guardian, Security Sentinel
- Compare with `generateJudgePin` which uses `findUniqueOrThrow`

## Proposed Solutions

### Option A: Add findUniqueOrThrow
- Consistent with other actions in the file
- **Effort**: Small. **Risk**: None.

## Acceptance Criteria

- [ ] `togglePinLock` validates competition exists before updating
