---
status: pending
priority: p2
issue_id: "044"
tags: [code-review, accessibility, wcag]
dependencies: []
---

# `aria-label` on `<p>` Tags Is Invalid Per WAI-ARIA Spec

## Problem Statement

In `CommentCardScreen.tsx`, `aria-label` attributes were added to `<p>` elements displaying abbreviations ("A", "T", "X"). Per the WAI-ARIA spec, `aria-label` is not supported on elements with the implicit `paragraph` role. Screen readers may ignore these labels entirely.

## Findings

**Source:** kieran-typescript-reviewer, code-simplicity-reviewer

**Location:** `src/features/judging/components/CommentCardScreen.tsx` lines 137, 141, 145

```tsx
<p className="text-[10px] text-muted-foreground" aria-label="Appearance">A</p>
```

The adjacent `ScoreDisplay` components already carry proper `aria-label` with dimension names, so screen readers do get context. But the `aria-label` on `<p>` is technically incorrect.

## Proposed Solutions

### Option A: Replace with `<abbr title="...">` (Recommended)
```tsx
<abbr title="Appearance" className="text-[10px] text-muted-foreground no-underline block text-center">A</abbr>
```
- **Pros:** Semantically correct for abbreviations, `title` on `<abbr>` is well-supported
- **Cons:** Slightly different element, may need `no-underline` class
- **Effort:** Small
- **Risk:** None

### Option B: Use `aria-hidden` + sr-only span
```tsx
<p aria-hidden="true" className="text-[10px] text-muted-foreground">A</p>
<span className="sr-only">Appearance</span>
```
- **Pros:** Reliable screen reader support
- **Cons:** More DOM elements
- **Effort:** Small
- **Risk:** None

## Technical Details

- **Affected files:** `src/features/judging/components/CommentCardScreen.tsx`
- 3 instances (lines 137, 141, 145)

## Acceptance Criteria

- [ ] No `aria-label` on `<p>` elements
- [ ] Abbreviations are accessible to screen readers
- [ ] Visual appearance unchanged

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | aria-label ignored on paragraph role elements |
