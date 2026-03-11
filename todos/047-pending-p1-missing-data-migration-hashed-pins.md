---
status: pending
priority: p1
issue_id: "047"
tags: [code-review, security, data-integrity]
dependencies: []
---

# Missing Data Migration for Existing Bcrypt-Hashed Judge PINs

## Problem Statement

The auth flow at `src/shared/lib/auth.ts:53` does plaintext comparison (`pin === competitionPin`) for competition judge PINs. The seed data was changed from `bcrypt.hash("1234")` to `"1234"` to match this. However, any existing database environment that was seeded before this change has bcrypt-hashed `judgePin` values that will **never match** the plaintext comparison — silently breaking all judge logins.

## Findings

- **Source**: Data Integrity Guardian, Security Sentinel
- **Evidence**: `auth.ts:53` does `pinMatch = pin === competitionPin` (plaintext). Old seed stored `bcrypt.hash("1234")`. No data migration exists to clear or convert hashed PINs.

## Proposed Solutions

### Option A: Add data migration to NULL existing hashed PINs
- Create SQL migration: `UPDATE "Competition" SET "judgePin" = NULL WHERE "judgePin" LIKE '$2%';`
- Organizers must regenerate PINs after deployment
- **Pros**: Safe, forces explicit action. **Cons**: One-time inconvenience. **Effort**: Small. **Risk**: Low.

### Option B: Document as dev-only change
- If no production/staging environments exist yet, document that `db:reset` is required
- **Pros**: Zero effort. **Cons**: Only works if no real data exists. **Effort**: None. **Risk**: Medium.

## Recommended Action



## Technical Details

- **Affected files**: New migration file, `CLAUDE.md` or `MEMORY.md` update

## Acceptance Criteria

- [ ] Any environment with previously hashed PINs still works after deploy (or is explicitly handled)
- [ ] Security documentation updated to reflect plaintext competition PIN decision
