"use client";

import { SectionCard } from "@/shared/components/common/SectionCard";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { EmptyState } from "@/shared/components/common/EmptyState";
import { BarChart3 } from "lucide-react";
import type { CompetitionProgress } from "../types";

interface CompetitionProgressDashboardProps {
  progress: CompetitionProgress | null;
}

export function CompetitionProgressDashboard({
  progress,
}: CompetitionProgressDashboardProps) {
  if (!progress || progress.categories.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No Categories"
        description="No category rounds found for this competition."
      />
    );
  }

  return (
    <div className="space-y-4">
      {progress.categories.map((cat) => {
        const pct =
          cat.totalTables > 0
            ? Math.round((cat.tablesSubmitted / cat.totalTables) * 100)
            : 0;

        return (
          <SectionCard.Root key={cat.categoryRoundId}>
            <SectionCard.Header
              title={cat.categoryName}
              actions={
                <StatusBadge
                  status={
                    cat.status.toLowerCase() as
                      | "pending"
                      | "active"
                      | "submitted"
                  }
                />
              }
            />
            <SectionCard.Body>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Tables with all scores locked
                  </span>
                  <span className="font-medium">
                    {cat.tablesSubmitted} / {cat.totalTables}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {cat.status === "ACTIVE" && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Captains submitted to organizer
                    </span>
                    <span className="font-medium">
                      {cat.captainSubmissions} / {cat.totalTables}
                    </span>
                  </div>
                )}
              </div>
            </SectionCard.Body>
          </SectionCard.Root>
        );
      })}
    </div>
  );
}
