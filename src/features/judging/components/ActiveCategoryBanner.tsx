"use client";

import { cn } from "@/shared/lib/utils";
import type { SubmissionWithDetails } from "../types";

interface ActiveCategoryBannerProps {
  categoryName: string;
  submissions: SubmissionWithDetails[];
  judgeId: string;
  className?: string;
}

export function ActiveCategoryBanner({
  categoryName,
  submissions,
  judgeId,
  className,
}: ActiveCategoryBannerProps) {
  const total = submissions.length;
  const submitted = submissions.filter((s) =>
    s.scoreCards.some((sc) => sc.judgeId === judgeId && sc.locked)
  ).length;
  const pct = total > 0 ? (submitted / total) * 100 : 0;
  const allDone = submitted === total && total > 0;

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-lg border bg-card px-4 py-3 shadow-sm",
        allDone && "border-green-500/50 bg-green-50 dark:bg-green-950/20",
        className
      )}
    >
      {/* Progress ring */}
      <div className="relative h-10 w-10 flex-shrink-0">
        <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-muted"
          />
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${pct} 100`}
            strokeLinecap="round"
            className={cn(
              "transition-all duration-500",
              allDone ? "text-green-500" : "text-primary"
            )}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
          {submitted}/{total}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">
          Now Judging: {categoryName}
        </p>
        <p className="text-xs text-muted-foreground">
          {allDone
            ? "All submissions scored"
            : `${total - submitted} remaining`}
        </p>
      </div>
    </div>
  );
}
