import {
  ChevronRight,
  CheckCircle2,
  Target,
  Shield,
  TestTube2,
  BookOpen,
  Wrench,
  Code2,
  Flag,
  Layers,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { MetaPageNav } from "@shared/components/common/MetaPageNav";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Priority = "P1" | "P2" | "P3";
type ItemStatus = "done" | "in-progress" | "planned";
type Effort = "S" | "M" | "L" | "XL";
type RiskStatus = "mitigated" | "active" | "monitoring";
type PhaseKey = "short" | "medium" | "long";

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  effort: Effort;
  status: ItemStatus;
  tags: string[];
  priority: Priority;
  filePath?: string;
  foundDate?: string;
  fixedDate?: string;
  source?: string;
}

interface Risk {
  id: string;
  title: string;
  impact: "High" | "Medium" | "Low";
  likelihood: "High" | "Medium" | "Low";
  mitigation: string;
  status: RiskStatus;
}

interface HealthCategory {
  name: string;
  score: number;
  max: number;
  icon: LucideIcon;
}

interface SessionVelocity {
  session: string;
  date: string;
  itemsCompleted: number;
  prs: string[];
}

// ---------------------------------------------------------------------------
// Data: Health Scorecard
// ---------------------------------------------------------------------------

const healthCategories: HealthCategory[] = [
  { name: "Architecture", score: 9, max: 10, icon: Layers },
  { name: "Code Quality", score: 8, max: 10, icon: Code2 },
  { name: "Security", score: 8, max: 10, icon: Shield },
  { name: "Testing", score: 7, max: 10, icon: TestTube2 },
  { name: "Documentation", score: 9, max: 10, icon: BookOpen },
  { name: "Tooling", score: 7, max: 10, icon: Wrench },
];

const overallScore = Math.round(
  (healthCategories.reduce((sum, c) => sum + c.score, 0) /
    healthCategories.reduce((sum, c) => sum + c.max, 0)) *
    10 *
    10
) / 10;

// ---------------------------------------------------------------------------
// Data: Product Roadmap (3 phases)
// ---------------------------------------------------------------------------

