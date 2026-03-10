import { cn } from "@/shared/lib/utils";
import { SCORE_LABELS, DQ_SCORE, type ScoreDimension } from "@/shared/constants/kcbs";

interface ScoreDisplayProps {
  score: number;
  dimension?: ScoreDimension;
  size?: "sm" | "md" | "lg";
}

function getScoreClasses(score: number): string {
  if (score === DQ_SCORE)
    return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
  if (score === 2)
    return "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300";
  if (score <= 6)
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300";
  if (score <= 8)
    return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
  return "bg-emerald-100 text-emerald-800 shadow-[0_0_6px_rgba(16,185,129,0.3)] dark:bg-emerald-900/50 dark:text-emerald-300 dark:shadow-[0_0_6px_rgba(16,185,129,0.2)]";
}

const sizeClasses = {
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-10 w-10 text-base",
} as const;

export function ScoreDisplay({ score, dimension, size = "md" }: ScoreDisplayProps) {
  const label = SCORE_LABELS[score] ?? "";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md font-semibold tabular-nums",
        sizeClasses[size],
        getScoreClasses(score)
      )}
      title={dimension ? `${dimension}: ${label}` : label}
      aria-label={dimension ? `${dimension}: ${score} — ${label}` : `${score} — ${label}`}
    >
      {score}
    </span>
  );
}
