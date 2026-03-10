"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { BarChart3, Trophy, ScrollText, FileSearch, Play } from "lucide-react";
import { PageHeader } from "@/shared/components/common/PageHeader";
import { LoadingSpinner } from "@/shared/components/common/LoadingSpinner";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import {
  CompetitionProgressDashboard,
  ResultsLeaderboard,
  WinnerDeclarationPanel,
  ExportResultsButton,
  AuditLogViewer,
  ScoreAuditView,
  getCompetitionProgress,
  getAllCategoryResults,
  getAuditLog,
} from "@features/tabulation";
import {
  getCompetitionById,
  CompetitionStatusStepper,
  advanceCategoryRound,
} from "@features/competition";
import type { CompetitionProgress, AllCategoryResults, AuditLogEntry } from "@features/tabulation";
import type { CompetitionWithRelations } from "@features/competition";

type Tab = "progress" | "results" | "score-audit" | "audit";

const TABS: { key: Tab; label: string; icon: typeof BarChart3 }[] = [
  { key: "progress", label: "Live Progress", icon: BarChart3 },
  { key: "results", label: "Results", icon: Trophy },
  { key: "score-audit", label: "Score Audit", icon: FileSearch },
  { key: "audit", label: "Audit Log", icon: ScrollText },
];

export default function ResultsPage() {
  const params = useParams<{ competitionId: string }>();
  const [activeTab, setActiveTab] = useState<Tab>("progress");
  const [loading, setLoading] = useState(true);

  const [competition, setCompetition] = useState<CompetitionWithRelations | null>(null);
  const [progress, setProgress] = useState<CompetitionProgress | null>(null);
  const [results, setResults] = useState<AllCategoryResults>({});
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [advancing, setAdvancing] = useState(false);
  const [advanceError, setAdvanceError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      // Always fetch competition; only fetch data for active tab
      const comp = await getCompetitionById(params.competitionId);
      setCompetition(comp);

      if (activeTab === "progress") {
        setProgress(await getCompetitionProgress(params.competitionId));
      } else if (activeTab === "results") {
        setResults(await getAllCategoryResults(params.competitionId));
      } else if (activeTab === "audit") {
        setAuditLogs(await getAuditLog(params.competitionId));
      }
      // score-audit tab loads on demand via ScoreAuditView
    } finally {
      setLoading(false);
    }
  }, [params.competitionId, activeTab]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15_000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleAdvance() {
    try {
      setAdvancing(true);
      setAdvanceError(null);
      await advanceCategoryRound(params.competitionId);
      await load();
    } catch (err) {
      setAdvanceError(err instanceof Error ? err.message : "Failed to advance round");
    } finally {
      setAdvancing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading results..." />
      </div>
    );
  }

  if (!competition) {
    return <p className="text-destructive">Competition not found.</p>;
  }

  const canAdvance =
    competition.status !== "CLOSED" &&
    !competition.categoryRounds.some((r) => r.status === "ACTIVE");

  return (
    <div className="space-y-6">
      <PageHeader
        title={competition.name}
        subtitle="Results & Tabulation"
        actions={
          <div className="flex items-center gap-2">
            {canAdvance && (
              <Button onClick={handleAdvance} disabled={advancing}>
                <Play className="mr-1 h-4 w-4" />
                {advancing ? "Advancing..." : "Start Next Round"}
              </Button>
            )}
            {activeTab === "results" && (
              <ExportResultsButton competitionId={params.competitionId} />
            )}
          </div>
        }
      />

      {/* Category stepper */}
      <CompetitionStatusStepper
        status={competition.status}
        categoryRounds={competition.categoryRounds}
      />

      {advanceError && <p className="text-sm text-destructive">{advanceError}</p>}

      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              activeTab === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "progress" && (
        <CompetitionProgressDashboard progress={progress} />
      )}

      {activeTab === "results" && (
        <div className="space-y-6">
          <ResultsLeaderboard results={results} />
          {progress?.categories.map((cat) => {
            const catResults = results[cat.categoryName] ?? [];
            if (catResults.length === 0) return null;
            return (
              <WinnerDeclarationPanel
                key={cat.categoryRoundId}
                competitionId={params.competitionId}
                categoryRoundId={cat.categoryRoundId}
                categoryName={cat.categoryName}
                results={catResults}
                onDeclared={load}
              />
            );
          })}
        </div>
      )}

      {activeTab === "score-audit" && competition && (
        <ScoreAuditView
          competitionId={params.competitionId}
          categoryRounds={competition.categoryRounds}
        />
      )}

      {activeTab === "audit" && <AuditLogViewer logs={auditLogs} />}
    </div>
  );
}
