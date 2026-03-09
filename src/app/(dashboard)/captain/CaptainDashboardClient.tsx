"use client";

import { useEffect, useState, useCallback } from "react";
import { Shield, Clock } from "lucide-react";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { LoadingSpinner } from "@/shared/components/common/LoadingSpinner";
import { EmptyState } from "@/shared/components/common/EmptyState";
import { SectionCard } from "@/shared/components/common/SectionCard";
import { Badge } from "@/shared/components/ui/badge";
import { ActiveCategoryBanner, getJudgeSession } from "@features/judging";
import {
  TableStatusBoard,
  ScoreReviewTable,
  CorrectionRequestPanel,
  SubmitCategoryDialog,
  getTableScoringStatus,
  getTableScoreCards,
  getPendingCorrectionRequests,
  submitCategoryToOrganizer,
} from "@features/scoring";
import type { TableScoringStatus, ScoreCardWithJudge, CorrectionRequestWithDetails } from "@features/scoring";
import type { JudgeSession } from "@features/judging";

interface Props {
  cbjNumber: string;
  captainName: string;
}

type ActiveTab = "status" | "scores";

export function CaptainDashboardClient({ cbjNumber, captainName }: Props) {
  const [session, setSession] = useState<JudgeSession | null>(null);
  const [scoringStatus, setScoringStatus] = useState<TableScoringStatus | null>(null);
  const [scoreCards, setScoreCards] = useState<ScoreCardWithJudge[]>([]);
  const [corrections, setCorrections] = useState<CorrectionRequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("status");

  const loadData = useCallback(async () => {
    try {
      const judgeSession = await getJudgeSession();
      setSession(judgeSession);

      if (judgeSession?.table && judgeSession.activeCategory) {
        const [status, cards, reqs] = await Promise.all([
          getTableScoringStatus(
            judgeSession.table.id,
            judgeSession.activeCategory.id
          ),
          getTableScoreCards(
            judgeSession.table.id,
            judgeSession.activeCategory.id
          ),
          getPendingCorrectionRequests(judgeSession.table.id),
        ]);
        setScoringStatus(status);
        setScoreCards(cards);
        setCorrections(reqs);
      }
    } catch {
      // Ignore polling errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10_000);
    return () => clearInterval(interval);
  }, [loadData]);

  async function handleSubmitCategory() {
    if (!session?.table || !session.activeCategory) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await submitCategoryToOrganizer(
        session.table.id,
        session.activeCategory.id
      );
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading captain dashboard..." />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Table Captain"
          subtitle={`Welcome, ${captainName}`}
        />
        <EmptyState
          icon={Shield}
          title="No active assignment"
          description="You are not currently assigned as a table captain. Contact the organizer."
        />
      </div>
    );
  }

  const { activeCategory, assignedSubmissions } = session;

  if (!activeCategory) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Table Captain"
          subtitle={`${session.judge.name} — Table ${session.table.tableNumber}`}
        />
        <EmptyState
          icon={Clock}
          title="No active category"
          description="Waiting for the organizer to start the next judging round..."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Table Captain"
        subtitle={`${session.judge.name} — Table ${session.table.tableNumber}`}
      />

      {/* Active category banner */}
      <ActiveCategoryBanner
        categoryName={activeCategory.categoryName}
        submissions={assignedSubmissions}
        judgeId={session.judge.id}
      />

      {/* Correction requests */}
      {corrections.length > 0 && (
        <SectionCard.Root>
          <SectionCard.Header
            title="Correction Requests"
            actions={
              <Badge variant="destructive">{corrections.length}</Badge>
            }
          />
          <SectionCard.Body>
            <CorrectionRequestPanel.Root
              requests={corrections}
              onResolved={loadData}
            >
              {corrections.map((req) => (
                <CorrectionRequestPanel.RequestCard
                  key={req.id}
                  request={req}
                />
              ))}
            </CorrectionRequestPanel.Root>
          </SectionCard.Body>
        </SectionCard.Root>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Mobile tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 md:hidden">
        <button
          type="button"
          onClick={() => setActiveTab("status")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === "status"
              ? "bg-background shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          Status
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("scores")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === "scores"
              ? "bg-background shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          Scores
          {scoreCards.length > 0 && (
            <Badge variant="secondary" className="ml-1.5 text-xs">
              {scoreCards.length}
            </Badge>
          )}
        </button>
      </div>

      {/* Desktop: side-by-side / Mobile: tabbed */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Left panel — Table Status Board */}
        <div className={activeTab !== "status" ? "hidden md:block" : ""}>
          {scoringStatus && (
            <TableStatusBoard.Root
              status={scoringStatus}
              onSubmit={() => setSubmitDialogOpen(true)}
              isSubmitting={isSubmitting}
            >
              <TableStatusBoard.Header />
              <TableStatusBoard.JudgeGrid>
                {scoringStatus.judges.map((j) => (
                  <TableStatusBoard.JudgeRow key={j.judge.id} judge={j} />
                ))}
              </TableStatusBoard.JudgeGrid>
              <TableStatusBoard.SubmitGate />
            </TableStatusBoard.Root>
          )}
        </div>

        {/* Right panel — Score Review Table */}
        <div className={activeTab !== "scores" ? "hidden md:block" : ""}>
          <SectionCard.Root>
            <SectionCard.Header title="Score Cards" />
            <SectionCard.Body className="p-0">
              <ScoreReviewTable scoreCards={scoreCards} />
            </SectionCard.Body>
          </SectionCard.Root>
        </div>
      </div>

      {/* Submit Category Dialog */}
      {scoringStatus && (
        <SubmitCategoryDialog
          open={submitDialogOpen}
          onOpenChange={setSubmitDialogOpen}
          status={scoringStatus}
          pendingCorrections={corrections.length}
          onConfirm={handleSubmitCategory}
        />
      )}
    </div>
  );
}
