# Auth Reference

## Authentication Providers

Two credential providers configured in `src/shared/lib/auth.ts`:

| Provider | Login fields | Redirects to |
|----------|-------------|--------------|
| **Judge** | CBJ number + PIN | `/judge` (JUDGE) or `/captain` (TABLE_CAPTAIN) |
| **Organizer** | Email + password | `/organizer` |

Session uses **JWT strategy** (no database sessions). JWT includes `role` and `cbjNumber` via callbacks. Sessions expire after **24 hours** (`maxAge: 86400`).

## Auth Exports

```typescript
import { handlers, signIn, signOut, auth } from "@/shared/lib/auth";
```

`auth()` returns `Session | null`. Access custom fields with cast:

```typescript
const session = await auth();
const role = (session?.user as { role?: string })?.role;
```

## Middleware (`src/middleware.ts`)

- Protects all routes except `/login`, `/api`, static assets
- Unauthenticated users redirect to `/login` with `callbackUrl` query param
- Role enforcement:
  - `/organizer/*` — ORGANIZER only
  - `/captain/*` — TABLE_CAPTAIN only
  - `/judge/*` — JUDGE only
- Role mismatch redirects to the correct dashboard

## Server-Side Auth Guards (`src/shared/lib/auth-guards.ts`)

Every server action must start with an auth guard:

| Guard | Who can call | Returns |
|-------|-------------|---------|
| `requireAuth()` | Any authenticated user | `{ userId }` |
| `requireOrganizer()` | ORGANIZER only | `{ userId }` |
| `requireJudge()` | JUDGE or TABLE_CAPTAIN | `{ userId, cbjNumber }` |
| `requireCaptain()` | TABLE_CAPTAIN or ORGANIZER | `{ userId }` |

Guards throw `"Unauthorized"` on failure. They complement middleware — never rely on route middleware alone.

## Additional Security Checks

Beyond auth guards, certain actions require ownership verification:

- **Captain actions** — verify `table.captainId === userId` after auth guard
- **Score/correction data** — requires captain + table ownership (prevents IDOR)
- **Judge actions** — verify judge has a `TableAssignment` for the table
- **claimSeat** — verify `assignment.userId === userId`

## Password Hashing

All credentials use **bcrypt** (10 salt rounds):
- `User.pin` — individual user PIN/password
- `Competition.judgePin` — shared competition PIN

## Rate Limiting

In-memory sliding-window rate limiter on login:
- **5 attempts per 15 minutes** per identifier
- Applied to both Judge and Organizer providers
- Failed attempts are logged
- Configured in `src/shared/lib/rate-limit.ts`

## Security Headers (`next.config.mjs`)

| Header | Value |
|--------|-------|
| Content-Security-Policy | `default-src 'self'`, `script-src 'self' 'unsafe-inline'` (+`'unsafe-eval'` dev-only), `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`, `object-src 'none'` |
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | camera=(), microphone=(), geolocation=() |

## CSV Export Sanitization

Exported CSV values are sanitized to prevent formula injection:
- Double-quotes escaped as `""`
- Values starting with `=`, `+`, `-`, `@`, `\t`, `\r`, `\n`, `|` are prefixed with `'`

## Login Page

- Two-tab form in `LoginForm.tsx` (client component, wrapped in Suspense for `useSearchParams`)
- Fetches session after `signIn()` to determine role-based redirect
- CBJ numbers are raw digits (no "CBJ-" prefix)

## Dashboard Shell (`DashboardShell.tsx`)

- Desktop: fixed 240px sidebar with role-filtered navigation
- Mobile: Sheet drawer triggered by hamburger menu
- Top bar: competition selector (organizer only), ThemeToggle, user avatar + sign out
- Nav links resolve to active competition ID
