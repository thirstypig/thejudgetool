---
status: complete
priority: p1
issue_id: "014"
tags: [code-review, typescript, bug]
dependencies: []
---

# Broken `handleRandomAssign` Error Handling

## Problem Statement

In `CheckInTab.tsx`, the `handleRandomAssign` function wraps `startTransition` in a `try/catch`, but `startTransition` returns synchronously. Errors inside the async callback are silently swallowed — the `catch` block will never execute, and `randomError` state will never be set. This bug was introduced during the check-in refresh fix in this session.

**Impact:** Users see no error feedback when random table assignment fails.

## Findings

**File:** `src/features/competition/components/CheckInTab.tsx:95-107`

```typescript
// BROKEN: try/catch around startTransition doesn't catch async errors
async function handleRandomAssign() {
  setRandomError(null);
  try {
    startTransition(async () => {
      await randomAssignTables(competitionId); // error here is swallowed
      router.refresh();
    });
  } catch (err) {
    // This catch NEVER executes
    setRandomError(err instanceof Error ? err.message : "Failed to assign tables");
  }
}
```

## Proposed Solutions

### Solution A: Move try/catch inside startTransition (Recommended)
```typescript
function handleRandomAssign() {
  setRandomError(null);
  startTransition(async () => {
    try {
      await randomAssignTables(competitionId);
      router.refresh();
    } catch (err) {
      setRandomError(err instanceof Error ? err.message : "Failed to assign tables");
    }
  });
}
```
- **Pros:** Simple fix, catches errors correctly
- **Cons:** None
- **Effort:** Small
- **Risk:** None

## Acceptance Criteria

- [ ] Errors from `randomAssignTables` are caught and displayed to the user
- [ ] `randomError` state is set on failure
- [ ] TypeScript compiles without errors

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Identified during code review | startTransition callbacks swallow errors unless caught inside |
