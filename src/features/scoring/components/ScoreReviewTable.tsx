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
            <TableHead className="w-10 px-2">#</TableHead>
            <TableHead className="px-2">Judge</TableHead>
            <TableHead className="w-10 px-1 text-center">A</TableHead>
            <TableHead className="w-10 px-1 text-center">T</TableHead>
            <TableHead className="w-10 px-1 text-center">Tx</TableHead>
            <TableHead className="w-12 px-1 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-0.5 py-0 text-xs font-medium"
                onClick={() => setSortByTotal((v) => !v)}
              >
                Tot
                <ArrowUpDown className="ml-0.5 h-3 w-3" />
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((sc) => (
            <TableRow
              key={sc.id}
              className={cn(sc.hasDQ && "bg-red-50 dark:bg-red-950/20")}
            >
              <TableCell className="px-2 font-mono text-xs font-semibold">
                {sc.submission.competitor?.anonymousNumber ?? sc.submission.boxCode ?? sc.submission.boxNumber}
              </TableCell>
              <TableCell className="px-2">
                <p className="truncate text-sm">{sc.judge.name}</p>
              </TableCell>
              <TableCell className="px-1 text-center">
                <ScoreDisplay
                  score={sc.appearance}
                  dimension="appearance"
                  size="sm"
                />
              </TableCell>
              <TableCell className="px-1 text-center">
                <ScoreDisplay
                  score={sc.taste}
                  dimension="taste"
                  size="sm"
                />
              </TableCell>
              <TableCell className="px-1 text-center">
                <ScoreDisplay
                  score={sc.texture}
                  dimension="texture"
                  size="sm"
                />
              </TableCell>
              <TableCell className="px-1 text-center font-semibold tabular-nums text-sm">
                {sc.total}
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
