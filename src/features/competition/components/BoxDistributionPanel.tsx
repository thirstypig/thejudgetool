"use client";

import { useState, useEffect } from "react";
import { Package, RefreshCw, Check, Download, RotateCcw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { SectionCard } from "@/shared/components/common/SectionCard";
import { ConfirmDialog } from "@/shared/components/common/ConfirmDialog";
import {
  generateDistribution,
  approveDistribution,
  getExistingDistribution,
  resetDistribution,
} from "../actions";
import type { BoxDistribution } from "../utils/generateBoxDistribution";

interface BoxDistributionPanelProps {
  competitionId: string;
  distributionStatus: string | null;
  tableCount: number;
  competitorCount: number;
  competitionName?: string;
}

export function BoxDistributionPanel({
  competitionId,
  distributionStatus: initialStatus,
  tableCount,
  competitorCount,
  competitionName,
}: BoxDistributionPanelProps) {
  const [distribution, setDistribution] = useState<BoxDistribution | null>(null);
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = tableCount >= 1 && competitorCount >= 6;

  // Load existing distribution from DB when status is APPROVED or DRAFT
  useEffect(() => {
    if (status === "APPROVED" || status === "DRAFT") {
      getExistingDistribution(competitionId).then((data) => {
        if (data) setDistribution(data);
      });
    }
  }, [competitionId, status]);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const result = await generateDistribution(competitionId);
      setDistribution(result);
      setStatus("DRAFT");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    if (!distribution) return;
    setApproving(true);
    setError(null);
    try {
      await approveDistribution(competitionId);
      setStatus("APPROVED");
      // Reload from DB to get the final saved data
      const data = await getExistingDistribution(competitionId);
      if (data) setDistribution(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setApproving(false);
    }
  }

  async function handleReset() {
    setResetting(true);
    setError(null);
    try {
      await resetDistribution(competitionId);
      setDistribution(null);
      setStatus(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset");
    } finally {
      setResetting(false);
    }
  }

  function handleExportCsv() {
    if (!distribution) return;
    const rows = ["Category,Table,Box Number,Competitor Number"];
    for (const cat of distribution) {
      for (const table of cat.tables) {
        for (const comp of table.competitors) {
          rows.push(`${cat.categoryName},${table.tableNumber},${comp.boxNumber},${comp.anonymousNumber}`);
        }
      }
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(competitionName || "competition").replace(/\s+/g, "-")}-box-distribution.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Build competitor-centric view from distribution
  function buildCompetitorView() {
    if (!distribution) return [];
    const map = new Map<string, { anonymousNumber: string; boxes: Record<string, number> }>();
    for (const cat of distribution) {
      for (const table of cat.tables) {
        for (const comp of table.competitors) {
          if (!comp.competitorId) continue;
          if (!map.has(comp.competitorId)) {
            map.set(comp.competitorId, { anonymousNumber: comp.anonymousNumber, boxes: {} });
          }
          map.get(comp.competitorId)!.boxes[cat.categoryName] = comp.boxNumber;
        }
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.anonymousNumber.localeCompare(b.anonymousNumber, undefined, { numeric: true })
    );
  }

  function statusBadge() {
    if (status === "APPROVED") return <Badge className="bg-green-600">Approved</Badge>;
    if (status === "DRAFT") return <Badge variant="secondary">Draft</Badge>;
    return <Badge variant="outline">Not Generated</Badge>;
  }

  const categoryNames = distribution?.map((c) => c.categoryName) ?? [];
  const competitorView = buildCompetitorView();

  return (
    <div className="space-y-6">
      <SectionCard.Root>
        <SectionCard.Header
          title="Box Distribution"
          actions={
            <div className="flex items-center gap-2">
              {statusBadge()}
              {(status === "APPROVED" || status === "DRAFT") && (
                <ConfirmDialog
                  title="Reset Distribution"
                  description="This will delete all box assignments and submissions (only possible if no scoring has started). Are you sure?"
                  destructive
                  onConfirm={handleReset}
                  confirmLabel={resetting ? "Resetting..." : "Reset"}
                  trigger={
                    <Button variant="ghost" size="sm" disabled={resetting}>
                      <RotateCcw className="mr-1 h-3.5 w-3.5" />
                      Reset
                    </Button>
                  }
                />
              )}
            </div>
          }
        />
        <SectionCard.Body>
          {!canGenerate && !distribution && (
            <p className="text-sm text-muted-foreground">
              Need at least 1 table and 6 BBQ teams to generate distribution.
            </p>
          )}

          {canGenerate && !distribution && !status && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Auto-assign team boxes to tables across all categories.
                Ensures no team appears at the same table twice (BR-2).
              </p>
              <Button onClick={handleGenerate} disabled={loading}>
                <Package className="mr-2 h-4 w-4" />
                {loading ? "Generating..." : "Generate Distribution"}
              </Button>
            </div>
          )}

          {distribution && (
            <div className="space-y-4">
              {status === "APPROVED" && (
                <p className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <Check className="h-4 w-4" />
                  Distribution approved. Submissions have been pre-created for all tables and categories.
                </p>
              )}

              {/* Table × Category matrix — shows box numbers */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 pr-3 text-left font-medium">Table</th>
                      {distribution.map((cat) => (
                        <th key={cat.categoryRoundId} className="px-2 py-2 text-left font-medium">
                          {cat.categoryName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {distribution[0]?.tables.map((_, tableIdx) => (
                      <tr key={tableIdx} className="border-b last:border-0">
                        <td className="py-2 pr-3 font-medium">
                          Table {distribution[0].tables[tableIdx].tableNumber}
                        </td>
                        {distribution.map((cat) => (
                          <td key={cat.categoryRoundId} className="px-2 py-2">
                            <div className="flex flex-wrap gap-1">
                              {cat.tables[tableIdx]?.competitors.map((comp) => (
                                <span
                                  key={comp.competitorId}
                                  className="inline-block rounded bg-muted px-1.5 py-0.5 text-xs font-mono"
                                  title={`Team ${comp.anonymousNumber}`}
                                >
                                  {comp.boxNumber}
                                </span>
                              ))}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2">
                {status !== "APPROVED" && (
                  <>
                    <Button onClick={handleGenerate} variant="outline" disabled={loading}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate
                    </Button>
                    <Button onClick={handleApprove} disabled={approving}>
                      <Check className="mr-2 h-4 w-4" />
                      {approving ? "Approving..." : "Approve & Create Submissions"}
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={() => handleExportCsv()}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>
          )}

          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </SectionCard.Body>
      </SectionCard.Root>

      {/* Competitor box assignments */}
      {distribution && competitorView.length > 0 && (
        <SectionCard.Root>
          <SectionCard.Header
            title="Box Numbers by BBQ Team"
            actions={
              <span className="text-sm text-muted-foreground">
                {competitorView.length} team{competitorView.length !== 1 ? "s" : ""}
              </span>
            }
          />
          <SectionCard.Body>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 pr-3 text-left font-medium">Team #</th>
                    {categoryNames.map((name) => (
                      <th key={name} className="px-3 py-2 text-left font-medium">
                        {name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {competitorView.map((comp) => (
                    <tr key={comp.anonymousNumber} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-mono font-medium">
                        {comp.anonymousNumber}
                      </td>
                      {categoryNames.map((name) => (
                        <td key={name} className="px-3 py-2">
                          <span className="inline-block rounded bg-muted px-2 py-0.5 font-mono text-xs">
                            {comp.boxes[name] ?? "—"}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard.Body>
        </SectionCard.Root>
      )}
    </div>
  );
}
