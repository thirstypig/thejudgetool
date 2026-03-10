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
  CommentCardReviewTable,
  SubmitCategoryDialog,
  CategorySubmittedScreen,
  getTableScoringStatus,
  getTableScoreCards,
  getTableCommentCards,
  getPendingCorrectionRequests,
  isCategorySubmittedByTable,
  submitCategoryToOrganizer,
} from "@features/scoring";
import type { TableScoringStatus, ScoreCardWithJudge, CommentCardWithJudge, CorrectionRequestWithDetails } from "@features/scoring";
import type { JudgeSession } from "@features/judging";

interface Props {
  cbjNumber: string;
  captainName: string;
}

type CaptainPhase =
  | "no-assignment"
  | "waiting-for-meat"
  | "judging-in-progress"
  | "ready-to-review"
  | "category-submitted";

type ActiveTab = "status" | "scores" | "comments";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function CaptainDashboardClient({ cbjNumber, captainName }: Props) {
  const [session, setSession] = useState<JudgeSession | null>(null);
  const [scoringStatus, setScoringStatus] = useState<TableScoringStatus | null>(null);
  const [scoreCards, setScoreCards] = useState<ScoreCardWithJudge[]>([]);
  const [commentCards, setCommentCards] = useState<CommentCardWithJudge[]>([]);
  const [corrections, setCorrections] = useState<CorrectionRequestWithDetails[]>([]);
  const [categorySubmitted, setCategorySubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("status");
  const [scoresReviewed, setScoresReviewed] = useState(false);
  const [commentCardsReviewed, setCommentCardsReviewed] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const judgeSession = await getJudgeSession();
      setSession(judgeSession);

      if (judgeSession?.table && judgeSession.activeCategory) {
        const [status, cards, comments, reqs, submitted] = await Promise.all([
          getTableScoringStatus(
            judgeSession.table.id,
            judgeSession.activeCategory.id
          ),
          getTableScoreCards(
            judgeSession.table.id,
            judgeSession.activeCategory.id
          ),
          judgeSession.commentCardsEnabled
            ? getTableCommentCards(
                judgeSession.table.id,
                judgeSession.activeCategory.id
              )
            : Promise.resolve([]),
          getPendingCorrectionRequests(judgeSession.table.id),
          isCategorySubmittedByTable(
            judgeSession.table.id,
            judgeSession.activeCategory.id
          ),
        ]);
        setScoringStatus(status);
        setScoreCards(cards);
        setCommentCards(comments);
        setCorrections(reqs);
        setCategorySubmitted(submitted);
      } else {
        setCategorySubmitted(false);
        setCommentCards([]);
      }
    } catch {
      // Ignore polling errors
    } finally {
      setLoading(false);
    }
  }, []);

  // Derive phase
  function getPhase(): CaptainPhase {
    if (!session) return "no-assignment";
    if (!session.activeCategory) return "waiting-for-meat";
    if (categorySubmitted) return "category-submitted";
    if (scoringStatus?.allJudgesDone && corrections.length === 0) return "ready-to-review";
    return "judging-in-progress";
  }

  const phase = loading ? null : getPhase();

  // Poll — faster during judging-in-progress, stable interval via ref
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15_000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Reset review state when active category changes
  const activeCategoryId = session?.activeCategory?.id;
  useEffect(() => {
    setScoresReviewed(false);
    setCommentCardsReviewed(false);
  }, [activeCategoryId]);

  // Auto-switch to scores tab when ready to review
  useEffect(() => {
    if (phase === "ready-to-review") {
      setActiveTab("scores");
    }
  }, [phase]);

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

  if (phase === "no-assignment") {
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

  if (!session || phase === "waiting-for-meat") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Table Captain"
          subtitle={session ? `${session.judge.name} — Table ${session.table.tableNumber}` : ""}
        />
        <EmptyState
          icon={Clock}
          title="No active category"
          description="Waiting for the organizer to start the next judging round..."
        />
      </div>
    );
  }

  // After this point, session is guaranteed non-null by the phase checks above
  const { activeCategory, assignedSubmissions } = session;

  if (phase === "category-submitted" && activeCategory && scoringStatus) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Table Captain"
          subtitle={`${session.judge.name} — Table ${session.table.tableNumber}`}
        />
        <CategorySubmittedScreen
          categoryName={activeCategory.categoryName}
          totalCards={scoringStatus.submittedScoreCards}
          totalJudges={scoringStatus.judges.length}
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
      {activeCategory && (
        <ActiveCategoryBanner
          categoryName={activeCategory.categoryName}
          submissions={assignedSubmissions}
          judgeId={session.judge.id}
        />
      )}

      {/* Ready to review banner */}
      {phase === "ready-to-review" && (
        <div className="rounded-lg border-2 border-green-500 bg-green-50 p-4 text-center dark:bg-green-900/20">
          <p className="text-sm font-semibold text-green-700 dark:text-green-400">
            All judges have submitted — ready for review and submission
          </p>
        </div>
      )}

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

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

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
        {session?.commentCardsEnabled && (
          <button
            type="button"
            onClick={() => setActiveTab("comments")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === "comments"
                ? "bg-background shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Comments
            {commentCards.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs">
                {commentCards.length}
              </Badge>
            )}
          </button>
        )}
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
              scoresReviewed={scoresReviewed}
              commentCardsReviewed={commentCardsReviewed}
              commentCardsEnabled={session?.commentCardsEnabled ?? false}
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

        {/* Right panel — Score Review + Comment Card Review */}
        <div className={activeTab !== "scores" && activeTab !== "comments" ? "hidden md:block" : ""}>
          <div className={activeTab === "comments" ? "hidden md:block" : ""}>
            <SectionCard.Root>
              <SectionCard.Header title="Score Cards" />
              <SectionCard.Body className="p-0">
                <ScoreReviewTable
                  scoreCards={scoreCards}
                  reviewed={scoresReviewed}
                  onMarkReviewed={() => setScoresReviewed(true)}
                />
              </SectionCard.Body>
            </SectionCard.Root>
          </div>

          {session?.commentCardsEnabled && (
            <div className={`mt-4 ${activeTab === "scores" ? "hidden md:block" : ""}`}>
              <SectionCard.Root>
                <SectionCard.Header title="Comment Cards" />
                <SectionCard.Body className="p-0">
                  <CommentCardReviewTable
                    commentCards={commentCards}
                    reviewed={commentCardsReviewed}
                    onMarkReviewed={() => setCommentCardsReviewed(true)}
                  />
                </SectionCard.Body>
              </SectionCard.Root>
            </div>
          )}
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
