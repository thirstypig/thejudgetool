import {
  BarChart3,
  TrendingUp,
  Eye,
  UserCheck,
  MousePointerClick,
  Gauge,
  Zap,
  Clock,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { MetaPageNav } from "@shared/components/common/MetaPageNav";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MetricStatus = "tracking" | "planned";

interface VelocityEntry {
  session: string;
  date: string;
  itemsCompleted: number;
  prs: string[];
  focus: string;
}

interface ProductMetric {
  name: string;
  description: string;
  status: MetricStatus;
  icon: LucideIcon;
  detail: string;
}

interface ProductQuestion {
  question: string;
  answer: string;
  dataSource: string;
  priority: "high" | "medium" | "low";
}

// ---------------------------------------------------------------------------
// Data: Development Velocity (from git history)
// ---------------------------------------------------------------------------

const velocityData: VelocityEntry[] = [
  { session: "Session 1", date: "Mar 6", itemsCompleted: 1, prs: [], focus: "Scaffolding" },
  { session: "Session 2", date: "Mar 8", itemsCompleted: 12, prs: ["PR #1"], focus: "Full app build" },
  { session: "Session 3", date: "Mar 9 AM", itemsCompleted: 5, prs: ["PR #2", "PR #3"], focus: "Judge flow + security" },
  { session: "Session 4", date: "Mar 9 mid", itemsCompleted: 3, prs: ["PR #4"], focus: "Box distribution" },
  { session: "Session 5", date: "Mar 9 PM", itemsCompleted: 6, prs: ["PR #5"], focus: "Organizer UX" },
  { session: "Session 6", date: "Mar 10", itemsCompleted: 7, prs: ["PR #6"], focus: "A11y + security + tests" },
  { session: "Session 7", date: "Mar 11", itemsCompleted: 8, prs: ["PR #7", "PR #8"], focus: "Docs + E2E + refactor" },
  { session: "Session 8", date: "Mar 13", itemsCompleted: 2, prs: ["PR #9"], focus: "Tech page v1" },
  { session: "Session 9", date: "Mar 16", itemsCompleted: 3, prs: ["PR #10"], focus: "Tech page overhaul" },
];

const maxVelocity = Math.max(...velocityData.map((s) => s.itemsCompleted));
const totalItems = velocityData.reduce((sum, s) => sum + s.itemsCompleted, 0);
const avgItems = Math.round((totalItems / velocityData.length) * 10) / 10;
const peakSession = velocityData.reduce((peak, s) => (s.itemsCompleted > peak.itemsCompleted ? s : peak));

// Growth: compare last 3 sessions avg to first 3 sessions avg
const first3Avg = velocityData.slice(0, 3).reduce((s, v) => s + v.itemsCompleted, 0) / 3;
const last3Avg = velocityData.slice(-3).reduce((s, v) => s + v.itemsCompleted, 0) / 3;
const growthPct = first3Avg > 0 ? Math.round(((last3Avg - first3Avg) / first3Avg) * 100) : 0;

// ---------------------------------------------------------------------------
// Data: Product Metrics
// ---------------------------------------------------------------------------

const productMetrics: ProductMetric[] = [
  {
    name: "Page Views",
    description: "Track which pages judges, captains, and organizers visit most frequently.",
    status: "planned",
    icon: Eye,
    detail: "Priority pages: /judge (scoring flow), /captain (review flow), /organizer/competition (category advancement)",
  },
  {
    name: "User Identity",
    description: "Associate analytics events with roles (judge, captain, organizer) without PII.",
    status: "planned",
    icon: UserCheck,
    detail: "Use role + anonymized session ID. Never log CBJ numbers or names to analytics.",
  },
  {
    name: "Feature Adoption",
    description: "Measure which features are actually used during live competitions.",
    status: "planned",
    icon: Zap,
    detail: "Key features: comment cards (toggle rate), correction requests (frequency), score audit (organizer usage)",
  },
  {
    name: "Engagement Depth",
    description: "Track session duration and actions per session by role.",
    status: "planned",
    icon: Clock,
    detail: "Judges should have short, focused sessions. Organizers need sustained attention. Captain sessions are event-driven.",
  },
  {
    name: "Performance Metrics",
    description: "Core Web Vitals (LCP, FID, CLS) and API response times.",
    status: "tracking",
    icon: Gauge,
    detail: "Health endpoint measures DB latency (target <500ms). Vercel Analytics provides CWV. Server actions need timing instrumentation.",
  },
  {
    name: "Click Tracking",
    description: "Track key interaction patterns: score picker usage, navigation flows, error states.",
    status: "planned",
    icon: MousePointerClick,
    detail: "Priority: score picker (which scores are most common), correction request flow (abandon rate), category advancement (time between)",
  },
];

// ---------------------------------------------------------------------------
// Data: Key Questions
// ---------------------------------------------------------------------------

const keyQuestions: ProductQuestion[] = [
  {
    question: "How long does it take a judge to complete one box?",
    answer: "Measure time from ScoreCard creation (appearance phase) to final submission. Target: 2-4 minutes per box. Break down by: appearance-only phase vs taste/texture phase.",
    dataSource: "ScoreCard.appearanceSubmittedAt → ScoreCard.submittedAt timestamps",
    priority: "high",
  },
  {
    question: "What percentage of scores require correction?",
    answer: "Count CorrectionRequests / total ScoreCards per competition. Healthy rate is <5%. Higher suggests UI confusion or unclear scoring criteria. Track by category (Brisket historically hardest).",
    dataSource: "CorrectionRequest count vs ScoreCard count, grouped by CategoryRound",
    priority: "high",
  },
  {
    question: "Are comment cards useful or friction?",
    answer: "Compare competition outcomes with commentCardsEnabled on vs off. Measure: judge session duration, comment card completion rate, organizer toggle frequency. If >30% judges skip optional fields, simplify the form.",
    dataSource: "CommentCard completeness rate, Competition.commentCardsEnabled toggle history",
    priority: "medium",
  },
  {
    question: "How many judges struggle with the setup flow?",
    answer: "Track progression through the 4 setup phases (not-registered → awaiting-table → pick-seat → ready). Measure: time in each phase, drop-off between phases, support requests. Target: <3 minutes from login to ready.",
    dataSource: "Phase transition timestamps (localStorage events + CompetitionJudge.hasStartedJudging)",
    priority: "high",
  },
  {
    question: "Is the organizer dashboard efficient?",
    answer: "Measure clicks-to-complete for key organizer tasks: advancing a category, reviewing box distribution, checking results. Compare time-on-page between the old single-page layout and the new tabbed structure.",
    dataSource: "Page view sequences, time-on-page for /organizer/* routes, category advancement timestamps",
    priority: "medium",
  },
  {
    question: "What's the peak concurrent user count?",
    answer: "During active judging, all 24 judges + 4 captains + 1 organizer are concurrent (29 users). Monitor: API response times under load, DB connection pool usage, any 500 errors during scoring rounds.",
    dataSource: "Health endpoint polling, Vercel function logs, Supabase connection metrics",
    priority: "low",
  },
];

const priorityColors: Record<string, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const card = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg";
const accentIcon = "text-red-600 dark:text-red-500";

function StatusBadge({ status }: { status: MetricStatus }) {
  const config: Record<MetricStatus, { label: string; className: string }> = {
    tracking: { label: "Tracking", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400" },
    planned: { label: "Planned", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className={`h-8 w-8 ${accentIcon}`} />
            <span className="text-sm font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Analytics
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            BBQ Judge — Product Analytics
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mb-4">
            Development velocity, product metrics, and key questions to answer.
            Metrics are derived from the codebase and development history.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Last updated: March 19, 2026
          </p>
        </div>
      </header>

      <MetaPageNav currentPath="/analytics" />

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-16">

        {/* ── 1. Development Velocity Chart ────────────────────────────── */}
        <section>
          <h2 className="text-2xl font-bold mb-2">Development Velocity</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Items completed per session, derived from git history and PR merge data.
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className={`${card} p-4 text-center`}>
              <div className="text-2xl font-bold">{totalItems}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Total Items</div>
            </div>
            <div className={`${card} p-4 text-center`}>
              <div className="text-2xl font-bold">{avgItems}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Avg / Session</div>
            </div>
            <div className={`${card} p-4 text-center`}>
              <div className="text-2xl font-bold">{peakSession.itemsCompleted}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Peak ({peakSession.date})</div>
            </div>
            <div className={`${card} p-4 text-center`}>
              <div className={`text-2xl font-bold ${growthPct >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {growthPct >= 0 ? "+" : ""}{growthPct}%
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Growth (last 3 vs first 3)</div>
            </div>
          </div>

          {/* Bar chart */}
          <div className={`${card} p-6`}>
            <div className="space-y-3">
              {velocityData.map((s) => (
                <div key={s.session} className="flex items-center gap-3">
                  <div className="w-20 shrink-0">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{s.date}</span>
                  </div>
                  <div className="flex-1 h-7 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden relative">
                    <div
                      className="h-full bg-red-500/80 dark:bg-red-600/80 rounded flex items-center px-2.5 transition-all"
                      style={{ width: `${Math.max((s.itemsCompleted / maxVelocity) * 100, 8)}%` }}
                    >
                      <span className="text-xs font-bold text-white whitespace-nowrap">{s.itemsCompleted}</span>
                    </div>
                  </div>
                  <div className="w-40 shrink-0 hidden md:block">
                    <span className="text-xs text-slate-400">{s.focus}</span>
                  </div>
                  <div className="w-20 shrink-0 text-right hidden sm:block">
                    <span className="text-xs font-mono text-slate-400">
                      {s.prs.length > 0 ? s.prs.join(", ") : "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Average line annotation */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-400">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Average: {avgItems} items/session &middot; Peak: {peakSession.itemsCompleted} items ({peakSession.session}) &middot; {velocityData.length} sessions total</span>
            </div>
          </div>
        </section>

        {/* ── 2. Product Metrics Grid ──────────────────────────────────── */}
        <section>
          <h2 className="text-2xl font-bold mb-2">Product Metrics</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            What we track and what we plan to track. {productMetrics.filter((m) => m.status === "tracking").length} active,{" "}
            {productMetrics.filter((m) => m.status === "planned").length} planned.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {productMetrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.name} className={`${card} p-5`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-md bg-red-50 dark:bg-red-950 ${accentIcon} shrink-0`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{metric.name}</h3>
                        <StatusBadge status={metric.status} />
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{metric.description}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{metric.detail}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 3. Key Questions ─────────────────────────────────────────── */}
        <section>
          <h2 className="text-2xl font-bold mb-2">Key Questions</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Product questions we need to answer, how to measure them, and where the data lives.
          </p>

          <CollapsibleSection
            title="Product Questions"
            subtitle={`${keyQuestions.length} questions`}
            defaultOpen
          >
            <div className="p-5 space-y-4">
              {keyQuestions.map((q, i) => (
                <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-start gap-3">
                    <HelpCircle className={`h-5 w-5 ${accentIcon} shrink-0 mt-0.5`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="font-semibold text-sm">{q.question}</h4>
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${priorityColors[q.priority]}`}>
                          {q.priority}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-2">{q.answer}</p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Activity className="h-3 w-3 shrink-0" />
                        <span className="font-medium">Data source:</span>
                        <span>{q.dataSource}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        </section>

        {/* ── 4. Analytics Platform CTA ────────────────────────────────── */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Analytics Platform</h2>
          <div className={`${card} p-6`}>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className={`p-3 rounded-lg bg-red-50 dark:bg-red-950 ${accentIcon} shrink-0`}>
                <BarChart3 className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">PostHog — Recommended Platform</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                  Open-source product analytics with event tracking, session replay, feature flags,
                  and A/B testing. Self-hostable or cloud. Free tier covers 1M events/month — more
                  than enough for competition-day usage (29 concurrent users, ~500 events/competition).
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded font-medium">
                    Recommended
                  </span>
                  <span className="text-xs text-slate-400">Next.js SDK available &middot; Privacy-friendly &middot; Self-hostable</span>
                </div>
              </div>
              <a
                href="https://posthog.com"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                Learn More
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Alternatives */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Alternatives Considered</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { name: "Mixpanel", note: "Best funnel analysis, generous free tier" },
                  { name: "Vercel Analytics", note: "Already available — CWV only, no custom events" },
                  { name: "Plausible", note: "Privacy-first, lightweight, no custom events" },
                ].map((alt) => (
                  <div key={alt.name} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <span className="text-sm font-medium">{alt.name}</span>
                    <p className="text-xs text-slate-400 mt-0.5">{alt.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 pt-8 text-center space-y-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {productMetrics.filter((m) => m.status === "tracking").length} metrics active &middot;{" "}
            {productMetrics.filter((m) => m.status === "planned").length} planned &middot;{" "}
            {keyQuestions.length} key questions
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Built with Claude Code
          </p>
        </footer>
      </main>
    </div>
  );
}
