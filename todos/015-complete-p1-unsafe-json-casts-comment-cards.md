---
status: complete
priority: p1
issue_id: "015"
tags: [code-review, typescript, safety]
dependencies: []
---

# Unsafe `as string[]` Casts on JSON Columns

## Problem Statement

In `CommentCardReviewTable.tsx`, `tasteChecks` and `tendernessChecks` are Prisma JSON fields cast directly to `string[]` without null/type guards. If the DB value is `null`, `undefined`, or a non-array, this will cause a runtime crash when `.map()` is called.

## Findings

**File:** `src/features/scoring/components/CommentCardReviewTable.tsx`

The cells render `(card.tasteChecks as string[]).map(...)` and `(card.tendernessChecks as string[]).map(...)` directly.

## Proposed Solutions

### Solution A: Add Array.isArray guard (Recommended)
```typescript
const checks = Array.isArray(card.tasteChecks) ? card.tasteChecks : [];
```
- **Effort:** Small
- **Risk:** None

## Acceptance Criteria

- [ ] No runtime crash when tasteChecks or tendernessChecks is null
- [ ] Renders empty when no checks exist