const roadmapPhases: { key: PhaseKey; label: string; color: string; items: RoadmapItem[] }[] = [
  {
    key: "short",
    label: "Short Term (Next 2 Sprints)",
    color: "border-emerald-500",
    items: [
      {
        id: "ST-1",
        title: "Per-user PIN support",
        description: "Replace shared competition PIN with individual hashed PINs per judge. Currently all judges use the same PIN.",
        effort: "M",
        status: "planned",
        tags: ["auth", "security"],
        priority: "P1",
      },
      {
        id: "ST-2",
        title: "Redis-backed rate limiting",
        description: "Current in-memory rate limiter resets on deploy. Move to Redis for persistent rate limiting across restarts.",
        effort: "S",
        status: "planned",
        tags: ["security", "infra"],
        priority: "P2",
      },
      {
        id: "ST-3",
        title: "CSP headers",
        description: "Add Content Security Policy headers. Currently no CSP configured despite OWASP security headers in next.config.",
        effort: "S",
        status: "planned",
        tags: ["security"],
        priority: "P2",
      },
      {
        id: "ST-4",
        title: "JWT role re-validation",
        description: "Re-validate JWT role against database on sensitive operations. Currently stale role persists until token expires (24h).",
        effort: "S",
        status: "planned",
        tags: ["auth", "security"],
        priority: "P1",
      },
      {
        id: "ST-5",
        title: "E2E browser tests",
        description: "Add Playwright tests for critical user flows: login, judge scoring, captain submission, organizer category advancement.",
        effort: "L",
        status: "planned",
        tags: ["testing"],
        priority: "P2",
      },
    ],
  },
  {
    key: "medium",
    label: "Medium Term (1-2 Months)",
    color: "border-blue-500",
    items: [
      {
        id: "MT-1",
        title: "Real-time score updates",
        description: "Replace 15s polling with WebSocket or Server-Sent Events for live score updates on captain and results pages.",
        effort: "L",
        status: "planned",
        tags: ["feature", "dx"],
        priority: "P2",
      },
      {
        id: "MT-2",
        title: "Table Organizer role",
        description: "New TABLE_ORGANIZER role for logistics — receives boxes, distributes to tables per the distribution plan. No judging. Separate from captain.",
        effort: "L",
        status: "planned",
        tags: ["feature", "auth"],
        priority: "P3",
      },
      {
        id: "MT-3",
        title: "Competition templates",
        description: "Save and reuse competition configurations (table count, judge assignments, team slots) as templates for recurring events.",
        effort: "M",
        status: "planned",
        tags: ["feature", "ux"],
        priority: "P3",
      },
      {
        id: "MT-4",
        title: "PDF score reports",
        description: "Generate downloadable PDF reports with standings, per-category breakdowns, and individual judge scorecards.",
        effort: "M",
        status: "planned",
        tags: ["feature"],
        priority: "P2",
      },
      {
        id: "MT-5",
        title: "Offline judge mode",
        description: "Service worker + IndexedDB for judges to submit scores without internet. Sync when reconnected.",
        effort: "XL",
        status: "planned",
        tags: ["feature", "pwa"],
        priority: "P3",
      },
    ],
  },
  {
    key: "long",
    label: "Long Term (3-6 Months)",
    color: "border-purple-500",
    items: [
      {
        id: "LT-1",
        title: "Multi-competition management",
        description: "Dashboard for managing multiple concurrent competitions with shared judge pools and cross-event analytics.",
        effort: "XL",
        status: "planned",
        tags: ["feature", "scale"],
        priority: "P3",
      },
      {
        id: "LT-2",
        title: "KCBS API integration",
        description: "Direct integration with KCBS systems for judge certification lookup, result submission, and event registration.",
        effort: "XL",
        status: "planned",
        tags: ["integration"],
        priority: "P3",
      },
      {
        id: "LT-3",
        title: "Mobile native app",
        description: "React Native companion app for judges with push notifications, offline scoring, and camera-based box scanning.",
        effort: "XL",
        status: "planned",
        tags: ["mobile", "feature"],
        priority: "P3",
      },
      {
        id: "LT-4",
        title: "Analytics dashboard",
        description: "Historical scoring trends, judge consistency metrics, team performance across events, and statistical outlier detection.",
        effort: "L",
        status: "planned",
        tags: ["feature", "data"],
        priority: "P3",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Data: Session Velocity
// ---------------------------------------------------------------------------

const sessionVelocity: SessionVelocity[] = [
  { session: "Session 1", date: "Mar 6", itemsCompleted: 1, prs: [] },
  { session: "Session 2", date: "Mar 8", itemsCompleted: 12, prs: ["PR #1"] },
  { session: "Session 3", date: "Mar 9 AM", itemsCompleted: 5, prs: ["PR #2", "PR #3"] },
  { session: "Session 4", date: "Mar 9 mid", itemsCompleted: 3, prs: ["PR #4"] },
  { session: "Session 5", date: "Mar 9 PM", itemsCompleted: 6, prs: ["PR #5"] },
  { session: "Session 6", date: "Mar 10", itemsCompleted: 7, prs: ["PR #6"] },
  { session: "Session 7", date: "Mar 11", itemsCompleted: 8, prs: ["PR #7", "PR #8"] },
  { session: "Session 8", date: "Mar 13", itemsCompleted: 2, prs: ["PR #9"] },
  { session: "Session 9", date: "Mar 16", itemsCompleted: 3, prs: ["PR #10"] },
];

const maxVelocity = Math.max(...sessionVelocity.map((s) => s.itemsCompleted));

// ---------------------------------------------------------------------------
// Data: Next Session Planner
// ---------------------------------------------------------------------------

const nextSessionTasks = [
  { priority: "P1" as Priority, title: "Per-user PIN support", reason: "Security gap — shared PIN means any judge can impersonate another" },
  { priority: "P1" as Priority, title: "JWT role re-validation", reason: "Stale roles could allow unauthorized access for up to 24h" },
  { priority: "P2" as Priority, title: "CSP headers", reason: "Low effort, high security value — prevents XSS and data injection" },
  { priority: "P2" as Priority, title: "Redis rate limiting", reason: "Current in-memory limiter resets on every deploy" },
  { priority: "P2" as Priority, title: "E2E browser tests", reason: "Simulation script catches integration bugs but doesn't test real browser flows" },
];

// ---------------------------------------------------------------------------
// Data: Risk Register
// ---------------------------------------------------------------------------

const risks: Risk[] = [
  {
    id: "R-1",
    title: "In-memory rate limiter resets on deploy",
    impact: "Medium",
    likelihood: "High",
    mitigation: "Document limitation. Plan Redis migration for production. Currently acceptable for MVP.",
    status: "monitoring",
  },
  {
    id: "R-2",
    title: "Shared judge PIN allows impersonation",
    impact: "High",
    likelihood: "Medium",
    mitigation: "Per-user PIN support planned (ST-1). Seat selection provides weak identity verification.",
    status: "active",
  },
  {
    id: "R-3",
    title: "JWT role not re-validated against DB",
    impact: "Medium",
    likelihood: "Low",
    mitigation: "24h token expiry limits window. Critical actions should re-check DB role (ST-4).",
    status: "active",
  },
  {
    id: "R-4",
    title: "No CSP headers configured",
    impact: "Medium",
    likelihood: "Low",
    mitigation: "OWASP headers present. CSP planned (ST-3). No user-generated content reduces XSS risk.",
    status: "monitoring",
  },
  {
    id: "R-5",
    title: "Prisma v5 pinned — no security patches from v7",
    impact: "Medium",
    likelihood: "Low",
    mitigation: "Next.js 14 incompatible with Prisma v7 node: imports. Will migrate when Next.js 15 is adopted.",
    status: "monitoring",
  },
  {
    id: "R-6",
    title: "Single Supabase instance — no read replicas",
    impact: "Low",
    likelihood: "Low",
    mitigation: "Connection pooling enabled. Single competition doesn't need read replicas. Monitor query times.",
    status: "mitigated",
  },
];

// ---------------------------------------------------------------------------
// Data: Audit Recommendations
// ---------------------------------------------------------------------------

const auditRecommendations = [
  { priority: "P1" as Priority, title: "Add auth guard integration tests", description: "Verify every server action rejects unauthenticated and wrong-role requests. Current tests only cover pure utility functions.", tags: ["testing", "security"] },
  { priority: "P1" as Priority, title: "Input sanitization audit", description: "Verify all user-facing inputs are sanitized before database writes. Zod validates types but doesn't sanitize HTML/SQL.", tags: ["security"] },
  { priority: "P2" as Priority, title: "Add error boundary per feature module", description: "Current error.tsx is dashboard-level only. A crash in judging takes down the entire dashboard.", tags: ["ux", "resilience"] },
  { priority: "P2" as Priority, title: "Database index review", description: "Profile slow queries under load. ScoreCard and Submission tables may need composite indexes for captain dashboard queries.", tags: ["performance", "database"] },
  { priority: "P2" as Priority, title: "Accessibility re-audit", description: "WCAG pass was done in PR #6 but 20+ components were added since. Focus management and ARIA labels need re-verification.", tags: ["a11y"] },
  { priority: "P3" as Priority, title: "Bundle size analysis", description: "Run next/bundle-analyzer. Mermaid.js is large — consider lazy loading on /tech and /roadmap pages only.", tags: ["performance"] },
  { priority: "P3" as Priority, title: "Storybook for design system", description: "11 common components + 10 UI primitives with no visual testing. Storybook would catch visual regressions.", tags: ["tooling", "testing"] },
];

// ---------------------------------------------------------------------------
// Data: Findings History
// ---------------------------------------------------------------------------

const findingsHistory: RoadmapItem[] = [
  { id: "F-1", title: "Auth guards missing from server actions", description: "All 62 server actions had no auth guards — anyone could call any action.", priority: "P1", status: "done", effort: "M", tags: ["security"], filePath: "src/shared/lib/auth-guards.ts", foundDate: "Mar 9", fixedDate: "Mar 9", source: "Code review" },
  { id: "F-2", title: "Client-supplied user IDs in actions", description: "Server actions accepted userId as a parameter instead of deriving from session. IDOR vulnerability.", priority: "P1", status: "done", effort: "M", tags: ["security"], filePath: "src/features/*/actions/", foundDate: "Mar 9", fixedDate: "Mar 9", source: "Security audit" },
  { id: "F-3", title: "DB writes not wrapped in transactions", description: "Multi-step mutations (distribution approval, category submission) could leave partial state on error.", priority: "P1", status: "done", effort: "S", tags: ["data-integrity"], filePath: "src/features/*/actions/", foundDate: "Mar 9", fixedDate: "Mar 9", source: "Code review" },
  { id: "F-4", title: "DQ edge cases in tabulation", description: "E2E simulation found 3 bugs: DQ competitors not handled correctly in tiebreaking, dropped score calculation wrong with DQs.", priority: "P1", status: "done", effort: "M", tags: ["scoring", "correctness"], filePath: "src/features/tabulation/utils/", foundDate: "Mar 11", fixedDate: "Mar 11", source: "E2E simulation" },
  { id: "F-5", title: "No rate limiting on login", description: "Brute-force PIN guessing possible. 4-digit shared PIN especially vulnerable.", priority: "P1", status: "done", effort: "S", tags: ["security"], filePath: "src/shared/lib/rate-limit.ts", foundDate: "Mar 10", fixedDate: "Mar 10", source: "Security audit" },
  { id: "F-6", title: "Missing ARIA labels on interactive elements", description: "Buttons, dropdowns, and modals missing screen reader labels. Keyboard navigation broken on DataTable.", priority: "P2", status: "done", effort: "M", tags: ["a11y"], foundDate: "Mar 10", fixedDate: "Mar 10", source: "WCAG audit" },
  { id: "F-7", title: "Captain can't verify table ownership", description: "Captain actions didn't check if the captain actually owned the table they were modifying.", priority: "P1", status: "done", effort: "S", tags: ["security", "auth"], filePath: "src/features/scoring/actions/", foundDate: "Mar 9", fixedDate: "Mar 9", source: "Code review" },
  { id: "F-8", title: "Monolithic action file (1,200+ lines)", description: "competition/actions/index.ts had all 27 actions in one file. Hard to navigate and review.", priority: "P2", status: "done", effort: "M", tags: ["code-quality"], filePath: "src/features/competition/actions/", foundDate: "Mar 11", fixedDate: "Mar 11", source: "Refactor pass" },
  { id: "F-9", title: "shadcn v4 generates Tailwind v4 code", description: "Default shadcn CLI generates v4-incompatible code. Must use npx shadcn@1 or manually adjust.", priority: "P2", status: "done", effort: "S", tags: ["tooling"], foundDate: "Mar 6", fixedDate: "Mar 6", source: "Build failure" },
  { id: "F-10", title: "Prisma v7 incompatible with Next.js 14", description: "Prisma v7 uses node: protocol imports which Next.js 14 doesn't support. Must pin to v5.", priority: "P2", status: "done", effort: "S", tags: ["tooling", "constraint"], foundDate: "Mar 6", fixedDate: "Mar 6", source: "Build failure" },
];

const findingsCategoryBreakdown = [
  { category: "Security", count: findingsHistory.filter((f) => f.tags.includes("security")).length },
  { category: "Code Quality", count: findingsHistory.filter((f) => f.tags.includes("code-quality")).length },
  { category: "Correctness", count: findingsHistory.filter((f) => f.tags.includes("correctness") || f.tags.includes("scoring")).length },
  { category: "Accessibility", count: findingsHistory.filter((f) => f.tags.includes("a11y")).length },
  { category: "Tooling", count: findingsHistory.filter((f) => f.tags.includes("tooling")).length },
  { category: "Data Integrity", count: findingsHistory.filter((f) => f.tags.includes("data-integrity")).length },
];

const maxFindingsCount = Math.max(...findingsCategoryBreakdown.map((c) => c.count));

// ---------------------------------------------------------------------------
// Data: Tooling & Workflow
// ---------------------------------------------------------------------------

const workflowTools = [
  { name: "npm run dev", description: "Start dev server on port 3030" },
  { name: "npm run build", description: "Production build" },
  { name: "npm test", description: "Run 113 unit tests (Vitest)" },
  { name: "npm run lint", description: "ESLint check" },
  { name: "npm run db:migrate", description: "Run Prisma migrations" },
  { name: "npm run db:seed", description: "Seed development data" },
  { name: "npm run db:reset", description: "Reset DB + re-seed" },
  { name: "npx tsx scripts/simulate-competition.ts", description: "E2E simulation (2,000+ assertions)" },
];

const missingTools = [
  { name: "Playwright", description: "Browser-based E2E testing", status: "planned" },
  { name: "Storybook", description: "Visual component testing", status: "planned" },
  { name: "Bundle analyzer", description: "next/bundle-analyzer for size tracking", status: "planned" },
  { name: "Database profiler", description: "Query performance monitoring", status: "planned" },
];

// ---------------------------------------------------------------------------
// Data: Overall Progress
// ---------------------------------------------------------------------------

const allItems = [...findingsHistory, ...roadmapPhases.flatMap((p) => p.items)];
const completedCount = allItems.filter((i) => i.status === "done").length;
const inProgressCount = allItems.filter((i) => i.status === "in-progress").length;
const p1Open = allItems.filter((i) => i.priority === "P1" && i.status !== "done").length;
const p2Open = allItems.filter((i) => i.priority === "P2" && i.status !== "done").length;
const p3Open = allItems.filter((i) => i.priority === "P3" && i.status !== "done").length;

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

const card = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg";
const accentIcon = "text-red-600 dark:text-red-500";

function EffortBadge({ effort }: { effort: Effort }) {
  const colors: Record<Effort, string> = {
    S: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
    M: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
    L: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
    XL: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  };
  return (
    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${colors[effort]}`}>
      {effort}
    </span>
  );
}

function StatusBadge({ status }: { status: ItemStatus }) {
  const config: Record<ItemStatus, { label: string; className: string }> = {
    done: { label: "Done", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400" },
    "in-progress": { label: "In Progress", className: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400" },
    planned: { label: "Planned", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  };
  const c = config[status];
  return <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${c.className}`}>{c.label}</span>;
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const colors: Record<Priority, string> = {
    P1: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
    P2: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
    P3: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  };
  return <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${colors[priority]}`}>{priority}</span>;
}

function RiskStatusBadge({ status }: { status: RiskStatus }) {
  const config: Record<RiskStatus, { label: string; className: string }> = {
    mitigated: { label: "Mitigated", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400" },
    active: { label: "Active", className: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400" },
    monitoring: { label: "Monitoring", className: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400" },
  };
  const c = config[status];
  return <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${c.className}`}>{c.label}</span>;
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
      <div className="border-t border-slate-200 dark:border-slate-800">{children}</div>
    </details>
  );
}

function ItemCard({ item }: { item: RoadmapItem }) {
  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className="text-xs font-mono text-slate-400">{item.id}</span>
        <PriorityBadge priority={item.priority} />
        <EffortBadge effort={item.effort} />
        <StatusBadge status={item.status} />
      </div>
      <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.description}</p>
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {item.tags.map((tag) => (
          <span key={tag} className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
            {tag}
          </span>
        ))}
        {item.filePath && (
          <span className="text-xs font-mono text-slate-400 ml-auto">{item.filePath}</span>
        )}
      </div>
      {(item.foundDate || item.fixedDate || item.source) && (
        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
          {item.foundDate && <span>Found: {item.foundDate}</span>}
          {item.fixedDate && <span>Fixed: {item.fixedDate}</span>}
          {item.source && <span>Source: {item.source}</span>}
        </div>
      )}
    </div>
  );
}

