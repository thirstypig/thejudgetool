"use client";

import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Button } from "@/shared/components/ui/button";
import { ScoreDisplay } from "@/shared/components/common/ScoreDisplay";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { EmptyState } from "@/shared/components/common/EmptyState";
import { cn } from "@/shared/lib/utils";
import { ClipboardList, CheckCircle2 } from "lucide-react";
import type { ScoreCardWithJudge } from "../types";

interface ScoreReviewTableProps {
  scoreCards: ScoreCardWithJudge[];
  reviewed?: boolean;
  onMarkReviewed?: () => void;
}

export function ScoreReviewTable({ scoreCards, reviewed, onMarkReviewed }: ScoreReviewTableProps) {
  const [sortByTotal, setSortByTotal] = useState(false);

  if (scoreCards.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No score cards yet"
        description="Judges have not submitted any scores for this round."
      />
    );
  }

  const rows = scoreCards.map((sc) => ({
    ...sc,
    total: sc.appearance + sc.taste + sc.texture,
    hasDQ: sc.appearance === 1 || sc.taste === 1 || sc.texture === 1,
  }));

  const sorted = sortByTotal
    ? [...rows].sort((a, b) => b.total - a.total)
    : rows;

  return (
    <>
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Box</TableHead>
            <TableHead className="w-20">#</TableHead>
            <TableHead>Judge</TableHead>
            <TableHead className="w-20 text-center">App</TableHead>
            <TableHead className="w-20 text-center">Taste</TableHead>
            <TableHead className="w-20 text-center">Text</TableHead>
            <TableHead className="w-20 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-1 py-0 text-xs font-medium"
                onClick={() => setSortByTotal((v) => !v)}
              >
                Total
                <ArrowUpDown className="ml-1 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead className="w-24">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((sc) => (
            <TableRow
              key={sc.id}
              className={cn(sc.hasDQ && "bg-red-50 dark:bg-red-950/20")}
            >
              <TableCell className="font-mono text-sm">
                {sc.submission.boxNumber}
              </TableCell>
              <TableCell className="font-mono text-sm font-semibold">
                #{sc.submission.competitor?.anonymousNumber ?? sc.submission.boxCode ?? sc.submission.boxNumber}
              </TableCell>
              <TableCell>
                <div>
                  <p className="text-sm">{sc.judge.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {sc.judge.cbjNumber}
                  </p>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <ScoreDisplay
                  score={sc.appearance}
                  dimension="appearance"
                  size="sm"
                />
              </TableCell>
              <TableCell className="text-center">
                <ScoreDisplay
                  score={sc.taste}
                  dimension="taste"
                  size="sm"
                />
              </TableCell>
              <TableCell className="text-center">
                <ScoreDisplay
                  score={sc.texture}
                  dimension="texture"
                  size="sm"
                />
              </TableCell>
              <TableCell className="text-center font-semibold tabular-nums">
                {sc.total}
              </TableCell>
              <TableCell>
                <StatusBadge
                  status={sc.locked ? "locked" : "active"}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    {onMarkReviewed && (
      <div className="border-t px-4 py-3">
        {reviewed ? (
          <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            Scores Reviewed
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={onMarkReviewed}
            className="w-full"
          >
            <CheckCircle2 className="mr-1.5 h-4 w-4" />
            I have reviewed all score cards
          </Button>
        )}
      </div>
    )}
    </>
  );
}
