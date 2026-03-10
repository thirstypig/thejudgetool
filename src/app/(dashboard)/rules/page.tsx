import type { Metadata } from "next";
import Image from "next/image";
import { PageHeader } from "@/shared/components/common/PageHeader";
import {
  VALID_SCORES,
  SCORE_LABELS,
  SCORE_WEIGHTS,
  MAX_WEIGHTED_SCORE,
  PERFECT_SCORE,
  JUDGES_PER_TABLE,
  COUNTING_JUDGES,
  DQ_SCORE,
} from "@/shared/constants/kcbs";

export const metadata: Metadata = {
  title: "Judging Rules | BBQ Judge",
};

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10 pb-12">
      {/* Header with KCBS Logo */}
      <div className="flex flex-col items-center space-y-4 text-center">
        <Image
          src="/images/kcbs-logo.png"
          alt="Kansas City Barbeque Society Logo"
          width={120}
          height={169}
          className="rounded"
          priority
        />
        <PageHeader
          title="2025 Official KCBS Judging Procedures"
          subtitle="Kansas City Barbeque Society"
        />
      </div>

      {/* Judges Creed */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold tracking-tight">
          KCBS Judges&apos; Creed
        </h2>
        <blockquote className="rounded-lg border-l-4 border-primary bg-primary/5 p-5 text-base italic leading-relaxed">
          &ldquo;I do solemnly swear to objectively and subjectively evaluate
          each Barbeque meat that is presented to my eyes, my nose, my hands
          and my palate. I accept my duty to be an Official KCBS Certified
          Judge, so that truth, justice, excellence in Barbeque and the
          American Way of Life may be strengthened and preserved forever.&rdquo;
        </blockquote>
        <p className="text-sm text-muted-foreground">
          This oath is recited aloud in unison by all judges prior to each
          competition.
        </p>
      </section>

      {/* Blind Judging */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold tracking-tight">Blind Judging</h2>
        <p className="text-sm leading-relaxed">
          KCBS sanctioning allows for blind judging only. Entries are submitted
          in approved KCBS numbered containers provided by the contest
          organizer. The container may be re-numbered by the KCBS Contest Rep
          or authorized personnel before being presented to judges. Judges
          never know which team&apos;s entry they are evaluating.
        </p>
      </section>

      {/* Categories */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold tracking-tight">
          Mandatory Categories
        </h2>
        <p className="text-sm leading-relaxed">
          KCBS conducts official competitions in four mandatory categories,
          judged in order:
        </p>
        <ol className="ml-6 list-decimal space-y-1 text-sm">
          <li>
            <span className="font-semibold">Chicken</span>
          </li>
          <li>
            <span className="font-semibold">Pork Ribs</span>
          </li>
          <li>
            <span className="font-semibold">Pork</span>
          </li>
          <li>
            <span className="font-semibold">Brisket</span>
          </li>
        </ol>
      </section>

      {/* Scoring Scale */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold tracking-tight">Scoring Scale</h2>
        <p className="text-sm leading-relaxed">
          Each entry is scored on three dimensions: Appearance, Taste, and
          Tenderness/Texture. Scores of 3 and 4 are not used.
        </p>
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2 text-left font-semibold">Score</th>
                <th className="px-4 py-2 text-left font-semibold">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {VALID_SCORES.slice()
                .reverse()
                .map((score) => (
                  <tr
                    key={score}
                    className={`border-b last:border-0 ${score === DQ_SCORE ? "bg-red-50 dark:bg-red-950/20" : ""}`}
                  >
                    <td className="px-4 py-2 font-mono font-bold">{score}</td>
                    <td className="px-4 py-2">
                      {SCORE_LABELS[score]}
                      {score === DQ_SCORE && (
                        <span className="ml-2 text-xs text-red-600 dark:text-red-400">
                          Requires Rep approval
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Scoring Weights */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold tracking-tight">Scoring Weights</h2>
        <p className="text-sm leading-relaxed">
          Raw scores are multiplied by KCBS-mandated weights. The maximum
          weighted score per judge is {MAX_WEIGHTED_SCORE}.
        </p>
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2 text-left font-semibold">Dimension</th>
                <th className="px-4 py-2 text-right font-semibold">Weight</th>
                <th className="px-4 py-2 text-right font-semibold">Max Score</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="px-4 py-2">Appearance</td>
                <td className="px-4 py-2 text-right font-mono">&times; {SCORE_WEIGHTS.appearance.toFixed(4)}</td>
                <td className="px-4 py-2 text-right font-mono">{(9 * SCORE_WEIGHTS.appearance).toFixed(4)}</td>
              </tr>
              <tr className="border-b border-primary/30 bg-primary/5">
                <td className="px-4 py-2 font-semibold">Taste</td>
                <td className="px-4 py-2 text-right font-mono">&times; {SCORE_WEIGHTS.taste.toFixed(4)}</td>
                <td className="px-4 py-2 text-right font-mono">{(9 * SCORE_WEIGHTS.taste).toFixed(4)}</td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-2">Tenderness / Texture</td>
                <td className="px-4 py-2 text-right font-mono">&times; {SCORE_WEIGHTS.texture.toFixed(4)}</td>
                <td className="px-4 py-2 text-right font-mono">{(9 * SCORE_WEIGHTS.texture).toFixed(4)}</td>
              </tr>
              <tr className="bg-muted/30">
                <td className="px-4 py-2 font-bold">Total</td>
                <td className="px-4 py-2 text-right font-mono font-bold">{(SCORE_WEIGHTS.appearance + SCORE_WEIGHTS.taste + SCORE_WEIGHTS.texture).toFixed(4)}</td>
                <td className="px-4 py-2 text-right font-mono font-bold">{MAX_WEIGHTED_SCORE}.0000</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="space-y-1 text-sm leading-relaxed">
          <p>
            <strong>Drop Lowest:</strong> Each table has {JUDGES_PER_TABLE} judges.
            The lowest weighted total is dropped &mdash; only the top{" "}
            {COUNTING_JUDGES} count toward the competitor&apos;s final score.
          </p>
          <p>
            <strong>Perfect Score:</strong> {COUNTING_JUDGES} &times;{" "}
            {MAX_WEIGHTED_SCORE} = <span className="font-bold">{PERFECT_SCORE}</span>
          </p>
        </div>
      </section>

      {/* Tiebreaking Procedures */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold tracking-tight">
          Tiebreaking Procedures
        </h2>
        <p className="text-sm leading-relaxed">
          When two or more competitors have the same weighted total, ties are
          broken in the following order:
        </p>
        <ol className="ml-6 list-decimal space-y-2 text-sm">
          <li>
            <strong>Cumulative Taste scores</strong> across all {JUDGES_PER_TABLE}{" "}
            judges (higher wins)
          </li>
          <li>
            <strong>Cumulative Tenderness/Texture scores</strong> across all{" "}
            {JUDGES_PER_TABLE} judges (higher wins)
          </li>
          <li>
            <strong>Cumulative Appearance scores</strong> across all{" "}
            {JUDGES_PER_TABLE} judges (higher wins)
          </li>
          <li>
            <strong>Dropped judge&apos;s weighted score</strong> &mdash; the
            lowest judge&apos;s weighted total that was dropped (higher wins)
          </li>
          <li>
            <strong>Deterministic coin toss</strong>
          </li>
        </ol>
      </section>

      {/* Scoring Criteria */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">Scoring Criteria</h2>

        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold">Appearance</h3>
            <p className="mt-1 text-sm leading-relaxed">
              Judges assess the overall appearance of the whole box and the
              meat inside. This includes the color of the meat, visual
              moistness, the finish of any sauce, and overall visual appeal.
              Garnish is optional but if used, is limited to fresh green
              lettuce, curly green kale, curly parsley, flat leaf parsley,
              and/or cilantro. A score of 1 in Appearance is given for
              prohibited garnish, pooled sauce, or fewer than 6 samples.
            </p>
          </div>

          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <h3 className="font-semibold">Taste</h3>
            <p className="mt-1 text-sm leading-relaxed">
              Based on a single bite, judges determine whether flavors from
              injections, rubs, and sauces are well-balanced. No flavors
              should be overpowering or unpleasant. Flavors should complement
              the meat type without concealing its natural taste. Taste holds
              paramount importance &mdash; a 5-9-9 can outscore a 9-8-9 due
              to the higher taste weighting.
            </p>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="font-semibold">Tenderness / Texture</h3>
            <p className="mt-1 text-sm leading-relaxed">
              Also evaluated from one bite, assessing mouthfeel and texture.
              For <strong>chicken</strong>, skin should be biteable without
              separating and meat should cleanly leave bones. For{" "}
              <strong>ribs</strong>, the bitten portion should release from
              the bone cleanly while the rest stays attached. All meats are
              judged for moistness, tenderness, and pleasant mouthfeel.
              Under- or overcooked entries (tough or mushy) score lower.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t pt-6 text-center text-xs text-muted-foreground">
        <p>
          Reference: KCBS 2025 Official Judging Procedures &mdash;{" "}
          <a
            href="https://kcbs.us"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            kcbs.us
          </a>
        </p>
        <p className="mt-1">
          KCBS and the KCBS logo are registered trademarks of the Kansas City
          Barbeque Society.
        </p>
      </footer>
    </div>
  );
}
