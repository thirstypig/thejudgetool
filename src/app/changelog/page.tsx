import {
  ChevronRight,
  Code2,
  Sparkles,
  Bug,
  Gauge,
  RefreshCw,
  TestTube2,
  BookOpen,
  ShieldCheck,
  GitCommit,
  Calendar,
  Hash,
  type LucideIcon,
} from "lucide-react";
import { MetaPageNav } from "@shared/components/common/MetaPageNav";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ChangeType = "feat" | "fix" | "perf" | "refactor" | "test" | "docs" | "security";

interface Change {
  type: ChangeType;
  text: string;
}

interface Release {
  version: string;
  date: string;
  session: string;
  title: string;
  pr: string | null;
  filesChanged: number;
  linesAdded: number;
  linesRemoved: number;
  highlights: [string, string, string];
  changes: Change[];
}

// ---------------------------------------------------------------------------
// Change type config
// ---------------------------------------------------------------------------

const changeTypeConfig: Record<ChangeType, { label: string; icon: LucideIcon; className: string }> = {
  feat: { label: "Feature", icon: Sparkles, className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400" },
  fix: { label: "Fix", icon: Bug, className: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400" },
  perf: { label: "Perf", icon: Gauge, className: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400" },
  refactor: { label: "Refactor", icon: RefreshCw, className: "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400" },
  test: { label: "Test", icon: TestTube2, className: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400" },
  docs: { label: "Docs", icon: BookOpen, className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  security: { label: "Security", icon: ShieldCheck, className: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400" },
};

// ---------------------------------------------------------------------------
// Release data — derived from git history and development logs
// ---------------------------------------------------------------------------

const releases: Release[] = [
  {
    version: "0.10.0",
    date: "2026-03-16",
    session: "Session 9",
    title: "Tech Page Overhaul",
    pr: "PR #10",
    filesChanged: 7,
    linesAdded: 2190,
    linesRemoved: 324,
    highlights: [
      "Rewrote /tech page into comprehensive 11-section build teardown",
      "Added cost comparison, AI workflow docs, and Mermaid architecture diagrams",
      "Added sidebar nav links for organizer role",
    ],
    changes: [
      { type: "feat", text: "11-section /tech page with genesis, stats, cost comparison, AI workflow, architecture, tech stack, database ERDs, feature modules, build journal, lessons learned, and tools" },
      { type: "feat", text: "Cost comparison section: US dev shop vs offshore vs AI-assisted development" },
      { type: "feat", text: "AI Development Workflow section with delegation split documentation" },
      { type: "feat", text: "Mermaid.js architecture flowchart and 3 ERD diagrams" },
      { type: "feat", text: "CollapsibleSection component using native HTML details/summary" },
      { type: "refactor", text: "Moved all page data into TypeScript arrays/objects — no hardcoded JSX lists" },
      { type: "docs", text: "Updated build journal with session 8 and 9 entries" },
    ],
  },
  {
    version: "0.9.0",
    date: "2026-03-13",
    session: "Session 8",
    title: "Tech Page v1",
    pr: "PR #9",
    filesChanged: 1,
    linesAdded: 347,
    linesRemoved: 0,
    highlights: [
      "Created initial /tech page with codebase stats",
      "Added tools inventory and integrations listing",
      "Server component — no client-side JavaScript",
    ],
    changes: [
      { type: "feat", text: "Initial /tech page with codebase statistics grid" },
      { type: "feat", text: "Tools and integrations section grouped by category" },
      { type: "feat", text: "Tech stack listing with version details" },
    ],
  },
  {
    version: "0.8.0",
    date: "2026-03-11",
    session: "Session 7b",
    title: "Code Review Fixes & Architecture Cleanup",
    pr: "PR #8",
    filesChanged: 37,
    linesAdded: 1785,
    linesRemoved: 1728,
    highlights: [
      "Split monolithic competition/actions into 6 focused files",
      "Security hardening on server actions and query patterns",
      "Performance improvements on database queries",
    ],
    changes: [
      { type: "refactor", text: "Split competition/actions/index.ts (1,200+ lines) into 6 domain-specific files: competitions, competitors, judges, tables, category-rounds, distribution" },
      { type: "security", text: "Hardened server action auth patterns and ownership verification" },
      { type: "perf", text: "Optimized Prisma queries with selective includes and compound indexes" },
      { type: "refactor", text: "Cleaned up stale files and dead code from architecture changes" },
      { type: "fix", text: "Fixed edge cases discovered during code review" },
    ],
  },
  {
    version: "0.7.0",
    date: "2026-03-11",
    session: "Session 7a",
    title: "Diataxis Docs, E2E Simulation & Accessibility",
    pr: "PR #7",
    filesChanged: 85,
    linesAdded: 3533,
    linesRemoved: 148,
    highlights: [
      "E2E competition simulation script with 2,000+ assertions",
      "Documentation restructured into Diataxis framework (15 docs)",
      "Simulation found 3 DQ-handling bugs that unit tests missed",
    ],
    changes: [
      { type: "feat", text: "E2E competition simulation script — runs full KCBS lifecycle (seed → distribute → score 4 categories → tabulate → validate)" },
      { type: "feat", text: "Simulation generates markdown report at reports/simulation-report.md with standings and validation summaries" },
      { type: "docs", text: "Restructured all documentation into Diataxis framework: tutorials, how-to, reference, explanation" },
      { type: "docs", text: "Added tutorials: getting-started.md, first-competition.md" },
      { type: "docs", text: "Added how-to guides: add-a-feature-module.md, run-tests.md, manage-database.md" },
      { type: "docs", text: "Added reference docs: architecture.md, auth.md, scoring-rules.md, api.md, seed-data.md, database-schema.md" },
      { type: "docs", text: "Added explanation docs: judge-flow.md, security-model.md, box-distribution.md" },
      { type: "fix", text: "Fixed 3 DQ edge-case bugs in tabulation discovered by E2E simulation" },
      { type: "test", text: "2,000+ assertions in E2E simulation covering scoring, tiebreaking, and DQ handling" },
    ],
  },
  {
    version: "0.6.0",
    date: "2026-03-10",
    session: "Session 6",
    title: "WCAG Accessibility, OWASP Security & Spec Gaps",
    pr: "PR #6",
    filesChanged: 47,
    linesAdded: 1657,
    linesRemoved: 258,
    highlights: [
      "WCAG accessibility pass — ARIA labels, keyboard nav, focus management",
      "OWASP security headers and rate limiting on both login providers",
      "Test count jumped from ~40 to 113 with 3 new edge-case suites",
    ],
    changes: [
      { type: "feat", text: "ARIA labels and roles on all interactive elements" },
      { type: "feat", text: "Keyboard navigation support for DataTable, dropdowns, and modals" },
      { type: "feat", text: "Focus management on route transitions and modal open/close" },
      { type: "security", text: "OWASP security headers in next.config.js (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)" },
      { type: "security", text: "In-memory sliding-window rate limiter (5 attempts / 15 min) on both login providers" },
      { type: "security", text: "Failed login attempts logged with timestamp and identifier" },
      { type: "test", text: "Box distribution edge-case test suite (empty inputs, single table, maxed out)" },
      { type: "test", text: "Schema validation test suite (all Zod schemas with valid/invalid inputs)" },
      { type: "test", text: "Tabulation edge-case test suite (all DQs, ties, dropped scores)" },
      { type: "test", text: "Test count increased from ~40 to 113 across 25 suites" },
    ],
  },
  {
    version: "0.5.0",
    date: "2026-03-09",
    session: "Session 5",
    title: "Organizer UX Overhaul",
    pr: "PR #5",
    filesChanged: 41,
    linesAdded: 2377,
    linesRemoved: 652,
    highlights: [
      "Restructured organizer pages with new routes for check-in, tables, and boxes",
      "Competition selector dropdown and score audit with per-judge breakdown",
      "Enhanced DataTable with client-side search and configurable pagination",
    ],
    changes: [
      { type: "feat", text: "Competition selector dropdown in organizer top bar" },
      { type: "feat", text: "Score audit view with per-judge formula breakdown (raw × weight = weighted)" },
      { type: "feat", text: "New organizer routes: /teams/checkin, /teams/boxes, /judges/checkin, /judges/tables" },
      { type: "feat", text: "DataTable enhanced with searchFn prop for client-side search" },
      { type: "feat", text: "DataTable pagination with configurable page sizes (10/25/50)" },
      { type: "feat", text: "Competitor check-in: checkedIn + checkedInAt fields, checkInTeam/uncheckInTeam actions" },
      { type: "refactor", text: "Renamed 'Competitors' to 'BBQ Teams' across all organizer UI" },
      { type: "refactor", text: "Removed CBJ- prefix from all UI display — raw numbers only" },
      { type: "refactor", text: "Organizer sidebar restructured with event lifecycle ordering" },
    ],
  },
  {
    version: "0.4.0",
    date: "2026-03-09",
    session: "Session 4",
    title: "Box Distribution Algorithm",
    pr: "PR #4",
    filesChanged: 17,
    linesAdded: 1006,
    linesRemoved: 100,
    highlights: [
      "Latin square box distribution algorithm (no repeat competitor at same table)",
      "188 unit tests for the distribution generator",
      "Captain dashboard polished with category submission screen",
    ],
    changes: [
      { type: "feat", text: "Box distribution generator with Latin square constraint (BR-2: no repeat competitor at same table across categories)" },
      { type: "feat", text: "Distribution approval workflow with cascading delete guard" },
      { type: "feat", text: "Category submission dialog for table captains" },
      { type: "feat", text: "Server-side gates for competition state transitions" },
      { type: "test", text: "188 unit tests for box distribution algorithm" },
      { type: "security", text: "guardAndCascadeDeleteSubmissions() checks for locked scores before cascade" },
    ],
  },
  {
    version: "0.3.0",
    date: "2026-03-09",
    session: "Session 3b",
    title: "Security Hardening",
    pr: "PR #3",
    filesChanged: 15,
    linesAdded: 172,
    linesRemoved: 173,
    highlights: [
      "Auth guards added to every server action",
      "User IDs derived from session — removed all client-supplied IDs",
      "Database writes wrapped in Prisma transactions",
    ],
    changes: [
      { type: "security", text: "Created auth-guards.ts: requireAuth(), requireOrganizer(), requireJudge(), requireCaptain()" },
      { type: "security", text: "Retrofitted all 62 server actions to start with auth guard" },
      { type: "security", text: "Derived all user IDs from session — eliminated IDOR vulnerabilities" },
      { type: "security", text: "Captain actions verify table ownership (table.captainId === userId)" },
      { type: "security", text: "Wrapped multi-step mutations in prisma.$transaction" },
      { type: "fix", text: "Fixed claimSeat to verify assignment.userId === session userId" },
    ],
  },
  {
    version: "0.2.0",
    date: "2026-03-09",
    session: "Session 3a",
    title: "Judge Flow & Comment Cards",
    pr: "PR #2",
    filesChanged: 24,
    linesAdded: 1682,
    linesRemoved: 579,
    highlights: [
      "Extended judge flow with event info and comment card phases",
      "Two-tab judge management layout (import + roster)",
      "CompetitionJudge model for per-competition registration",
    ],
    changes: [
      { type: "feat", text: "Event info phase — pre-judging screen with competition details and gated Start button" },
      { type: "feat", text: "Comment card phase — post-scoring feedback with taste and tenderness checks" },
      { type: "feat", text: "CommentCard model with auto-populated scores from ScoreCard" },
      { type: "feat", text: "CompetitionJudge model for per-competition registration and check-in tracking" },
      { type: "feat", text: "Two-tab judge management: JudgeImportForm (single + bulk) + JudgeRosterPanel" },
      { type: "feat", text: "CommentCardToggle on organizer setup page" },
      { type: "feat", text: "localStorage keys for judge session state: started flag, comments-done flag" },
    ],
  },
  {
    version: "0.1.0",
    date: "2026-03-08",
    session: "Session 2",
    title: "Complete Application Build",
    pr: "PR #1",
    filesChanged: 130,
    linesAdded: 14396,
    linesRemoved: 1605,
    highlights: [
      "Full app in one session: 12 Prisma models, 5 feature modules, auth, dashboard, seed data",
      "KCBS scoring engine with weighted averages and tiebreaking",
      "Design system: 11 common components + 10 UI primitives",
    ],
    changes: [
      { type: "feat", text: "Prisma schema: 12 models (Competition, User, Competitor, Table, TableAssignment, CompetitionJudge, CategoryRound, Submission, ScoreCard, CorrectionRequest, CommentCard, AuditLog)" },
      { type: "feat", text: "5 feature modules with full structure: competition, judging, scoring, tabulation, users" },
      { type: "feat", text: "NextAuth.js v5 with JWT strategy, two Credentials providers (judge + organizer)" },
      { type: "feat", text: "Dashboard shell with role-based sidebar navigation (organizer, judge, captain)" },
      { type: "feat", text: "KCBS scoring constants: valid scores, weights, tiebreaking rules" },
      { type: "feat", text: "Judge flow: 4-phase setup (not-registered → awaiting-table → pick-seat → ready)" },
      { type: "feat", text: "Scoring components: ScorePicker (1-9 grid), ScoreCard compound, SubmissionQueue" },
      { type: "feat", text: "Captain dashboard: TableStatusBoard, ScoreReviewTable, CorrectionRequestPanel" },
      { type: "feat", text: "Tabulation engine: weighted scoring, drop-lowest, KCBS tiebreaking" },
      { type: "feat", text: "Results page: 4-tab layout (progress, results, score audit, audit log) with 15s polling" },
      { type: "feat", text: "Seed data: 1 competition, 1 organizer, 24 judges (4 captains), 24 BBQ teams, 4 tables" },
      { type: "feat", text: "Design system: PageHeader, StatusBadge, RoleBadge, EmptyState, LoadingSpinner, ThemeToggle, ConfirmDialog, DataTable, ScoreDisplay, SectionCard, UserAvatar" },
      { type: "feat", text: "UI primitives: button, input, label, badge, card, tabs, dropdown-menu, alert-dialog, table, sheet" },
      { type: "feat", text: "Rules page with KCBS scoring reference" },
      { type: "feat", text: "Middleware: role-based route protection for /organizer, /captain, /judge, /rules" },
      { type: "test", text: "3 initial test suites for scoring utils, validation, and tabulation" },
    ],
  },
  {
    version: "0.0.1",
    date: "2026-03-06",
    session: "Session 1",
    title: "Project Scaffolding",
    pr: null,
    filesChanged: 23,
    linesAdded: 11118,
    linesRemoved: 158,
    highlights: [
      "Next.js 14 with TypeScript strict mode and App Router",
      "Tailwind CSS v3 with custom deep red theme",
      "Path aliases configured: @/*, @features/*, @shared/*",
    ],
    changes: [
      { type: "feat", text: "Next.js 14.2 app with TypeScript strict mode" },
      { type: "feat", text: "Tailwind CSS v3 with custom theme (deep red #C0392B primary)" },
      { type: "feat", text: "Path aliases: @/* → src/*, @features/* → src/features/*, @shared/* → src/shared/*" },
      { type: "feat", text: "shadcn/ui configured for new-york style with CSS variables" },
      { type: "docs", text: "Initial CLAUDE.md with project constraints and stack info" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Computed stats
// ---------------------------------------------------------------------------

const totalReleases = releases.length;
const totalChanges = releases.reduce((sum, r) => sum + r.changes.length, 0);
const totalSessions = new Set(releases.map((r) => r.session)).size;
const totalLinesAdded = releases.reduce((sum, r) => sum + r.linesAdded, 0);

// Change type distribution
const changeTypeCounts = releases.reduce<Record<ChangeType, number>>(
  (acc, r) => {
    r.changes.forEach((c) => {
      acc[c.type] = (acc[c.type] || 0) + 1;
    });
    return acc;
  },
  { feat: 0, fix: 0, perf: 0, refactor: 0, test: 0, docs: 0, security: 0 }
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const card = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg";
const accentIcon = "text-red-600 dark:text-red-500";

function ChangeTypeBadge({ type }: { type: ChangeType }) {
  const config = changeTypeConfig[type];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function StatCard({ value, label, icon: Icon }: { value: string; label: string; icon: LucideIcon }) {
  return (
    <div className={`${card} p-5 flex items-start gap-4`}>
      <div className={`p-2 rounded-md bg-red-50 dark:bg-red-950 ${accentIcon} shrink-0`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-2">
            <GitCommit className={`h-8 w-8 ${accentIcon}`} />
            <span className="text-sm font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Changelog
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            BBQ Judge — Release History
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mb-4">
            Every release from project scaffolding to the latest feature. Each entry maps
            to a PR merge with detailed change breakdowns by type.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Last updated: March 19, 2026
          </p>
        </div>
      </header>

      <MetaPageNav currentPath="/changelog" />

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-12">

        {/* ── 1. Stats Summary ──────────────────────────────────────── */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard value={totalReleases.toString()} label="Releases" icon={Hash} />
            <StatCard value={totalChanges.toString()} label="Total Changes" icon={GitCommit} />
            <StatCard value={totalSessions.toString()} label="Sessions" icon={Calendar} />
            <StatCard value={`${(totalLinesAdded / 1000).toFixed(1)}K`} label="Lines Added" icon={Code2} />
          </div>

          {/* Change type distribution */}
          <div className={`${card} p-5 mt-4`}>
            <h3 className="text-sm font-semibold mb-3">Changes by Type</h3>
            <div className="flex flex-wrap gap-3">
              {(Object.entries(changeTypeCounts) as [ChangeType, number][])
                .filter(([, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const config = changeTypeConfig[type];
                  const Icon = config.icon;
                  return (
                    <div key={type} className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded ${config.className}`}>
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </span>
                      <span className="text-sm font-bold">{count}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </section>

        {/* ── 2. Release Cards ──────────────────────────────────────── */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Releases</h2>
          <div className="space-y-4">
            {releases.map((release) => (
              <details key={release.version} className={`${card} overflow-hidden group`}>
                <summary className="cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="px-5 py-4">
                    {/* Top line: version, date, session, PR */}
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-90 shrink-0" />
                      <span className="font-mono font-bold text-red-600 dark:text-red-400">v{release.version}</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">{release.date}</span>
                      <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">{release.session}</span>
                      {release.pr && (
                        <span className="text-xs font-mono text-slate-400">{release.pr}</span>
                      )}
                      <span className="text-xs text-slate-400 ml-auto hidden sm:inline">
                        {release.filesChanged} files &middot; +{release.linesAdded.toLocaleString()} / -{release.linesRemoved.toLocaleString()}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-lg ml-7 mb-2">{release.title}</h3>

                    {/* 3 highlights — always visible */}
                    <ul className="ml-7 space-y-1">
                      {release.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <span className="text-red-500 mt-1.5 shrink-0">&#8226;</span>
                          {h}
                        </li>
                      ))}
                    </ul>

                    {/* Change count hint */}
                    <p className="ml-7 mt-2 text-xs text-slate-400">
                      {release.changes.length} changes — click to expand
                    </p>
                  </div>
                </summary>

                {/* Expanded: individual changes */}
                <div className="border-t border-slate-200 dark:border-slate-800 px-5 py-4">
                  <div className="space-y-2 ml-7">
                    {release.changes.map((change, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <ChangeTypeBadge type={change.type} />
                        <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{change.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 pt-8 text-center space-y-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {totalReleases} releases &middot; {totalChanges} changes &middot; {totalSessions} sessions &middot; {totalLinesAdded.toLocaleString()} lines added
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Built with Claude Code
          </p>
        </footer>
      </main>
    </div>
  );
}
