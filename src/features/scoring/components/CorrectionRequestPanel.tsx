"use client";

import * as React from "react";
import { Check, X, AlertTriangle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { SectionCard } from "@/shared/components/common/SectionCard";
import { ScoreDisplay } from "@/shared/components/common/ScoreDisplay";
import {
  approveCorrectionRequest,
  denyCorrectionRequest,
} from "../actions";
import type { CorrectionRequestWithDetails } from "../types";

// --- Context ---

const CorrectionContext = React.createContext<{
  requests: CorrectionRequestWithDetails[];
  onResolved: () => void;
}>({ requests: [], onResolved: () => {} });

// --- Root ---

function Root({
  requests,
  onResolved,
  children,
}: {
  requests: CorrectionRequestWithDetails[];
  onResolved: () => void;
  children: React.ReactNode;
}) {
  return (
    <CorrectionContext.Provider value={{ requests, onResolved }}>
      <div className="space-y-3">{children}</div>
    </CorrectionContext.Provider>
  );
}

// --- Request Card ---

function RequestCard({
  request,
}: {
  request: CorrectionRequestWithDetails;
}) {
  const { onResolved } = React.useContext(CorrectionContext);
  const [acting, setActing] = React.useState<"approve" | "deny" | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function handleApprove() {
    if (acting) return;
    setActing("approve");
    setError(null);
    try {
      await approveCorrectionRequest(request.id);
      onResolved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve");
      setActing(null);
    }
  }

  async function handleDeny() {
    if (acting) return;
    setActing("deny");
    setError(null);
    try {
      await denyCorrectionRequest(request.id);
      onResolved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deny");
      setActing(null);
    }
  }

  const sc = request.scoreCard;

  return (
    <SectionCard.Root>
      <SectionCard.Body className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium">
              {request.judge.name}{" "}
              <span className="text-muted-foreground">
                ({request.judge.cbjNumber})
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Team #{sc.submission.competitor?.anonymousNumber ?? sc.submission.boxCode ?? sc.submission.boxNumber} · Box{" "}
              {sc.submission.boxNumber}
            </p>
          </div>
          <Badge variant="outline" className="text-amber-600">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        </div>

        {/* Current locked scores */}
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">App:</span>
            <ScoreDisplay score={sc.appearance} dimension="appearance" size="sm" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Taste:</span>
            <ScoreDisplay score={sc.taste} dimension="taste" size="sm" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Text:</span>
            <ScoreDisplay score={sc.texture} dimension="texture" size="sm" />
          </div>
        </div>

        {/* Reason */}
        <div className="rounded-md bg-muted/50 px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground">Reason</p>
          <p className="mt-0.5 text-sm">{request.reason}</p>
        </div>

        {error && <p role="alert" className="text-xs text-destructive">{error}</p>}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleApprove}
            disabled={!!acting}
            className="text-green-600 hover:bg-green-50 hover:text-green-700"
          >
            <Check className="mr-1 h-3.5 w-3.5" />
            {acting === "approve" ? "Approving..." : "Approve"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDeny}
            disabled={!!acting}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <X className="mr-1 h-3.5 w-3.5" />
            {acting === "deny" ? "Denying..." : "Deny"}
          </Button>
        </div>
      </SectionCard.Body>
    </SectionCard.Root>
  );
}

// --- Compound Export ---

export const CorrectionRequestPanel = {
  Root,
  RequestCard,
};
