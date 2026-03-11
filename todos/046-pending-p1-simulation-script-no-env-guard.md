---
status: pending
priority: p1
issue_id: "046"
tags: [code-review, security]
dependencies: []
---

# Simulation Script Has No Environment Guard

## Problem Statement

`scripts/simulate-competition.ts` performs `deleteMany` on every table in the database (lines 134-145) with no environment check. If accidentally run against a production database, it wipes all data. It also stores `User.pin` values as plaintext (e.g., `pin: "admin123"`, `pin: "1234"`) instead of bcrypt hashing, meaning users created by this script cannot log in through the normal auth flow (which uses `bcrypt.compare`).

## Findings

- **Source**: Security Sentinel, Data Integrity Guardian
- **Evidence**: Lines 134-145 perform cascading deletes on all models. Lines 116, 130 store plaintext PINs.
- No `NODE_ENV` check, no database URL validation, no confirmation prompt.

## Proposed Solutions

### Option A: Add environment guard + hash PINs
- Add `if (process.env.NODE_ENV === 'production') { process.exit(1) }` at top
- Hash `User.pin` values with bcrypt like `seed.ts` does
- **Pros**: Simple, comprehensive. **Cons**: None. **Effort**: Small. **Risk**: None.

## Recommended Action

Option A.

## Technical Details

- **Affected files**: `scripts/simulate-competition.ts`

## Acceptance Criteria

- [ ] Script refuses to run when `NODE_ENV=production`
- [ ] `User.pin` values are bcrypt-hashed
- [ ] Script still passes all assertions after changes
