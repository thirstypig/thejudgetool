---
status: pending
priority: p2
issue_id: "043"
tags: [code-review, security]
dependencies: ["041"]
---

# CSV Sanitization Regex Missing Pipe and Newline

## Problem Statement

The `sanitizeCsvValue()` regex is missing two characters that can trigger formula execution in spreadsheet applications:
- `|` (pipe) — triggers DDE in LibreOffice Calc
- `\n` (newline) — can break cell context in some CSV parsers

## Findings

**Source:** security-sentinel agent

**Location:** `src/features/tabulation/actions/index.ts` line 297

Current: `/^[=+\-@\t\r]/.test(value)`
Should be: `/^[=+\-@\t\r\n|]/.test(value)`

## Proposed Solutions

### Option A: Add pipe and newline to regex (Recommended)
```typescript
if (/^[=+\-@\t\r\n|]/.test(escaped)) {
```
- **Effort:** Small (1 character class change)
- **Risk:** None

## Technical Details

- **Affected files:** `src/features/tabulation/actions/index.ts`
- Best combined with todo 041 (double-quote escaping)

## Acceptance Criteria

- [ ] Values starting with `|` are prefixed with `'`
- [ ] Values starting with `\n` are prefixed with `'`

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | LibreOffice DDE via pipe character |
