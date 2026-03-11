---
status: pending
priority: p1
issue_id: "040"
tags: [code-review, security, owasp]
dependencies: []
---

# CSP `'unsafe-eval'` Should Be Dev-Only

## Problem Statement

The Content-Security-Policy header in `next.config.mjs` includes `'unsafe-eval'` in the `script-src` directive for all environments. Combined with `'unsafe-inline'`, this effectively negates most XSS protection that CSP provides. `'unsafe-eval'` is only needed in development for hot module replacement source maps.

## Findings

**Source:** security-sentinel agent

**Location:** `next.config.mjs` line 17

```javascript
value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; ..."
```

`'unsafe-eval'` allows `eval()` and equivalent APIs, which is a major XSS vector in production. Next.js 14 App Router requires `'unsafe-inline'` for hydration scripts, but `'unsafe-eval'` is only needed in dev mode.

## Proposed Solutions

### Option A: Gate behind NODE_ENV (Recommended)
```javascript
value: `default-src 'self'; script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';`
```
- **Pros:** Simple, directly addresses the issue
- **Cons:** Template literal is slightly less readable
- **Effort:** Small
- **Risk:** Low — production builds don't need eval

### Option B: Separate dev/prod CSP configs
- **Pros:** Cleaner separation
- **Cons:** More code, two configs to maintain
- **Effort:** Medium
- **Risk:** Low

## Recommended Action

Option A.

## Technical Details

- **Affected files:** `next.config.mjs`
- **Components:** Security headers configuration

## Acceptance Criteria

- [ ] `'unsafe-eval'` is NOT present in CSP headers in production builds
- [ ] `'unsafe-eval'` IS present in CSP headers in development
- [ ] `npm run build` succeeds
- [ ] Dev server works with hot reload

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | CSP with unsafe-eval negates XSS protection |

## Resources

- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- PR: current uncommitted changes on main
