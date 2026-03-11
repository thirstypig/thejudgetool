---
status: pending
priority: p1
issue_id: "041"
tags: [code-review, security, owasp]
dependencies: []
---

# CSV Export Missing Double-Quote Escaping

## Problem Statement

The `sanitizeCsvValue()` function in the CSV export prevents formula injection but does not escape embedded double-quote characters. If a team name contains a literal `"` (e.g., `Team "Smoke" BBQ`), the CSV output becomes malformed: `"Team "Smoke" BBQ"`. An organizer who creates such team names could corrupt the entire CSV structure or inject arbitrary columns via `","` in a name.

## Findings

**Source:** security-sentinel agent, kieran-typescript-reviewer agent

**Location:** `src/features/tabulation/actions/index.ts` lines 296-301

```typescript
function sanitizeCsvValue(value: string): string {
  if (/^[=+\-@\t\r]/.test(value)) {
    return "'" + value;
  }
  return value;
}
```

The function is applied to `categoryName` and `teamName` (lines 325, 328), which are wrapped in double quotes in the CSV output. If either contains `"`, the CSV breaks.

## Proposed Solutions

### Option A: Add double-quote escaping before formula check (Recommended)
```typescript
function sanitizeCsvValue(value: string): string {
  let escaped = value.replace(/"/g, '""');
  if (/^[=+\-@\t\r\n|]/.test(escaped)) {
    escaped = "'" + escaped;
  }
  return escaped;
}
```
- **Pros:** Complete CSV safety, standard CSV escaping (`""` for literal `"`)
- **Cons:** None
- **Effort:** Small (3 lines changed)
- **Risk:** None

## Recommended Action

Option A. Also adds `\n` and `|` to the formula regex (see todo 042).

## Technical Details

- **Affected files:** `src/features/tabulation/actions/index.ts`

## Acceptance Criteria

- [ ] Team names containing `"` characters produce valid CSV
- [ ] Team names containing `","` do not inject extra columns
- [ ] Formula injection prevention still works
- [ ] Existing tests pass

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | CSV standard: `""` escapes literal double-quote |

## Resources

- [RFC 4180 - CSV Format](https://tools.ietf.org/html/rfc4180)
- [OWASP CSV Injection](https://owasp.org/www-community/attacks/CSV_Injection)
