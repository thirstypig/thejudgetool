import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/shared/components/common/ThemeToggle";
import {
  Flame,
  ClipboardCheck,
  Trophy,
  Shield,
  Clock,
  Users,
  BarChart3,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Zap,
  FileSpreadsheet,
  PenLine,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-red-600 sm:h-7 sm:w-7" />
            <span className="text-lg font-bold tracking-tight sm:text-xl">
              The Judge Tool
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href="#features"
              className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 md:inline"
            >
              Features
            </a>
            <a
              href="#compare"
              className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 md:inline"
            >
              Why Digital
            </a>
            <a
              href="#roles"
              className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 md:inline"
            >
              How It Works
            </a>
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 sm:px-5 sm:py-2.5"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white pb-16 pt-16 dark:from-slate-900 dark:to-slate-950 sm:pb-20 sm:pt-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(192,57,43,0.08),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(192,57,43,0.15),transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4 text-center sm:px-6">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400 sm:mb-6 sm:px-4 sm:py-1.5 sm:text-sm">
            <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            KCBS-Compliant Digital Judging
          </div>
          <h1 className="mx-auto max-w-4xl text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Stop losing score cards.
            <br />
            <span className="text-red-600 dark:text-red-500">Start winning competitions.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400 sm:mt-6 sm:text-xl">
            The Judge Tool replaces pen, paper, and spreadsheets with a
            purpose-built digital platform for KCBS BBQ competition judging.
            Real-time scoring, instant tabulation, zero math errors.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row sm:justify-center sm:gap-4">
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 hover:shadow-xl sm:w-auto"
            >
              Get Started
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#features"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:w-auto"
            >
              See Features
            </a>
          </div>
        </div>

        {/* Hero screenshot */}
        <div className="relative mx-auto mt-12 max-w-5xl px-4 sm:mt-16 sm:px-6">
          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-2xl shadow-slate-900/10 dark:border-slate-700 dark:shadow-black/30">
            <Image
              src="/images/screenshots/organizer-competitions.png"
              alt="The Judge Tool - Organizer Dashboard showing competition management"
              width={1440}
              height={900}
              className="w-full"
              priority
            />
          </div>
        </div>
      </section>

      {/* Pain Points - Why change? */}
      <section className="border-y border-slate-200 bg-slate-50 py-16 dark:border-slate-800 dark:bg-slate-900 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              The old way is costing you
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600 dark:text-slate-400 sm:mt-4 sm:text-lg">
              Every BBQ competition organizer knows these pain points.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
            {[
              {
                icon: PenLine,
                title: "Illegible Handwriting",
                desc: "Misread scores lead to wrong rankings. A 7 that looks like a 1 can cost a team their trophy.",
              },
              {
                icon: FileSpreadsheet,
                title: "Spreadsheet Chaos",
                desc: "Manual data entry into Excel after each round. One transposition error and your results are wrong.",
              },
              {
                icon: Clock,
                title: "Hours of Tabulation",
                desc: "Weighted averages, dropped lowest scores, tiebreakers. All calculated by hand under pressure.",
              },
              {
                icon: XCircle,
                title: "Lost Score Cards",
                desc: "Paper cards get dropped, stained, or blown away. No backup means re-judging or disqualification.",
              },
              {
                icon: Users,
                title: "No Real-Time Visibility",
                desc: "Organizers can't see progress until cards are physically collected. Delays cascade through the day.",
              },
              {
                icon: Shield,
                title: "Score Integrity Risks",
                desc: "No audit trail. Corrections are crossed out and initialed. Disputes have no definitive record.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6"
              >
                <div className="mb-3 inline-flex rounded-lg bg-red-50 p-2 dark:bg-red-950 sm:mb-4 sm:p-2.5">
                  <item.icon className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-base font-semibold sm:text-lg">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:mt-2">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Side-by-side comparison */}
      <section id="compare" className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Paper & Excel vs. The Judge Tool
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600 dark:text-slate-400 sm:mt-4 sm:text-lg">
              See what changes when you go digital.
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-4xl sm:mt-14">
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-slate-700 sm:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                    <th className="px-6 py-4 text-sm font-semibold">
                      Task
                    </th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Pen & Paper / Excel
                    </th>
                    <th className="px-6 py-4 text-sm font-semibold text-red-600 dark:text-red-400">
                      The Judge Tool
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[
                    ["Score entry", "Hand-write on paper cards", "Tap a number on your phone"],
                    ["Score collection", "Walk cards to head table", "Submitted instantly over WiFi"],
                    ["Data entry", "Type into Excel one by one", "Automatic — zero data entry"],
                    ["Weighted calculation", "Manual formula per judge", "Instant, KCBS-correct math"],
                    ["Drop lowest score", "Find & remove by hand", "Automatic across all teams"],
                    ["Tiebreakers", "Re-check taste, then texture...", "Resolved automatically per KCBS rules"],
                    ["Score corrections", "Cross out, initial, hope it's legible", "Digital request → captain approval → audit trail"],
                    ["Results announcement", "30-60 min after last turn-in", "Ready the moment scoring completes"],
                    ["Audit trail", "A box of paper cards", "Complete digital log of every action"],
                  ].map(([task, old, digital], i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-3.5 text-sm font-medium">
                        {task}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-slate-500 dark:text-slate-400">
                        {old}
                      </td>
                      <td className="px-6 py-3.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                        {digital}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="space-y-3 sm:hidden">
              {[
                ["Score entry", "Hand-write on paper cards", "Tap a number on your phone"],
                ["Score collection", "Walk cards to head table", "Submitted instantly over WiFi"],
                ["Data entry", "Type into Excel one by one", "Automatic — zero data entry"],
                ["Weighted calculation", "Manual formula per judge", "Instant, KCBS-correct math"],
                ["Drop lowest score", "Find & remove by hand", "Automatic across all teams"],
                ["Tiebreakers", "Re-check taste, then texture...", "Resolved automatically per KCBS rules"],
                ["Score corrections", "Cross out, initial, hope it's legible", "Digital request → captain approval → audit trail"],
                ["Results announcement", "30-60 min after last turn-in", "Ready the moment scoring completes"],
                ["Audit trail", "A box of paper cards", "Complete digital log of every action"],
              ].map(([task, old, digital], i) => (
                <div key={i} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                  <div className="text-sm font-semibold">{task}</div>
                  <div className="mt-2 flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                    <span>{old}</span>
                  </div>
                  <div className="mt-1.5 flex items-start gap-2 text-sm font-medium text-red-600 dark:text-red-400">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{digital}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features with screenshots */}
      <section id="features" className="border-t border-slate-200 bg-slate-50 py-16 dark:border-slate-800 dark:bg-slate-900 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Built for every role at the table
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600 dark:text-slate-400 sm:mt-4 sm:text-lg">
              Purpose-built views for organizers, judges, and table captains.
            </p>
          </div>

          {/* Organizer */}
          <div className="mt-12 grid items-center gap-8 sm:mt-16 sm:gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-700 dark:bg-red-950 dark:text-red-400 sm:mb-4">
                <Trophy className="h-3.5 w-3.5" />
                Organizer
              </div>
              <h3 className="text-xl font-bold sm:text-2xl">
                Run your competition from one screen
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:mt-3 sm:text-base">
                Create competitions, register teams and judges, manage table
                assignments, and advance through categories. Track live progress
                across all tables and see results the instant scoring completes.
              </p>
              <ul className="mt-4 space-y-2 sm:mt-6 sm:space-y-3">
                {[
                  "One-click category advancement (Chicken → Ribs → Pork → Brisket)",
                  "Live progress bars per table — see who's still scoring",
                  "Automatic KCBS-compliant tabulation with tiebreakers",
                  "Full audit log of every score and correction",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-xl dark:border-slate-700">
              <Image
                src="/images/screenshots/organizer-competition-control.png"
                alt="Organizer competition control with category advancement stepper"
                width={1440}
                height={900}
                className="w-full"
              />
            </div>
          </div>

          {/* Judge */}
          <div className="mt-16 grid items-center gap-8 sm:mt-24 sm:gap-12 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <div className="overflow-hidden rounded-xl border border-slate-200 shadow-xl dark:border-slate-700">
                <Image
                  src="/images/screenshots/judge-scoring.png"
                  alt="Judge scoring interface with KCBS score picker"
                  width={1440}
                  height={900}
                  className="w-full"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-950 dark:text-blue-400 sm:mb-4">
                <ClipboardCheck className="h-3.5 w-3.5" />
                Judge
              </div>
              <h3 className="text-xl font-bold sm:text-2xl">
                Score from your phone in seconds
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:mt-3 sm:text-base">
                No more fumbling with paper cards. Tap your scores for
                Appearance, Taste, and Texture on a clean, mobile-friendly
                interface. Scores are locked on submit — no ambiguity.
              </p>
              <ul className="mt-4 space-y-2 sm:mt-6 sm:space-y-3">
                {[
                  "KCBS-valid scores only (1, 2, 5, 6, 7, 8, 9) — impossible to enter invalid numbers",
                  "Anonymous team numbers — never see team names (BR-4 compliant)",
                  "Adjustable font size for outdoor readability",
                  "Request corrections through the app — no chasing down the captain",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Captain */}
          <div className="mt-16 grid items-center gap-8 sm:mt-24 sm:gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-950 dark:text-amber-400 sm:mb-4">
                <Users className="h-3.5 w-3.5" />
                Table Captain
              </div>
              <h3 className="text-xl font-bold sm:text-2xl">
                Oversee your table with full visibility
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:mt-3 sm:text-base">
                See every judge&apos;s progress at a glance. Review all score
                cards, approve or deny correction requests, and submit the
                round when your table is ready. No more counting paper cards.
              </p>
              <ul className="mt-4 space-y-2 sm:mt-6 sm:space-y-3">
                {[
                  "Real-time judge progress bars — see who's done and who's behind",
                  "Score card review with color-coded KCBS ratings",
                  "Correction request workflow with reason and approve/deny",
                  "Comment card review before category submission",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-xl dark:border-slate-700">
              <Image
                src="/images/screenshots/captain-viewport.png"
                alt="Table Captain dashboard showing judge progress and correction requests"
                width={1440}
                height={900}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Results & Audit */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-8 sm:gap-12 lg:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-xl dark:border-slate-700">
              <Image
                src="/images/screenshots/organizer-results.png"
                alt="Results & Tabulation dashboard with live progress tracking"
                width={1440}
                height={900}
                className="w-full"
              />
            </div>
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-700 dark:bg-green-950 dark:text-green-400 sm:mb-4">
                <BarChart3 className="h-3.5 w-3.5" />
                Results
              </div>
              <h3 className="text-xl font-bold sm:text-2xl">
                Instant, accurate results
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:mt-3 sm:text-base">
                No more waiting 30-60 minutes while someone punches numbers into
                a spreadsheet. Results are calculated in real time as scores come
                in — with full KCBS-compliant weighted averaging, lowest-score
                drops, and multi-level tiebreaking.
              </p>
              <ul className="mt-4 space-y-2 sm:mt-6 sm:space-y-3">
                {[
                  "Live progress tracking across all tables and categories",
                  "Score audit view with per-judge formula breakdown",
                  "Export results as CSV or JSON",
                  "Complete audit log for dispute resolution",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="roles" className="border-t border-slate-200 bg-slate-50 py-16 dark:border-slate-800 dark:bg-slate-900 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Competition day, simplified
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600 dark:text-slate-400 sm:mt-4 sm:text-lg">
              From setup to trophy ceremony in four steps.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
            {[
              {
                step: "1",
                title: "Setup",
                desc: "Create your competition, register teams and judges, assign tables. All online before the event.",
              },
              {
                step: "2",
                title: "Judge",
                desc: "Judges log in with their CBJ number, pick a seat, and score directly on their phones.",
              },
              {
                step: "3",
                title: "Review",
                desc: "Table captains review scores, handle corrections, and submit each round to the organizer.",
              },
              {
                step: "4",
                title: "Results",
                desc: "Tabulation happens instantly. Announce winners minutes after the last turn-in — not hours.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white sm:mb-4 sm:h-10 sm:w-10">
                  {item.step}
                </div>
                <h3 className="text-base font-semibold sm:text-lg">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:mt-2">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key numbers */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
            {[
              { value: "0", label: "Math errors", icon: Zap },
              { value: "< 1 min", label: "To tabulate results", icon: Clock },
              { value: "100%", label: "KCBS rule compliance", icon: Shield },
              { value: "24/7", label: "Digital audit trail", icon: BarChart3 },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto mb-2 inline-flex rounded-lg bg-red-50 p-2.5 dark:bg-red-950 sm:mb-3 sm:p-3">
                  <stat.icon className="h-5 w-5 text-red-600 dark:text-red-400 sm:h-6 sm:w-6" />
                </div>
                <div className="text-2xl font-extrabold sm:text-3xl">
                  {stat.value}
                </div>
                <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-400 sm:mt-1 sm:text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-200 bg-gradient-to-b from-slate-900 to-slate-950 py-16 dark:border-slate-800 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Flame className="mx-auto mb-5 h-8 w-8 text-red-500 sm:mb-6 sm:h-10 sm:w-10" />
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
            Ready to modernize your competition?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-slate-400 sm:mt-4 sm:text-lg">
            Join the BBQ competitions that have moved past pen, paper, and
            prayer. Set up your first event in minutes.
          </p>
          <Link
            href="/login"
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 hover:shadow-xl sm:mt-8 sm:w-auto"
          >
            Get Started
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 sm:py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <Flame className="h-5 w-5 text-red-500" />
            <span className="text-sm font-medium">The Judge Tool</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
