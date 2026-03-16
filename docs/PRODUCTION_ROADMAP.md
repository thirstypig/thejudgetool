# BBQ Judge — Production Readiness Roadmap

## PHASE 1: Security Hardening (Do First)

- [ ] Add Content Security Policy (CSP) headers in next.config.js or middleware
- [ ] Add rate limiting to all API routes (currently only on login)
- [ ] Add per-user PINs instead of shared competition PIN — shared PIN means any judge can log in as any other judge
- [ ] Re-validate JWT role against database on each request — currently a stale role persists until token expires (24h)
- [ ] Add CSRF protection to server actions
- [ ] Set secure cookie flags (httpOnly, sameSite, secure) — verify next-auth config
- [ ] Add input sanitization on all user-facing text fields to prevent XSS
- [ ] Add request size limits to prevent abuse
- [ ] Set up environment variable validation on startup (fail fast if missing)
- [ ] Add audit logging for admin actions (delete competition, modify scores, etc.)
- [ ] Move from in-memory rate limiting to Redis-based (in-memory resets on every deploy)

## PHASE 2: Reliability & Error Handling

- [ ] Add global error boundary with user-friendly error pages
- [ ] Add health check endpoint (/api/health) for uptime monitoring
- [ ] Set up error tracking service (Sentry or similar) — catch production errors before users report them
- [ ] Add database connection pooling (PgBouncer or Supabase connection pooler)
- [ ] Add retry logic for database operations that can transiently fail
- [ ] Add proper logging (structured JSON logs) instead of console.log
- [ ] Add database backups schedule on Supabase (verify it's enabled)
- [ ] Write integration tests for critical flows (login, score submission, tabulation)
- [ ] Add end-to-end tests with Playwright for the judge and organizer flows

## PHASE 3: Scaling & Performance

- [ ] Move off Render free tier to a paid plan (free tier sleeps after inactivity, slow cold starts)
- [ ] Add Redis for caching (session data, competition state, leaderboards)
- [ ] Add CDN for static assets (Cloudflare or similar)
- [ ] Optimize database queries — add indexes on frequently queried columns (competitionId, judgeId, categoryRoundId)
- [ ] Add database query logging to identify slow queries
- [ ] Consider read replicas if you get heavy traffic during live competitions
- [ ] Add WebSocket or SSE for real-time score updates instead of 15s polling
- [ ] Load test the app to find breaking points (how many concurrent judges?)

## PHASE 4: Multi-Tenancy & Monetization (Stripe)

- [ ] Design multi-tenant architecture — each organizer gets isolated data (right now everything is in one pool)
- [ ] Add organizer self-registration (sign up with email, verify email)
- [ ] Integrate Stripe for payments — tiered plans:
  - Free tier: 1 competition, up to 6 judges
  - Pro tier: unlimited competitions, up to 50 judges, priority support
  - Enterprise: custom pricing, dedicated support, API access
- [ ] Add Stripe Checkout for one-time competition purchases or subscriptions
- [ ] Add Stripe webhook handler for payment confirmations, subscription changes, failed payments
- [ ] Add billing dashboard for organizers (view invoices, manage subscription)
- [ ] Add usage tracking (number of competitions, judges, active events)
- [ ] Add organizer onboarding flow (create account → pick plan → pay → create first competition)

## PHASE 5: Marketing Website & Support

- [ ] Build a landing page (separate from the app) — what it does, pricing, testimonials
- [ ] Add demo mode — let potential customers try the app without signing up
- [ ] Add documentation / help center for organizers (how to set up a competition, import judges, etc.)
- [ ] Add in-app support chat or contact form (Intercom, Crisp, or simple email form)
- [ ] Add Terms of Service and Privacy Policy pages (required for Stripe and for trust)
- [ ] Add status page (upptime or similar) so organizers know if the system is up during events
- [ ] Set up transactional email (welcome email, password reset, competition reminders) via Resend or SendGrid
- [ ] Add social proof — case studies from real competitions
- [ ] SEO basics — meta tags, Open Graph, sitemap

## PHASE 6: Analytics & Observability

### Decision: No dedicated analytics tool for now

**Rationale:** The app is a competition tool, not a growth product. Operational data matters more than page-view metrics. The existing `AuditLog` model already tracks key competition events (category advances, winner declarations, score corrections).

**Current coverage (AuditLog):**
- Competition lifecycle events
- Score submissions and corrections
- Category round advances and submissions
- Winner declarations

**When to revisit:**
- **Vercel Analytics** — add if deployed on Vercel and you want zero-config page views + web vitals (trivial effort)
- **PostHog** — add if you need event funnels, session replay, or self-hosted analytics (low effort)
- **Structured logging** — add in Phase 2 (already listed) for server-side observability
- **Real user monitoring** — consider when running live competitions at scale

### Architecture Audit: Feature Module Isolation (2026-03-11)

**Result: 100% compliant.** All 5 feature modules enforce barrel export isolation.

| Module | Components | Actions | Types | Violations |
|--------|-----------|---------|-------|------------|
| competition | 15 | 14 | 4 | 0 |
| judging | 10 | 6 | 7 | 0 |
| scoring | 6 | 7 | 5 | 0 |
| tabulation | 6 | 4 | 6 | 0 |
| users | 1 | 0 | 2 | 0 |

- **0 direct internal imports** — no file imports from `@features/X/components/` etc.
- **2 valid cross-feature imports** (through barrel files):
  - `scoring` → `competition` (`markCategoryRoundSubmittedIfReady`)
  - `competition` → `users` (`JudgeImportForm`)
- **No refactoring needed.** Re-audit when adding new feature modules.

## PHASE 7: Nice-to-Haves

- [ ] Mobile app or PWA (installable on judge phones, works offline)
- [ ] PDF export for final results and score sheets
- [ ] White-label option (organizer's logo and branding)
- [ ] API access for integrations with other competition management tools
- [ ] Multi-language support if expanding beyond US
- [ ] Judge reputation/history tracking across competitions
- [ ] Automated competition setup wizard (walk organizers through step by step)
