"use client";

import * as React from "react";
import { Check, Clock, Send, ShieldAlert } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { SectionCard } from "@/shared/components/common/SectionCard";
import { cn } from "@/shared/lib/utils";
import type { TableScoringStatus, JudgeScoringStatus } from "../types";

// --- Context ---

const TableStatusContext = React.createContext<{
  status: TableScoringStatus | null;
  onSubmit: () => void;
  isSubmitting: boolean;
  scoresReviewed: boolean;
  commentCardsReviewed: boolean;
  commentCardsEnabled: boolean;
}>({
  status: null,
  onSubmit: () => {},
  isSubmitting: false,
  scoresReviewed: false,
  commentCardsReviewed: false,
  commentCardsEnabled: false,
});

// --- Root ---

function Root({
  status,
  onSubmit,
  isSubmitting,
  scoresReviewed = false,
  commentCardsReviewed = false,
  commentCardsEnabled = false,
  children,
}: {
  status: TableScoringStatus;
  onSubmit: () => void;
  isSubmitting: boolean;
  scoresReviewed?: boolean;
  commentCardsReviewed?: boolean;
  commentCardsEnabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <TableStatusContext.Provider
      value={{
        status,
        onSubmit,
        isSubmitting,
        scoresReviewed,
        commentCardsReviewed,
        commentCardsEnabled,
      }}
    >
      <SectionCard.Root>{children}</SectionCard.Root>
    </TableStatusContext.Provider>
  );
}

// --- Header ---

function Header() {
  const { status } = React.useContext(TableStatusContext);
  if (!status) return null;

  return (
    <SectionCard.Header
      title={`Table ${status.tableNumber}`}
      actions={
        <Badge variant="outline" className="font-mono">
          {status.categoryName}
        </Badge>
      }
    />
  );
}

// --- Judge Grid ---

function JudgeGrid({ children }: { children: React.ReactNode }) {
  return (
    <SectionCard.Body className="space-y-2">
      {children}
    </SectionCard.Body>
  );
}

// --- Judge Row ---

function JudgeRow({ judge }: { judge: JudgeScoringStatus }) {
  const pct =
    judge.totalCount > 0
      ? (judge.submittedCount / judge.totalCount) * 100
      : 0;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border p-2 transition-colors",
        judge.allSubmitted && "border-green-500/50 bg-green-50 dark:bg-green-950/20"
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{judge.judge.name}</p>
        <p className="text-xs text-muted-foreground">
          {judge.judge.cbjNumber}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-12">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                judge.allSubmitted ? "bg-green-500" : "bg-primary"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-0.5 text-center text-xs tabular-nums text-muted-foreground">
            {judge.submittedCount}/{judge.totalCount}
          </p>
        </div>
        {judge.allSubmitted ? (
          <Check className="h-4 w-4 text-green-500 shrink-0" />
        ) : (
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </div>
    </div>
  );
}

// --- Submit Gate ---

function SubmitGate() {
  const {
    status,
    onSubmit,
    isSubmitting,
    scoresReviewed,
    commentCardsReviewed,
    commentCardsEnabled,
  } = React.useContext(TableStatusContext);
  if (!status) return null;

  const blocking = status.judges.filter((j) => !j.allSubmitted);

  // Build list of blocking reasons
  const blockReasons: string[] = [];
  if (blocking.length > 0) {
    blockReasons.push(`Waiting on ${blocking.length} judge${blocking.length > 1 ? "s" : ""}`);
  }
  if (!scoresReviewed) {
    blockReasons.push("Score cards not yet reviewed");
  }
  if (commentCardsEnabled && !commentCardsReviewed) {
    blockReasons.push("Comment cards not yet reviewed");
  }

  const canSubmit = blockReasons.length === 0;

  return (
    <SectionCard.Footer>
      {!canSubmit ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Cannot submit yet
          </div>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {blocking.map((j) => (
              <li key={j.judge.id} className="flex items-center gap-1">
                <ShieldAlert className="h-3 w-3 text-amber-500" />
                {j.judge.name} — {j.submittedCount}/{j.totalCount} submitted
              </li>
            ))}
            {!scoresReviewed && (
              <li className="flex items-center gap-1">
                <ShieldAlert className="h-3 w-3 text-amber-500" />
                Score cards not yet reviewed
              </li>
            )}
            {commentCardsEnabled && !commentCardsReviewed && (
              <li className="flex items-center gap-1">
                <ShieldAlert className="h-3 w-3 text-amber-500" />
                Comment cards not yet reviewed
              </li>
            )}
          </ul>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
            <Check className="h-4 w-4 shrink-0" />
            All reviews complete — ready to submit
          </div>
          <Button onClick={onSubmit} disabled={isSubmitting} className="w-full">
            <Send className="mr-1 h-4 w-4" />
            {isSubmitting ? "Submitting..." : "Submit to Organizer"}
          </Button>
        </div>
      )}
    </SectionCard.Footer>
  );
}

// --- Compound Export ---

export const TableStatusBoard = {
  Root,
  Header,
  JudgeGrid,
  JudgeRow,
  SubmitGate,
};
