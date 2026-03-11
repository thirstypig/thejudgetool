# Security Model

Why the auth and access control system is designed the way it is.

## Defense in Depth

The app uses **three layers** of access control:

1. **Middleware** (route level) — Redirects unauthorized users before they reach any page
2. **Auth guards** (server action level) — Every server action validates role before executing
3. **Ownership checks** (data level) — Actions verify the caller owns the resource they're modifying

Each layer is independent. A compromised middleware doesn't bypass server action guards. A valid role doesn't grant access to another captain's table.

## Why Auth Guards on Every Action

Next.js middleware runs at the edge and can verify that a user is authenticated and has the right role for a route. But middleware alone is insufficient because:

- **Server actions can be called directly** — A malicious client can invoke any server action by name, bypassing route-based middleware entirely
- **Role checks need to be atomic with data access** — Checking role in middleware, then trusting it in the action, creates a TOCTOU gap
- **Defense in depth** — If middleware is misconfigured or bypassed, actions remain protected

Every server action starts with one of: `requireAuth()`, `requireOrganizer()`, `requireJudge()`, `requireCaptain()`.

## Why Captain Ownership Checks

Table captains have elevated access — they see all judges' score cards, approve corrections, and submit categories. But a captain for Table 1 should never access Table 2's data.

After the `requireCaptain()` auth guard, captain actions verify:

```typescript
if (table.captainId !== userId) {
  throw new Error("Not authorized for this table");
}
```

This prevents **IDOR (Insecure Direct Object Reference)** attacks where a captain manipulates table IDs in requests to access other tables' data.

The same pattern applies to judge actions — `submitScoreCard`, `getBoxesForTable`, etc. verify the judge has a `TableAssignment` for the target table.

## Why JWT (Not Database Sessions)

The app uses JWT-based sessions (`next-auth` with JWT strategy) rather than database sessions because:

- **No session table needed** — Simpler schema, fewer queries
- **Stateless verification** — No database round-trip to validate every request
- **Supabase connection limits** — Pooled connections are precious; eliminating session queries saves connections for business logic

The tradeoff: JWTs can't be invalidated server-side. A compromised token is valid until expiry (24 hours). This is acceptable for a competition app where sessions last one day.

**Known limitation**: If an admin changes a user's role, the JWT retains the old role until it expires. This is documented but not fixed — competitions don't typically change roles mid-event.

## Why Bcrypt for PINs

Judge PINs are 4-digit numbers. Without hashing, a database breach would expose all PINs in plaintext. Bcrypt with 10 salt rounds provides:

- **One-way hashing** — PINs can't be recovered from the hash
- **Per-hash salts** — Identical PINs produce different hashes
- **Work factor** — Brute-forcing 10,000 possible 4-digit PINs is feasible, but bcrypt's cost factor makes it slower than plaintext comparison

The shared competition PIN (`Competition.judgePin`) uses the same bcrypt hashing.

## Rate Limiting

The login endpoint uses an **in-memory sliding-window rate limiter** (5 attempts per 15 minutes per identifier). This prevents:

- **Brute-force PIN attacks** — 4-digit PINs have only 10,000 combinations
- **Credential stuffing** — Automated login attempts with leaked credentials

The rate limiter is in-memory (not Redis) because:
- Single-server deployment (no distributed state needed)
- Restarts clear the limiter, which is acceptable — a competition lasts one day

## Security Headers

CSP and other headers are configured in `next.config.mjs`:

- **CSP**: Restricts script sources to `'self'` + `'unsafe-inline'` (needed for Next.js). `'unsafe-eval'` only in development.
- **X-Frame-Options: DENY** — Prevents clickjacking
- **X-Content-Type-Options: nosniff** — Prevents MIME type sniffing
- **Permissions-Policy** — Disables camera, microphone, geolocation

## CSV Export Sanitization

Exported results sanitize cell values to prevent **formula injection** attacks in spreadsheet software. Values starting with `=`, `+`, `-`, `@`, `\t`, `\r`, `\n`, `|` are prefixed with `'` (single quote). This prevents malicious formulas from executing when organizers open CSV files in Excel or Google Sheets.

## Transaction Safety

Operations that modify multiple records use Prisma `$transaction` to ensure atomicity:

- **Distribution approval** — Creates all Submission records at once
- **Category submission** — Validates all judges done, marks as submitted, logs to audit
- **Correction approval** — Unlocks score card and updates correction status together
- **Cascade deletions** — `guardAndCascadeDeleteSubmissions()` checks for locked scores before allowing deletion

If any step fails, the entire transaction rolls back.