// SVG Ring Chart component
function HealthRing({ score, max }: { score: number; max: number }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const percentage = score / max;
  const offset = circumference * (1 - percentage);
  const colorClass = score >= 8 ? "stroke-emerald-500" : score >= 6 ? "stroke-amber-500" : "stroke-red-500";

  return (
    <svg width="180" height="180" viewBox="0 0 180 180" className="shrink-0">
      {/* Background ring */}
      <circle
        cx="90" cy="90" r={radius}
        fill="none"
        strokeWidth="12"
        className="stroke-slate-200 dark:stroke-slate-700"
      />
      {/* Score ring */}
      <circle
        cx="90" cy="90" r={radius}
        fill="none"
        strokeWidth="12"
        strokeLinecap="round"
        className={colorClass}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 90 90)"
      />
      {/* Score text */}
      <text x="90" y="82" textAnchor="middle" className="fill-current text-3xl font-bold">{score}</text>
      <text x="90" y="105" textAnchor="middle" className="fill-slate-400 text-sm">/ {max}</text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-2">
            <Target className={`h-8 w-8 ${accentIcon}`} />
            <span className="text-sm font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Project Roadmap
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            BBQ Judge — Roadmap & Health
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mb-4">
            Project health, planned features, risk register, and audit findings.
            All data reflects the current state of the codebase.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Last updated: March 19, 2026
          </p>
        </div>
      </header>

      <MetaPageNav currentPath="/roadmap" />

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-16">

        {/* ── 1. Project Health Scorecard ─────────────────────────────── */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Project Health Scorecard</h2>
          <div className={`${card} p-6`}>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <HealthRing score={overallScore} max={10} />
              <div className="flex-1 w-full space-y-3">
                {healthCategories.map((cat) => {
                  const pct = (cat.score / cat.max) * 100;
                  const Icon = cat.icon;
                  return (
                    <div key={cat.name} className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${accentIcon} shrink-0`} />
                      <span className="text-sm font-medium w-28 shrink-0">{cat.name}</span>
                      <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            cat.score >= 8 ? "bg-emerald-500" : cat.score >= 6 ? "bg-amber-500" : "bg-red-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold w-10 text-right">{cat.score}/{cat.max}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. Product Roadmap ──────────────────────────────────────── */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Product Roadmap</h2>
          <div className="space-y-4">
            {roadmapPhases.map((phase) => (
              <CollapsibleSection
                key={phase.key}
                title={phase.label}
                subtitle={`${phase.items.length} items`}
                defaultOpen={phase.key === "short"}
              >
                <div className={`border-l-4 ${phase.color}`}>
                  <div className="p-5 space-y-3">
                    {phase.items.map((item) => (
                      <ItemCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              </CollapsibleSection>
            ))}
          </div>
        </section>

        {/* ── 3. Session Velocity ─────────────────────────────────────── */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Session Velocity</h2>
          <div className={`${card} p-6`}>
            <div className="space-y-3">
              {sessionVelocity.map((s) => (
                <div key={s.session} className="flex items-center gap-3">
                  <span className="text-xs font-medium w-24 shrink-0 text-slate-500 dark:text-slate-400">{s.date}</span>
                  <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden relative">
                    <div
                      className="h-full bg-red-500/80 dark:bg-red-600/80 rounded flex items-center px-2"
                      style={{ width: `${(s.itemsCompleted / maxVelocity) * 100}%` }}
                    >
                      <span className="text-xs font-bold text-white whitespace-nowrap">{s.itemsCompleted}</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 w-24 text-right shrink-0">
                    {s.prs.length > 0 ? s.prs.join(", ") : "scaffold"}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-4">Items = features, fixes, and infrastructure changes completed per session.</p>
          </div>
        </section>

        {/* ── 4. Next Session Planner ─────────────────────────────────── */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Next Session Planner</h2>
          <div className={`${card} p-6`}>
            <div className="flex items-center gap-2 mb-4">
              <Flag className={`h-4 w-4 ${accentIcon}`} />
              <h3 className="font-semibold text-sm">Priority-Ordered Tasks</h3>
            </div>
            <div className="space-y-3">
              {nextSessionTasks.map((task, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <span className="text-sm font-bold text-slate-400 w-6 shrink-0">{i + 1}.</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <PriorityBadge priority={task.priority} />
                      <span className="font-medium text-sm">{task.title}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{task.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. Risk Register ────────────────────────────────────────── */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Risk Register</h2>
          <CollapsibleSection
            title="Tracked Risks"
            subtitle={`${risks.filter((r) => r.status === "active").length} active, ${risks.filter((r) => r.status === "monitoring").length} monitoring`}
            defaultOpen
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <th className="text-left py-3 px-4 font-semibold">Risk</th>
                    <th className="text-left py-3 px-4 font-semibold">Impact</th>
                    <th className="text-left py-3 px-4 font-semibold">Likelihood</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold hidden md:table-cell">Mitigation</th>
                  </tr>
                </thead>
                <tbody>
                  {risks.map((risk) => (
                    <tr key={risk.id} className="border-b border-slate-100 dark:border-slate-800/50">
                      <td className="py-3 px-4">
                        <span className="text-xs font-mono text-slate-400 mr-2">{risk.id}</span>
                        <span className="font-medium">{risk.title}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-bold ${
                          risk.impact === "High" ? "text-red-600" : risk.impact === "Medium" ? "text-amber-600" : "text-slate-500"
                        }`}>{risk.impact}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-bold ${
                          risk.likelihood === "High" ? "text-red-600" : risk.likelihood === "Medium" ? "text-amber-600" : "text-slate-500"
                        }`}>{risk.likelihood}</span>
                      </td>
                      <td className="py-3 px-4"><RiskStatusBadge status={risk.status} /></td>
                      <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400 hidden md:table-cell max-w-xs">{risk.mitigation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>
        </section>

        {/* ── 6. Audit Recommendations ────────────────────────────────── */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Audit Recommendations</h2>
          <CollapsibleSection
            title="Prioritized Action Items"
            subtitle={`${auditRecommendations.length} items`}
            defaultOpen
          >
            <div className="p-5 space-y-3">
              {auditRecommendations.map((rec, i) => (
                <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-1">
                    <PriorityBadge priority={rec.priority} />
                    <span className="font-semibold text-sm">{rec.title}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{rec.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {rec.tags.map((tag) => (
                      <span key={tag} className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        </section>

        {/* ── 7. Findings History & Patterns ──────────────────────────── */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Findings History & Patterns</h2>

          <CollapsibleSection
            title="Pattern Analysis"
            subtitle={`${findingsHistory.length} historical findings`}
            defaultOpen
          >
            <div className="p-5 space-y-6">
              {/* Category breakdown bars */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Findings by Category</h4>
                <div className="space-y-2">
                  {findingsCategoryBreakdown.filter((c) => c.count > 0).map((cat) => (
                    <div key={cat.category} className="flex items-center gap-3">
                      <span className="text-sm w-28 shrink-0 text-slate-600 dark:text-slate-400">{cat.category}</span>
                      <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden">
                        <div
                          className="h-full bg-red-500/70 dark:bg-red-600/70 rounded flex items-center px-2"
                          style={{ width: `${(cat.count / maxFindingsCount) * 100}%` }}
                        >
                          <span className="text-xs font-bold text-white">{cat.count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key insights */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-lg">
                <h4 className="text-sm font-semibold mb-2 text-blue-800 dark:text-blue-300">Key Patterns</h4>
                <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-400">
                  <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 mt-1 shrink-0" /> Security was the dominant finding category — auth guards, ownership verification, and input validation were all bolted on after initial build.</li>
                  <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 mt-1 shrink-0" /> The E2E simulation script discovered correctness bugs that unit tests and code review both missed.</li>
                  <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 mt-1 shrink-0" /> Two tooling constraints (Prisma v7, shadcn v4) were discovered via build failures rather than documentation — documenting these in CLAUDE.md prevented recurrence.</li>
                </ul>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Timeline (Most Recent First)</h4>
                <div className="space-y-2">
                  {[...findingsHistory].reverse().map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <span className="text-xs font-mono text-slate-400 w-10 shrink-0">{item.id}</span>
                      <PriorityBadge priority={item.priority} />
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span className="text-sm font-medium flex-1">{item.title}</span>
                      <span className="text-xs text-slate-400 hidden sm:inline">{item.foundDate}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleSection>
        </section>

        {/* ── 8. Tooling & Workflow ───────────────────────────────────── */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Tooling & Workflow</h2>

          <CollapsibleSection title="Available Commands" subtitle={`${workflowTools.length} commands`}>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {workflowTools.map((tool) => (
                <div key={tool.name} className="px-5 py-3 flex items-start gap-3">
                  <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded shrink-0">{tool.name}</code>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{tool.description}</span>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          <div className="mt-4">
            <CollapsibleSection title="Missing / Planned Tools" subtitle={`${missingTools.length} planned`}>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {missingTools.map((tool) => (
                  <div key={tool.name} className="px-5 py-3 flex items-start gap-3">
                    <span className="font-medium text-sm shrink-0 w-40">{tool.name}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400 flex-1">{tool.description}</span>
                    <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">{tool.status}</span>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          </div>
        </section>

        {/* ── 9. Overall Progress ─────────────────────────────────────── */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Overall Progress</h2>
          <div className={`${card} p-6`}>
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm">Completed ({completedCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm">In Progress ({inProgressCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm">P1 Open ({p1Open})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm">P2 Open ({p2Open})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-slate-400" />
                <span className="text-sm">P3 Open ({p3Open})</span>
              </div>
            </div>
            <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div className="bg-emerald-500 h-full" style={{ width: `${(completedCount / allItems.length) * 100}%` }} />
              <div className="bg-blue-500 h-full" style={{ width: `${(inProgressCount / allItems.length) * 100}%` }} />
              <div className="bg-red-500 h-full" style={{ width: `${(p1Open / allItems.length) * 100}%` }} />
              <div className="bg-amber-500 h-full" style={{ width: `${(p2Open / allItems.length) * 100}%` }} />
              <div className="bg-slate-400 h-full" style={{ width: `${(p3Open / allItems.length) * 100}%` }} />
            </div>
            <p className="text-xs text-slate-400 mt-3">
              {allItems.length} total items tracked &middot; {completedCount} completed &middot; {allItems.length - completedCount} remaining
            </p>
          </div>
        </section>

        {/* ── 10. Priority Sections ───────────────────────────────────── */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Items by Priority</h2>
          <div className="space-y-4">
            {(["P1", "P2", "P3"] as Priority[]).map((priority) => {
              const items = allItems.filter((i) => i.priority === priority);
              const open = items.filter((i) => i.status !== "done");
              const done = items.filter((i) => i.status === "done");

              return (
                <CollapsibleSection
                  key={priority}
                  title={`${priority} Items`}
                  subtitle={`${open.length} open, ${done.length} done`}
                  defaultOpen={priority === "P1"}
                >
                  <div className="p-5 space-y-4">
                    {/* Open items */}
                    {open.length > 0 && (
                      <div className="space-y-3">
                        {open.map((item) => (
                          <ItemCard key={item.id} item={item} />
                        ))}
                      </div>
                    )}
                    {open.length === 0 && (
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> All {priority} items resolved
                      </p>
                    )}

                    {/* Completed items in green collapsible */}
                    {done.length > 0 && (
                      <details className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-lg overflow-hidden group/done">
                        <summary className="px-4 py-3 cursor-pointer flex items-center gap-2 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20 select-none">
                          <ChevronRight className="h-3.5 w-3.5 text-emerald-500 transition-transform group-open/done:rotate-90 shrink-0" />
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                            {done.length} completed
                          </span>
                        </summary>
                        <div className="border-t border-emerald-200 dark:border-emerald-900/50 p-4 space-y-3">
                          {done.map((item) => (
                            <ItemCard key={item.id} item={item} />
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </CollapsibleSection>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 pt-8 text-center space-y-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {allItems.length} items tracked &middot; {completedCount} completed &middot; {risks.filter((r) => r.status === "active").length} active risks
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Built with Claude Code
          </p>
        </footer>
      </main>
    </div>
  );
}
