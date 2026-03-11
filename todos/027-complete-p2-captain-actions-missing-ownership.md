---
status: pending
priority: p2
issue_id: "027"
tags: [code-review, security, authorization]
dependencies: []
---

# Captain actions missing table ownership verification

## Problem Statement

Multiple captain actions in `src/features/scoring/actions/index.ts` verify the caller is a captain but do not verify the target resource belongs to the captain's table. Any captain can act on any table.

Flagged by: Security Sentinel (H-2, H-3).

## Findings

- **approveCorrectionRequest** (line 157): Any captain can approve any table's correction requests
- **denyCorrectionRequest** (line 194): Same issue
- **submitCategoryToOrganizer** (line 277): Any captain can submit any table's category
- All use `requireCaptain()` which returns `userId` but never check `table.captainId === userId`

## Proposed Solutions

### Option A: Add ownership check to each action

After fetching the resource, verify it belongs to the captain's table:
```typescript
const table = await prisma.table.findFirst({ where: { captainId, id: targetTableId } });
if (!table) throw new Error("You can only manage your own table");
```

- Effort: Small (3 actions to update)
- Risk: Low

## Acceptance Criteria

- [ ] approveCorrectionRequest verifies the request belongs to captain's table
- [ ] denyCorrectionRequest verifies the request belongs to captain's table
- [ ] submitCategoryToOrganizer verifies tableId belongs to captain

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | — |
