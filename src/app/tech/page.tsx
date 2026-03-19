import {
  Code2,
  Database,
  FileCode2,
  GitCommit,
  Layers,
  LayoutDashboard,
  Server,
  TestTube2,
  Zap,
  BookOpen,
  Cpu,
  Palette,
  Box,
  Terminal,
  Clock,
  ChevronRight,
  Lightbulb,
  Wrench,
  Package,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { MermaidDiagram } from "@shared/components/common/MermaidDiagram";
import { MetaPageNav } from "@shared/components/common/MetaPageNav";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const stats = [
  { label: "Lines of Code", value: "16,424", sublabel: "8,280 client / 8,144 server", icon: Code2 },
  { label: "Source Files", value: "136", sublabel: ".ts and .tsx files", icon: FileCode2 },
  { label: "React Components", value: "39", sublabel: "Feature + shared components", icon: LayoutDashboard },
  { label: "Server Actions", value: "62", sublabel: "Across 10 action files", icon: Server },
  { label: "Database Models", value: "12", sublabel: "Prisma schema (PostgreSQL)", icon: Database },
  { label: "Unit Tests", value: "113", sublabel: "25 test suites, all passing", icon: TestTube2 },
  { label: "Feature Modules", value: "5", sublabel: "Domain-driven architecture", icon: Layers },
  { label: "Prisma Migrations", value: "8", sublabel: "Incremental schema evolution", icon: Package },
  { label: "Git Commits", value: "19", sublabel: "Mar 6 – Mar 16, 2026", icon: GitCommit },
  { label: "PRs Merged", value: "10", sublabel: "Feature-branch workflow", icon: GitCommit },
  { label: "Documentation", value: "1,561", sublabel: "Lines across 15 docs (Diataxis)", icon: BookOpen },
  { label: "CLAUDE.md", value: "103", sublabel: "Lines of AI context", icon: Terminal },
  { label: "Dependencies", value: "38", sublabel: "25 prod + 13 dev", icon: Box },
];

interface CostEstimate {
  label: string;
  rateRange: string;
  hoursLow: number;
  hoursHigh: number;
  rateLow: number;
  rateHigh: number;
}

const costEstimates: CostEstimate[] = [
  { label: "US Dev Shop", rateRange: "$150–250/hr", hoursLow: 400, hoursHigh: 600, rateLow: 150, rateHigh: 250 },
  { label: "Offshore (India/China)", rateRange: "$25–60/hr", hoursLow: 500, hoursHigh: 800, rateLow: 25, rateHigh: 60 },
  { label: "AI-Assisted (this project)", rateRange: "$20/mo API", hoursLow: 40, hoursHigh: 60, rateLow: 0, rateHigh: 0 },
];

const scopeBullets = [
  "12-model PostgreSQL schema with migrations and seed data",
  "Role-based auth (JWT) with 3 credential providers and rate limiting",
  "62 server actions with auth guards, transactions, and Zod validation",
  "39 React components across 5 feature modules (organizer, judge, captain flows)",
  "KCBS scoring engine with weighted averages, tiebreaking, and DQ handling",
  "Box distribution algorithm with Latin square constraint",
  "113 unit tests + E2E simulation script (2,000+ assertions)",
  "Full documentation suite (15 docs in Diataxis framework)",
  "Dark/light theme, mobile responsive, WCAG accessibility",
];

const aiWorkflowCards = [
  {
    icon: Terminal,
    title: "Terminal-Only Development",
    detail: "Every line of code was generated through Claude Code (CLI). No IDE code generation, no copy-paste from ChatGPT. The terminal is the entire development environment — prompts in, code out, diffs reviewed.",
  },
  {
    icon: FileCode2,
    title: "CLAUDE.md — Cross-Session Memory",
    detail: "The 103-line CLAUDE.md file gives Claude full project context at the start of every session: stack constraints (Prisma must stay on v5), business rules (KCBS scoring), auth patterns, seed data. Without it, every session starts from zero. With it, Claude makes architecturally consistent decisions immediately.",
  },
  {
    icon: MessageSquare,
    title: "Session = 1 Conversation = 1 PR",
    detail: "Each development session was one Claude Code conversation, typically producing one PR. Sessions ranged from focused fixes (PR #3: security hardening, 15 files) to large feature pushes (PR #1: full app scaffold, 130 files).",
  },
  {
    icon: Lightbulb,
    title: "Human Directs, AI Implements",
    detail: "I made architecture decisions (feature modules, barrel exports), defined the security model (auth guards, session-derived IDs), designed UX flows (judge phases, captain workflow), and decided what to build next. Claude generated the implementation, tests, and documentation. I reviewed every diff.",
  },
];

const delegationSplit = {
  delegated: [
    "Component implementation from description",
    "Server action boilerplate + Prisma queries",
    "Test generation for pure utility functions",
    "Prisma schema design from requirements",
    "Accessibility fixes (ARIA, keyboard nav)",
    "Documentation generation (Diataxis structure)",
  ],
  directed: [
    "Architecture decisions (feature modules, barrel exports)",
    "Security model (auth guards, session-derived IDs)",
    "UX flows (judge phases, captain workflow)",
    "What to build next (session sequencing)",
    "What to cut (no per-user PINs for MVP)",
    "Code review — approving or rejecting diffs",
  ],
};

const techStack = [
  {
    category: "Frontend",
    icon: Palette,
    items: [
      { name: "Next.js 14.2", detail: "App Router, server components, server actions" },
      { name: "React 18", detail: "Hooks, context, Suspense" },
      { name: "TypeScript 5", detail: "Strict mode across entire codebase" },
      { name: "Tailwind CSS v3", detail: "Utility-first, custom theme (deep red primary)" },
      { name: "shadcn/ui + Radix UI", detail: "Accessible headless primitives (new-york style)" },
      { name: "Zustand", detail: "Lightweight client state management" },
      { name: "React Hook Form + Zod", detail: "Form handling with runtime schema validation" },
      { name: "next-themes", detail: "Dark/light mode with system preference" },
      { name: "Lucide React", detail: "Icon library" },
      { name: "Mermaid.js", detail: "Diagrams as code (ERDs, flowcharts)" },
    ],
  },
  {
    category: "Backend & Data",
    icon: Database,
    items: [
      { name: "Prisma 5", detail: "Type-safe ORM, migrations, transactions, seeding" },
      { name: "Supabase (PostgreSQL)", detail: "Managed Postgres with connection pooling" },
      { name: "NextAuth.js v5 (beta)", detail: "JWT auth, two Credentials providers, 24h expiry" },
      { name: "bcryptjs", detail: "Password hashing for all stored credentials" },
      { name: "Custom rate limiter", detail: "In-memory sliding window (5 attempts / 15 min)" },
      { name: "date-fns", detail: "Date manipulation and formatting" },
    ],
  },
  {
    category: "Testing & Quality",
    icon: TestTube2,
    items: [
      { name: "Vitest", detail: "113 unit tests across 25 suites" },
      { name: "E2E simulation script", detail: "Full KCBS lifecycle, 2,000+ assertions" },
      { name: "ESLint", detail: "Next.js linting configuration" },
    ],
  },
  {
    category: "Infrastructure",
    icon: Zap,
    items: [
      { name: "Vercel", detail: "Hosting with edge middleware and preview deploys" },
      { name: "GitHub", detail: "Source control with PR workflows (10 PRs merged)" },
      { name: "tsx", detail: "TypeScript execution for scripts and seeding" },
    ],
  },
];

const featureModules = [
  {
    name: "competition",
    description: "Competition lifecycle — CRUD, category round advancement, box distribution, judge/table management.",
    actions: 27,
    components: 12,
  },
  {
    name: "judging",
    description: "Judge experience — setup flow (4 phases), score card submission, appearance-first workflow, comment cards.",
    actions: 16,
    components: 13,
  },
  {
    name: "scoring",
    description: "Table captain dashboard — score review, correction request approval/denial, category submission.",
    actions: 9,
    components: 6,
  },
  {
    name: "tabulation",
    description: "Results engine — KCBS weighted scoring, tiebreaking, winner declaration, score audit, audit log.",
    actions: 7,
    components: 7,
  },
  {
    name: "users",
    description: "Judge import (single + bulk) and search. Lightweight — most user logic lives in competition.",
    actions: 3,
    components: 1,
  },
];

const buildJournal = [
  {
    date: "Mar 16",
    title: "Tech page overhaul",
    prs: ["PR #10"],
    description: "Rewrote the /tech page from a simple stats page into a comprehensive 11-section build teardown with Mermaid diagrams, cost comparison, AI workflow documentation, and build journal.",
    linesChanged: "+485 / -347",
    mistake: null,
  },
  {
    date: "Mar 13",
    title: "Tech page v1",
    prs: ["PR #9"],
    description: "Created the initial /tech page with codebase stats, tools inventory, and integrations.",
    linesChanged: "+347",
    mistake: null,
  },
  {
    date: "Mar 11 AM",
    title: "Docs, E2E simulation, architecture refactor",
    prs: ["PR #7", "PR #8"],
    description: "Restructured all documentation into Diataxis framework (tutorials, how-to, reference, explanation). Built E2E competition simulation script — runs full KCBS lifecycle with 2,000+ assertions and generates a markdown report. Then a refactor pass: split the monolithic competition/actions/index.ts into 6 focused files. Cleaned up stale files.",
    linesChanged: "+5,318 / -2,166",
    mistake: "The simulation script found 3 bugs that unit tests missed (all in edge cases around DQ handling). Should have written the simulation earlier — it's a better integration test than anything I had.",
  },
  {
    date: "Mar 10",
    title: "Accessibility, security, edge cases",
    prs: ["PR #6"],
    description: "WCAG pass: ARIA labels, keyboard navigation fixes, focus management. OWASP security headers in next.config. Rate limiting on both login providers. Three new edge-case test suites (box distribution edge cases, all schema validation, tabulation edge cases). Test count jumped from ~40 to 113.",
    linesChanged: "+1,657 / -258",
    mistake: "Rate limiter is in-memory — resets on deploy. Fine for MVP, but would need Redis or similar for production. Chose to document this rather than over-engineer.",
  },
  {
    date: "Mar 9 PM",
    title: "Organizer UX overhaul",
    prs: ["PR #5"],
    description: "Major restructure of organizer pages: new routes for check-in, table management, box distribution. Added competition selector dropdown, score audit view with per-judge formula breakdown. Enhanced DataTable with client-side search and pagination. 41 files touched.",
    linesChanged: "+2,377 / -652",
    mistake: "Navigation structure changed three times in this session. Should have sketched the IA before coding. Ended up with dead routes that had to be cleaned up later.",
  },
  {
    date: "Mar 9 mid-day",
    title: "Box distribution algorithm",
    prs: ["PR #4"],
    description: "Built the box distribution generator with Latin square constraint (no repeat competitor at same table across categories). Added 188 unit tests for the algorithm. Captain dashboard polished with category submission screen.",
    linesChanged: "+1,006 / -100",
    mistake: null,
  },
  {
    date: "Mar 9 AM",
    title: "Judge flow + security hardening",
    prs: ["PR #2", "PR #3"],
    description: "Extended judge flow with event info screen and comment cards. Then a focused security pass: created auth-guards.ts with requireAuth/requireOrganizer/requireJudge/requireCaptain. Retrofitted every server action to start with an auth guard. Wrapped DB writes in transactions. Derived all user IDs from session (removed client-supplied IDs).",
    linesChanged: "+1,854 / -752",
    mistake: "Auth guards should have been in the first commit. Building all the features before security meant retrofitting 10+ action files. The guard pattern was simple — no reason not to do it from day one.",
  },
  {
    date: "Mar 8",
    title: "Full app built in one session",
    prs: ["PR #1"],
    description: "Single massive commit: Prisma schema (12 models), all 5 feature modules with actions/components/types/schemas, auth system (JWT + Credentials), dashboard shell with role-based navigation, KCBS scoring constants, seed data (24 judges, 24 teams, 4 tables), design system (11 common components + 10 UI primitives), 3 test suites, and the rules page. 130 files changed.",
    linesChanged: "+14,396 / -1,605",
    mistake: "Built too much in one commit. Made the next round of fixes harder to isolate. Should have shipped Prisma schema + auth first, then features incrementally.",
  },
  {
    date: "Mar 6",
    title: "Project scaffolding",
    prs: [],
    description: "Created Next.js 14 app with TypeScript strict mode. Added shadcn/ui configured for Tailwind v3 (not v4 — shadcn v4 generates incompatible code). Set up path aliases.",
    linesChanged: "+11,118",
    mistake: null,
  },
];

const lessonsLearned = [
  {
    type: "worked" as const,
    title: "CLAUDE.md is the single most important file",
    detail: "103 lines that give Claude full context across sessions: stack constraints (Prisma must stay on v5), business rules (KCBS scoring), auth patterns, seed data credentials. Without it, every new session starts from zero. With it, Claude can make architecturally consistent decisions immediately.",
  },
  {
    type: "worked" as const,
    title: "Pure functions for business logic",
    detail: "Extracting KCBS scoring rules, box distribution, and validation into pure utility functions made them trivially testable (113 tests, all passing). No database mocking needed. The E2E simulation composes these same functions to validate a full competition lifecycle.",
  },
  {
    type: "worked" as const,
    title: "Feature module pattern keeps things navigable",
    detail: "Each of the 5 feature modules has the same structure (actions/, components/, types/, schemas/, store/, index.ts barrel). Claude can work on one module without accidentally breaking another. The barrel export forces you to define the public API.",
  },
  {
    type: "worked" as const,
    title: "E2E simulation catches what unit tests miss",
    detail: "The simulation script found 3 bugs that passed code review and unit tests — all in edge cases around DQ handling and scoring with missing judges. Automated end-to-end verification is more reliable than trying to review faster.",
  },
  {
    type: "hard" as const,
    title: "Security is easier to build in than bolt on",
    detail: "Auth guards, session-derived user IDs, and table ownership verification were added in PR #3 — after the entire app was already built. Retrofitting 10+ action files was tedious and error-prone. The pattern itself was simple. Should have been there from commit one.",
  },
  {
    type: "hard" as const,
    title: "AI generates code faster than you can review it",
    detail: "The biggest risk isn't wrong code — it's code you approved without fully understanding. The simulation script caught 3 bugs that passed code review. Adding more automated verification (tests, E2E simulation) is more reliable than trying to review faster.",
  },
  {
    type: "hard" as const,
    title: "Don't build the whole app in one commit",
    detail: "PR #1 changed 130 files in one shot. When bugs surfaced, it was nearly impossible to git bisect or isolate the cause. Incremental PRs (schema → auth → features → polish) would have been much easier to debug and review.",
  },
];

const toolsUsed = [
  {
    category: "AI Development",
    icon: Cpu,
    tools: [
      { name: "Claude Code (CLI)", description: "Primary development tool — all code generation, architecture decisions, and iteration" },
      { name: "Claude Opus 4", description: "LLM powering code generation, planning, and review" },
    ],
  },
  {
    category: "Development Tools",
    icon: Wrench,
    tools: [
      { name: "VS Code", description: "Editor for code review and manual edits" },
      { name: "GitHub", description: "Source control with PR-based workflow (10 PRs merged)" },
      { name: "Vercel", description: "Deployment platform with preview deploys per PR" },
      { name: "Supabase", description: "Managed PostgreSQL hosting with connection pooling" },
    ],
  },
  {
    category: "Build & Runtime",
    icon: Terminal,
    tools: [
      { name: "Node.js", description: "JavaScript runtime" },
      { name: "npm", description: "Package management (38 dependencies)" },
      { name: "tsx", description: "TypeScript execution for scripts and seeding" },
      { name: "PostCSS", description: "CSS processing pipeline for Tailwind" },
    ],
  },
];

// -- Mermaid chart definitions ------------------------------------------------

const architectureChart = `flowchart TB
    subgraph Browser["Browser"]
        RC["React Components<br/><small>39 feature + shared components</small>"]
        ZS["Zustand Stores<br/><small>Client state</small>"]
        RHF["React Hook Form<br/><small>+ Zod validation</small>"]
    end

    subgraph NextJS["Next.js 14 (App Router)"]
        MW["Middleware<br/><small>Role-based route protection</small>"]
        SA["Server Actions<br/><small>62 actions across 10 files</small>"]
        AG["Auth Guards<br/><small>requireAuth / requireOrganizer<br/>requireJudge / requireCaptain</small>"]
        AUTH["NextAuth.js v5<br/><small>JWT + Credentials providers</small>"]
    end

    subgraph Data["Data Layer"]
        PR["Prisma 5<br/><small>Type-safe ORM + transactions</small>"]
        DB[("Supabase PostgreSQL<br/><small>12 models, 8 migrations</small>")]
    end

    subgraph Security["Security"]
        BC["bcryptjs<br/><small>Password hashing</small>"]
        RL["Rate Limiter<br/><small>5 attempts / 15 min</small>"]
    end

    RC --> MW
    RC --> SA
    RHF --> SA
    ZS -.-> RC
    MW --> AUTH
    SA --> AG
    AG --> AUTH
    SA --> PR
    PR --> DB
    AUTH --> BC
    AUTH --> RL
`;

const erdCompetitionSetup = `erDiagram
    Competition ||--o{ Competitor : has
    Competition ||--o{ Table : has
    Competition ||--o{ CategoryRound : has
    Competition ||--o{ CompetitionJudge : has

    User ||--o{ CompetitionJudge : "registered in"
    User ||--o| Table : captains
    User ||--o{ TableAssignment : "assigned to"
    Table ||--o{ TableAssignment : seats

    Competition {
        string id PK
        string name
        datetime date
        string location
        string status "SETUP | ACTIVE | CLOSED"
        string judgePin
        boolean commentCardsEnabled
        enum distributionStatus "DRAFT | APPROVED"
    }

    User {
        string id PK
        string cbjNumber UK
        string name
        string email UK
        string role "JUDGE | CAPTAIN | ORGANIZER"
        string pin "bcrypt hashed"
    }

    Competitor {
        string id PK
        string competitionId FK
        string anonymousNumber UK "3-digit"
        string teamName
        boolean checkedIn
    }

    Table {
        string id PK
        string competitionId FK
        int tableNumber UK
        string captainId FK
    }

    TableAssignment {
        string id PK
        string tableId FK
        string userId FK
        int seatNumber "1-6 or null"
    }

    CompetitionJudge {
        string id PK
        string competitionId FK
        string userId FK
        boolean checkedIn
        boolean hasStartedJudging
    }

    CategoryRound {
        string id PK
        string competitionId FK
        string categoryName UK
        int order "1-4"
        string status "PENDING | ACTIVE | SUBMITTED"
    }
`;

const erdScoring = `erDiagram
    Submission ||--o{ ScoreCard : "scored by"
    Submission ||--o{ CommentCard : "commented on"
    ScoreCard ||--o{ CorrectionRequest : "may need"

    Competitor ||--o{ Submission : "submitted as"
    CategoryRound ||--o{ Submission : "scored in"
    Table ||--o{ Submission : receives

    Submission {
        string id PK
        string competitorId FK
        string categoryRoundId FK
        string tableId FK
        string enteredByJudgeId FK
        int boxNumber
        string boxCode
    }

    ScoreCard {
        string id PK
        string submissionId FK
        string judgeId FK
        int appearance "1-9"
        int taste "1-9"
        int texture "1-9"
        boolean locked
        datetime submittedAt
    }

    CorrectionRequest {
        string id PK
        string scoreCardId FK
        string judgeId FK
        string reason
        string status "PENDING | APPROVED | DENIED"
        string decidedBy FK
    }

    CommentCard {
        string id PK
        string submissionId FK
        string judgeId FK
        string categoryRoundId FK
        int appearanceScore
        int tasteScore
        int textureScore
        string tasteChecks
        string tendernessChecks
    }
`;

const erdAudit = `erDiagram
    Competition ||--o{ AuditLog : has
    User ||--o{ AuditLog : performs

    AuditLog {
        string id PK
        string competitionId FK
        string actorId FK
        string action
        string entityId
        string entityType
        datetime timestamp
    }
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const card = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg";
const sectionHeading = "text-2xl font-bold mb-2";
const sectionSub = "text-slate-600 dark:text-slate-400 mb-6";
const accentIcon = "text-red-600 dark:text-red-500";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className={`${card} overflow-hidden group`} open={defaultOpen || undefined}>
      <summary className="px-5 py-4 cursor-pointer flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 select-none">
        <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-90 shrink-0" />
        <span className="font-semibold">{title}</span>
        {subtitle && (
          <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto hidden sm:inline">{subtitle}</span>
        )}
      </summary>
      <div className="border-t border-slate-200 dark:border-slate-800">
        {children}
      </div>
    </details>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TechPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* ── 1. Header ─────────────────────────────────────────────────── */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-2">
            <Code2 className={`h-8 w-8 ${accentIcon}`} />
            <span className="text-sm font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Under the Hood
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            BBQ Judge — How It Was Built
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mb-4">
            A KCBS competition judging app built entirely with Claude Code over 10 days.
            One developer, one AI, zero boilerplate generators. This page is a complete
            teardown — architecture, costs, session-by-session build log, and lessons
            learned. Everything here is data-driven from the actual codebase.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Last updated: March 19, 2026
          </p>
        </div>
      </header>

      <MetaPageNav currentPath="/tech" />

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-20">

        {/* ── 2. By the Numbers ──────────────────────────────────────── */}
        <section>
          <h2 className={sectionHeading}>By the Numbers</h2>
          <p className={sectionSub}>
            Auto-audited from the codebase. Client/server split measured by &quot;use client&quot; directive.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={`${card} p-5 flex items-start gap-4`}
              >
                <div className={`p-2 rounded-md bg-red-50 dark:bg-red-950 ${accentIcon} shrink-0`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm font-medium">{stat.label}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{stat.sublabel}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. Cost Comparison ──────────────────────────────────────── */}
        <section>
          <h2 className={sectionHeading}>What Would This Cost to Build?</h2>
          <p className={sectionSub}>
            Estimates based on actual codebase scope: 16K+ LOC, 12 DB models, 62 server actions, role-based auth, complex business logic.
          </p>

          <CollapsibleSection title="Cost Comparison" subtitle="US shop vs offshore vs AI-assisted" defaultOpen>
            <div className="p-5 space-y-6">
              {/* Scope */}
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Package className={`h-4 w-4 ${accentIcon}`} />
                  Scope Included
                </h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                  {scopeBullets.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <ChevronRight className="h-3.5 w-3.5 mt-0.5 text-slate-400 shrink-0" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Comparison table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="text-left py-2 pr-4 font-semibold">Approach</th>
                      <th className="text-left py-2 pr-4 font-semibold">Rate</th>
                      <th className="text-left py-2 pr-4 font-semibold">Hours</th>
                      <th className="text-left py-2 font-semibold">Estimated Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costEstimates.map((est) => {
                      const isAI = est.rateLow === 0;
                      const costLow = isAI ? 20 : est.hoursLow * est.rateLow;
                      const costHigh = isAI ? 60 : est.hoursHigh * est.rateHigh;
                      return (
                        <tr key={est.label} className={`border-b border-slate-100 dark:border-slate-800/50 ${isAI ? "bg-emerald-50/50 dark:bg-emerald-950/20" : ""}`}>
                          <td className="py-3 pr-4 font-medium">{est.label}</td>
                          <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">{est.rateRange}</td>
                          <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">
                            {isAI ? "~50 human hrs" : `${est.hoursLow}–${est.hoursHigh}`}
                          </td>
                          <td className="py-3 font-semibold">
                            {isAI
                              ? `${formatCurrency(costLow)}–${formatCurrency(costHigh)} API cost`
                              : `${formatCurrency(costLow)}–${formatCurrency(costHigh)}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                Disclaimer: These are rough estimates for comparison purposes. Actual costs vary by team,
                timeline, requirements clarity, and project management overhead. The AI-assisted cost
                reflects API/subscription costs only — human time was spent on architecture decisions,
                code review, and prompt engineering (~50 hours across 10 days).
              </p>
            </div>
          </CollapsibleSection>
        </section>

        {/* ── 4. AI Development Workflow ──────────────────────────────── */}
        <section>
          <h2 className={sectionHeading}>AI Development Workflow</h2>
          <p className={sectionSub}>
            How this project was built using Claude Code as the primary development tool.
          </p>

          <div className="space-y-4">
            {aiWorkflowCards.map((item) => (
              <div key={item.title} className={`${card} p-6`}>
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <item.icon className={`h-4 w-4 ${accentIcon}`} />
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.detail}
                </p>
              </div>
            ))}

            <CollapsibleSection title="What I Delegate vs. Direct" subtitle="Human + AI responsibilities">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <h4 className="font-medium mb-3 text-slate-900 dark:text-slate-100">Delegated to Claude</h4>
                    <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
                      {delegationSplit.delegated.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <ArrowRight className="h-3 w-3 mt-1 text-emerald-500 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3 text-slate-900 dark:text-slate-100">Directed by me</h4>
                    <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
                      {delegationSplit.directed.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <ArrowRight className="h-3 w-3 mt-1 text-blue-500 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            <div className={`${card} p-6`}>
              <h3 className="font-bold text-sm mb-3">Development Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">10</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">PRs merged</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">10</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Development days</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">113</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Unit tests</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">2,000+</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">E2E assertions</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. Architecture Overview ────────────────────────────────── */}
        <section>
          <h2 className={sectionHeading}>Architecture Overview</h2>
          <p className={sectionSub}>
            How the system pieces fit together — from browser to database.
          </p>
          <div className={`${card} p-6 overflow-x-auto`}>
            <MermaidDiagram chart={architectureChart} className="[&_svg]:mx-auto [&_svg]:max-w-full" />
          </div>
        </section>

        {/* ── 6. Tech Stack ──────────────────────────────────────────── */}
        <section>
          <h2 className={sectionHeading}>Tech Stack</h2>
          <p className={sectionSub}>
            Grouped by layer. Versions are pinned — see constraints in CLAUDE.md.
          </p>
          <div className="space-y-4">
            {techStack.map((group) => (
              <CollapsibleSection
                key={group.category}
                title={group.category}
                subtitle={`${group.items.length} technologies`}
                defaultOpen
              >
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {group.items.map((item) => (
                    <div key={item.name} className="px-5 py-3 flex items-start gap-3">
                      <span className="font-medium text-sm shrink-0 min-w-[200px]">{item.name}</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">{item.detail}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            ))}
          </div>
        </section>

        {/* ── 7. Database Schema ──────────────────────────────────────── */}
        <section>
          <h2 className={sectionHeading}>Database Schema</h2>
          <p className={sectionSub}>
            12 models in PostgreSQL (via Prisma), grouped by domain. Click to expand.
          </p>
          <div className="space-y-4">
            <CollapsibleSection title="Competition Setup" subtitle="7 models — Competition, User, Competitor, Table, TableAssignment, CompetitionJudge, CategoryRound">
              <div className="px-5 pb-5 overflow-x-auto">
                <MermaidDiagram chart={erdCompetitionSetup} className="[&_svg]:mx-auto [&_svg]:max-w-full pt-4" />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Scoring & Corrections" subtitle="4 models — Submission, ScoreCard, CorrectionRequest, CommentCard">
              <div className="px-5 pb-5 overflow-x-auto">
                <MermaidDiagram chart={erdScoring} className="[&_svg]:mx-auto [&_svg]:max-w-full pt-4" />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Audit Trail" subtitle="1 model — AuditLog">
              <div className="px-5 pb-5 overflow-x-auto">
                <MermaidDiagram chart={erdAudit} className="[&_svg]:mx-auto [&_svg]:max-w-full pt-4" />
              </div>
            </CollapsibleSection>
          </div>
        </section>

        {/* ── 8. Feature Modules ──────────────────────────────────────── */}
        <section>
          <h2 className={sectionHeading}>Feature Modules</h2>
          <p className={sectionSub}>
            Each module in src/features/ has the same structure: actions/, components/,
            hooks/, store/, schemas/, types/, utils/, and an index.ts barrel export.
            Nothing leaks outside the barrel.
          </p>
          <div className="space-y-3">
            {featureModules.map((mod) => (
              <div key={mod.name} className={`${card} p-5`}>
                <div className="flex items-center gap-3 mb-1">
                  <code className="text-sm font-bold font-mono text-red-600 dark:text-red-400">{mod.name}/</code>
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto">
                    {mod.actions} actions &middot; {mod.components} components
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{mod.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 9. Build Journal ────────────────────────────────────────── */}
        <section>
          <h2 className={sectionHeading}>Build Journal</h2>
          <p className={sectionSub}>
            Session-by-session timeline, most recent first. Includes mistakes — this is what actually happened, not a highlight reel.
          </p>

          <CollapsibleSection title="Full Build Timeline" subtitle={`${buildJournal.length} sessions, Mar 6 – Mar 16`} defaultOpen>
            <div className="p-5">
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[19px] top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800" />

                <div className="space-y-6">
                  {buildJournal.map((entry, i) => (
                    <div key={i} className="relative pl-12">
                      {/* Timeline dot */}
                      <div className="absolute left-2.5 top-1.5 w-4 h-4 rounded-full bg-white dark:bg-slate-950 border-2 border-red-500 dark:border-red-600" />

                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3 flex-wrap">
                          <Clock className={`h-3.5 w-3.5 ${accentIcon} shrink-0`} />
                          <span className="font-bold text-sm">{entry.date}</span>
                          <span className="text-slate-400 dark:text-slate-500">—</span>
                          <span className="font-medium text-sm">{entry.title}</span>
                          {entry.prs.length > 0 && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto font-mono">
                              {entry.prs.join(", ")}
                            </span>
                          )}
                        </div>
                        <div className="px-4 py-3 space-y-2">
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {entry.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-mono">{entry.linesChanged}</span>
                          </div>
                          {entry.mistake && (
                            <div className="mt-2 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                                <span className="font-bold">Course correction:</span> {entry.mistake}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleSection>
        </section>

        {/* ── 10. Lessons Learned ──────────────────────────────────────── */}
        <section>
          <h2 className={sectionHeading}>Lessons Learned</h2>
          <p className={sectionSub}>
            What worked well and what was hard building a real application with AI.
          </p>

          <CollapsibleSection title={`${lessonsLearned.length} Insights`} subtitle="Expand to read all" defaultOpen>
            <div className="p-5 space-y-4">
              {lessonsLearned.map((lesson, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-5 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded ${
                      lesson.type === "worked"
                        ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
                        : "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400"
                    }`}>
                      {lesson.type === "worked" ? "Worked well" : "Hard"}
                    </span>
                    <h3 className="font-bold text-sm">{lesson.title}</h3>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {lesson.detail}
                  </p>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        </section>

        {/* ── Tools Used ───────────────────────────────────────────────── */}
        <section>
          <h2 className={sectionHeading}>Tools Used</h2>
          <p className={sectionSub}>
            Development tools and services used to build, test, and deploy.
          </p>
          <div className="space-y-4">
            {toolsUsed.map((group) => (
              <div key={group.category} className={`${card} overflow-hidden`}>
                <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <group.icon className={`h-4 w-4 ${accentIcon}`} />
                  <h3 className="font-semibold text-sm uppercase tracking-wide">{group.category}</h3>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {group.tools.map((tool) => (
                    <div key={tool.name} className="px-5 py-3 flex items-start gap-3">
                      <span className="font-medium text-sm shrink-0 min-w-[200px]">{tool.name}</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">{tool.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 11. Footer ───────────────────────────────────────────────── */}
        <footer className="border-t border-slate-200 dark:border-slate-800 pt-8 text-center space-y-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Built with Claude Code over 10 days — 19 commits, 10 PRs, 16,424 lines of TypeScript.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            ~50 human hours of architecture, review, and prompt engineering.
          </p>
        </footer>
      </main>
    </div>
  );
}
