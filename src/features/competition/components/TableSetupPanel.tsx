"use client";

import * as React from "react";
import { UserPlus, Crown } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import { SectionCard } from "@/shared/components/common/SectionCard";
import { assignJudgeToTable, toggleCaptainJudging } from "../actions";
import type { CompetitionWithRelations } from "../types";
type TableData = CompetitionWithRelations["tables"][number];

// --- Context ---

const TableSetupContext = React.createContext<{
  competitionId: string;
  tables: TableData[];
}>({ competitionId: "", tables: [] });

// --- Root ---

function Root({
  competitionId,
  tables,
  children,
}: {
  competitionId: string;
  tables: TableData[];
  children: React.ReactNode;
}) {
  return (
    <TableSetupContext.Provider value={{ competitionId, tables }}>
      <div className="space-y-4">{children}</div>
    </TableSetupContext.Provider>
  );
}

// --- Table Card ---

function TableCard({
  tableNumber,
  children,
}: {
  tableNumber: number;
  children: React.ReactNode;
}) {
  const { competitionId, tables } = React.useContext(TableSetupContext);
  const router = useRouter();
  const table = tables.find((t) => t.tableNumber === tableNumber);
  const judgeCount = table?.assignments.length ?? 0;

  // Is the captain also in the assignments list (i.e., judging)?
  const captainIsJudging = table?.captain
    ? table.assignments.some((a) => a.userId === table.captainId)
    : false;

  const [toggling, setToggling] = React.useState(false);

  async function handleToggleJudging() {
    if (!table) return;
    setToggling(true);
    try {
      await toggleCaptainJudging(competitionId, table.id, !captainIsJudging);
      router.refresh();
    } catch {
      // silently fail — refresh will show current state
    } finally {
      setToggling(false);
    }
  }

  return (
    <SectionCard.Root>
      <SectionCard.Header
        title={`Table ${tableNumber}`}
        actions={
          table && (
            <span className="text-xs text-muted-foreground">
              {judgeCount}/6 Judges | Table Captain:{" "}
              {table.captain?.name ?? "Unassigned"}
            </span>
          )
        }
      />
      <SectionCard.Body>
        {/* Captain */}
        {table?.captain && (
          <div className="mb-3 flex items-center gap-2 rounded-md border border-amber-500 bg-amber-50 p-2 dark:bg-amber-950/20">
            <Crown className="h-4 w-4 text-amber-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{table.captain.name}</p>
              <p className="text-xs text-muted-foreground">{table.captain.cbjNumber} &middot; Table Captain</p>
            </div>
            <label className="flex items-center gap-1.5 text-xs shrink-0">
              <input
                type="checkbox"
                checked={captainIsJudging}
                onChange={handleToggleJudging}
                disabled={toggling}
                className="rounded"
              />
              Also judging
            </label>
          </div>
        )}

        {/* Judges list */}
        {table && table.assignments.length > 0 ? (
          <div className="divide-y">
            {table.assignments.map((assignment) => {
              const isCaptain = table.captainId === assignment.userId;
              return (
                <div
                  key={assignment.userId}
                  className="flex items-center gap-2 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{assignment.user.name}</p>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {assignment.user.cbjNumber}
                  </span>
                  {isCaptain && (
                    <Badge variant="outline" className="text-amber-600 border-amber-500">
                      <Crown className="mr-1 h-3 w-3" /> Table Captain
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No judges assigned yet.</p>
        )}
      </SectionCard.Body>
      {children}
    </SectionCard.Root>
  );
}

// --- Assign Form ---

function AssignForm({ tableNumber }: { tableNumber: number }) {
  const { competitionId } = React.useContext(TableSetupContext);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [cbjNumber, setCbjNumber] = React.useState("");
  const [isCaptain, setIsCaptain] = React.useState(false);
  const [isJudging, setIsJudging] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cbjNumber.trim()) return;
    setIsSubmitting(true);
    setServerError(null);
    try {
      await assignJudgeToTable(
        competitionId,
        cbjNumber.trim(),
        tableNumber,
        null, // no seat number
        isCaptain,
        isCaptain ? isJudging : true
      );
      setCbjNumber("");
      setIsCaptain(false);
      setIsJudging(true);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Failed to assign judge"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SectionCard.Footer>
      <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="assign-cbj">CBJ #</Label>
          <Input
            id="assign-cbj"
            placeholder="100001"
            className="w-28 font-mono"
            value={cbjNumber}
            onChange={(e) => setCbjNumber(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={isCaptain}
            onChange={(e) => {
              setIsCaptain(e.target.checked);
              if (!e.target.checked) setIsJudging(true);
            }}
          />
          <Crown className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
          Table Captain
        </label>
        {isCaptain && (
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={isJudging}
              onChange={(e) => setIsJudging(e.target.checked)}
            />
            Also judging
          </label>
        )}
        <Button type="submit" size="sm" disabled={isSubmitting}>
          <UserPlus className="mr-1 h-4 w-4" />
          {isSubmitting ? "Adding..." : "Add"}
        </Button>
      </form>
      {serverError && (
        <p className="mt-2 text-sm text-destructive">{serverError}</p>
      )}
    </SectionCard.Footer>
  );
}

// --- Named Exports (RSC-safe) ---

export const TableSetupPanelRoot = Root;
export const TableSetupPanelTableCard = TableCard;
export const TableSetupPanelAssignForm = AssignForm;
