"use client";

import { useState, useEffect } from "react";
import { SectionCard } from "@/shared/components/common/SectionCard";
import { LoadingSpinner } from "@/shared/components/common/LoadingSpinner";
import { Badge } from "@/shared/components/ui/badge";
import { SCORE_WEIGHTS } from "@/shared/constants/kcbs";
import { cn } from "@/shared/lib/utils";
import { getDetailedCategoryResults } from "../actions";
import type {
  DetailedCategoryResult,
  DetailedCompetitorResult,
  DetailedJudgeScore,
} from "../types";

interface ScoreAuditViewProps {
  competitionId: string;
  categoryRounds: { id: string; categoryName: string; order: number; status: string }[];
}

export function ScoreAuditView({
  competitionId,
  categoryRounds,
}: ScoreAuditViewProps) {
  const [selectedRound, setSelectedRound] = useState(categoryRounds[0]?.id ?? "");
  const [data, setData] = useState<DetailedCategoryResult | null>(null);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedRound) return;
    setLoading(true);
    setError(null);
    getDetailedCategoryResults(competitionId, selectedRound)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load score audit"))
      .finally(() => setLoading(false));
  }, [competitionId, selectedRound]);

  return (
    <div className="space-y-4">
      {/* Category selector */}
      <div className="flex gap-2">
        {categoryRounds.map((round) => (
          <button
            key={round.id}
            onClick={() => setSelectedRound(round.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              selectedRound === round.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {round.categoryName}
          </button>
        ))}
      </div>

      {/* Weight legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>Appearance x {SCORE_WEIGHTS.appearance}</span>
        <span>Taste x {SCORE_WEIGHTS.taste}</span>
        <span>Texture x {SCORE_WEIGHTS.texture}</span>
        <span>Max per judge = 36</span>
      </div>

      {loading && (
        <div className="flex min-h-[200px] items-center justify-center">
          <LoadingSpinner label="Loading audit data..." />
        </div>
      )}

      {!loading && error && (
        <p role="alert" className="py-8 text-center text-sm text-destructive">{error}</p>
      )}

      {!loading && !error && data && data.tables.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No scored submissions for this category yet.
        </p>
      )}

      {!loading &&
        data?.tables.map((table) => (
          <SectionCard.Root key={table.tableId}>
            <SectionCard.Header
              title={`Table ${table.tableNumber}`}
              actions={
                <span className="text-sm text-muted-foreground">
                  {table.competitors.length} teams
                </span>
              }
            />
            <SectionCard.Body>
              <div className="space-y-6">
                {table.competitors.map((comp) => (
                  <CompetitorAuditTable key={comp.competitorId} competitor={comp} />
                ))}
              </div>
            </SectionCard.Body>
          </SectionCard.Root>
        ))}
    </div>
  );
}

function CompetitorAuditTable({
  competitor,
}: {
  competitor: DetailedCompetitorResult;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="font-mono font-medium">#{competitor.anonymousNumber}</span>
        <span className="text-sm text-muted-foreground">Box {competitor.boxNumber}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-1.5 pr-3 font-medium">Judge</th>
              <th className="px-2 py-1.5 font-medium">
                <div>Appearance</div>
                <div className="text-xs font-normal text-muted-foreground">
                  Raw x {SCORE_WEIGHTS.appearance}
                </div>
              </th>
              <th className="px-2 py-1.5 font-medium">
                <div>Taste</div>
                <div className="text-xs font-normal text-muted-foreground">
                  Raw x {SCORE_WEIGHTS.taste}
                </div>
              </th>
              <th className="px-2 py-1.5 font-medium">
                <div>Texture</div>
                <div className="text-xs font-normal text-muted-foreground">
                  Raw x {SCORE_WEIGHTS.texture}
                </div>
              </th>
              <th className="px-2 py-1.5 font-medium text-right">Weighted Total</th>
            </tr>
          </thead>
          <tbody>
            {competitor.judges.map((judge) => (
              <JudgeRow key={judge.judgeId} judge={judge} />
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t font-medium">
              <td className="py-1.5 pr-3">
                {competitor.droppedJudgeId && (
                  <span className="text-xs text-muted-foreground">
                    Dropped: {competitor.judges.find((j) => j.isDropped)?.cbjNumber}
                  </span>
                )}
              </td>
              <td colSpan={3} className="px-2 py-1.5 text-right">
                Top {Math.min(5, competitor.judges.filter((j) => !j.isDropped).length)} Total
              </td>
              <td className="px-2 py-1.5 text-right font-bold">
                {competitor.top5Total.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function JudgeRow({ judge }: { judge: DetailedJudgeScore }) {
  return (
    <tr
      className={cn(
        "border-b last:border-0",
        judge.isDropped && "bg-muted/50 text-muted-foreground line-through",
        judge.isDQ && "bg-red-50 dark:bg-red-950/20"
      )}
    >
      <td className="py-1.5 pr-3">
        <div className="flex items-center gap-2">
          <span className="font-mono">{judge.cbjNumber}</span>
          {judge.isDQ && (
            <Badge variant="destructive" className="text-[10px] px-1 py-0">
              DQ
            </Badge>
          )}
          {judge.isDropped && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0">
              Dropped
            </Badge>
          )}
        </div>
      </td>
      <td className="px-2 py-1.5">
        <span>{judge.appearance}</span>
        <span className="text-muted-foreground"> = {judge.weightedAppearance.toFixed(2)}</span>
      </td>
      <td className="px-2 py-1.5">
        <span>{judge.taste}</span>
        <span className="text-muted-foreground"> = {judge.weightedTaste.toFixed(2)}</span>
      </td>
      <td className="px-2 py-1.5">
        <span>{judge.texture}</span>
        <span className="text-muted-foreground"> = {judge.weightedTexture.toFixed(2)}</span>
      </td>
      <td className="px-2 py-1.5 text-right font-medium">
        {judge.weightedTotal.toFixed(2)}
      </td>
    </tr>
  );
}
