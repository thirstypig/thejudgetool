---
status: pending
priority: p2
issue_id: "042"
tags: [code-review, security, owasp]
dependencies: ["040"]
---

# CSP Missing Defense-in-Depth Directives

## Problem Statement

The CSP header is missing several defense-in-depth directives: `base-uri`, `form-action`, `frame-ancestors`, and `object-src`. While `X-Frame-Options: DENY` handles framing, the other gaps could be exploited if partial HTML injection is achieved.

## Findings

**Source:** security-sentinel agent

**Location:** `next.config.mjs` line 17

Missing directives:
- `base-uri 'self'` — prevents `<base>` tag injection redirecting relative URLs
- `form-action 'self'` — prevents injected forms POSTing to external domains
- `frame-ancestors 'none'` — CSP equivalent of X-Frame-Options (which is being deprecated)
- `object-src 'none'` — blocks plugin-based attacks

## Proposed Solutions

### Option A: Add all four directives (Recommended)
```
default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none';
```
- **Pros:** Comprehensive CSP, defense-in-depth
- **Cons:** Longer header string
- **Effort:** Small
- **Risk:** None — these are restrictive directives that match existing app behavior

## Technical Details

- **Affected files:** `next.config.mjs`

## Acceptance Criteria

- [ ] CSP header includes `base-uri 'self'`
- [ ] CSP header includes `form-action 'self'`
- [ ] CSP header includes `frame-ancestors 'none'`
- [ ] CSP header includes `object-src 'none'`
- [ ] App functions normally with new directives

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-09 | Created from code review | CSP defense-in-depth beyond the basics |
