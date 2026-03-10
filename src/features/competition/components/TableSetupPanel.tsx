"use client";

import * as React from "react";
import { UserPlus, Crown } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import { SectionCard } from "@/shared/components/common/SectionCard";
import { UserAvatar } from "@/shared/components/common/UserAvatar";
import { assignJudgeToTable } from "../actions";
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
  const { tables } = React.useContext(TableSetupContext);
  const table = tables.find((t) => t.tableNumber === tableNumber);
  const judgeCount = table?.assignments.length ?? 0;

  return (
    <SectionCard.Root>
      <SectionCard.Header
        title={`Table ${tableNumber}`}
        actions={
          table && (
            <span className="text-xs text-muted-foreground">
              {judgeCount}/6 Judges | Captain:{" "}
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
            <UserAvatar
              cbjNumber={table.captain.cbjNumber}
              role="TABLE_CAPTAIN"
              className="h-8 w-8 text-xs"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{table.captain.name}</p>
              <p className="text-xs text-muted-foreground">{table.captain.cbjNumber} &middot; Captain</p>
            </div>
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
                  <UserAvatar
                    cbjNumber={assignment.user.cbjNumber}
                    role={assignment.user.role as "JUDGE" | "TABLE_CAPTAIN" | "ORGANIZER"}
                    className="h-7 w-7 text-xs"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{assignment.user.name}</p>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {assignment.user.cbjNumber}
                  </span>
                  {isCaptain && (
                    <Badge variant="outline" className="text-amber-600 border-amber-500">
                      <Crown className="mr-1 h-3 w-3" /> Captain
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
        isCaptain
      );
      setCbjNumber("");
      setIsCaptain(false);
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
      <form onSubmit={onSubmit} className="flex items-end gap-3">
        <div className="space-y-1">
          <Label>CBJ #</Label>
          <Input
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
            onChange={(e) => setIsCaptain(e.target.checked)}
          />
          <Crown className="h-3.5 w-3.5 text-amber-500" />
          Captain
        </label>
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

