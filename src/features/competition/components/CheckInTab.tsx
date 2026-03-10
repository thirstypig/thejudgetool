"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  Hash,
  Shuffle,
  KeyRound,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { SectionCard } from "@/shared/components/common/SectionCard";
import { DataTable } from "@/shared/components/common/DataTable";
import { ConfirmDialog } from "@/shared/components/common/ConfirmDialog";
import {
  generateJudgePin,
  checkInJudge,
  uncheckInJudge,
  assignJudgeToTableOnly,
  randomAssignTables,
} from "../actions";
import type { CompetitionJudgeWithUser } from "../types";

interface CheckInTabProps {
  competitionId: string;
  judgePin: string | null;
  roster: CompetitionJudgeWithUser[];
  showTables?: boolean;
}

export function CheckInTab({
  competitionId,
  judgePin: initialPin,
  roster,
  showTables = true,
}: CheckInTabProps) {
  const router = useRouter();
  const [pin, setPin] = useState(initialPin);
  const [isPending, startTransition] = useTransition();
  const [tableInputs, setTableInputs] = useState<Record<string, string>>({});
  const [randomError, setRandomError] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  const checkedInCount = roster.filter((r) => r.checkedIn).length;
  const assignedCount = roster.filter((r) => r.tableAssignment).length;
  const unassignedCheckedIn = roster.filter(
    (r) => r.checkedIn && !r.tableAssignment
  ).length;

  // Build table composition: { tableNumber -> judges[] }
  const tableMap: Record<number, CompetitionJudgeWithUser[]> = {};
  for (const r of roster) {
    if (r.tableAssignment) {
      const tn = r.tableAssignment.tableNumber;
      if (!tableMap[tn]) tableMap[tn] = [];
      tableMap[tn].push(r);
    }
  }
  const tableEntries = Object.entries(tableMap)
    .map(([num, judges]) => ({ tableNumber: Number(num), judges }))
    .sort((a, b) => a.tableNumber - b.tableNumber);

  async function handleGeneratePin() {
    setPinError(null);
    try {
      const newPin = await generateJudgePin(competitionId);
      setPin(newPin);
    } catch (err) {
      setPinError(
        err instanceof Error ? err.message : "Failed to generate PIN"
      );
    }
  }

  function handleCheckIn(registrationId: string) {
    startTransition(async () => {
      await checkInJudge(registrationId);
      router.refresh();
    });
  }

  function handleUncheckIn(registrationId: string) {
    startTransition(async () => {
      await uncheckInJudge(registrationId);
      router.refresh();
    });
  }

  function handleAssignTable(userId: string) {
    const tableNum = parseInt(tableInputs[userId] || "");
    if (!tableNum || tableNum < 1) return;
    startTransition(async () => {
      await assignJudgeToTableOnly(competitionId, userId, tableNum);
      setTableInputs((prev) => ({ ...prev, [userId]: "" }));
      router.refresh();
    });
  }

  function handleRandomAssign() {
    setRandomError(null);
    startTransition(async () => {
      try {
        await randomAssignTables(competitionId);
        router.refresh();
      } catch (err) {
        setRandomError(
          err instanceof Error ? err.message : "Failed to assign tables"
        );
      }
    });
  }

  const columns = [
    {
      header: "CBJ #",
      cell: (row: CompetitionJudgeWithUser) => (
        <span className="font-mono font-medium">{row.user.cbjNumber}</span>
      ),
    },
    {
      header: "Name",
      cell: (row: CompetitionJudgeWithUser) => row.user.name,
    },
    {
      header: "Status",
      cell: (row: CompetitionJudgeWithUser) => (
        <Badge variant={row.checkedIn ? "default" : "secondary"}>
          {row.checkedIn ? "Checked In" : "Not Checked In"}
        </Badge>
      ),
    },
    {
      header: "Table",
      cell: (row: CompetitionJudgeWithUser) =>
        row.tableAssignment ? (
          <Badge variant="outline">
            Table {row.tableAssignment.tableNumber}
          </Badge>
        ) : (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={1}
              placeholder="#"
              className="h-7 w-16 font-mono text-xs"
              value={tableInputs[row.userId] || ""}
              onChange={(e) =>
                setTableInputs((prev) => ({
                  ...prev,
                  [row.userId]: e.target.value,
                }))
              }
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => handleAssignTable(row.userId)}
              disabled={!tableInputs[row.userId]}
            >
              <Hash className="h-3 w-3" />
            </Button>
          </div>
        ),
    },
    {
      header: "",
      cell: (row: CompetitionJudgeWithUser) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            row.checkedIn
              ? handleUncheckIn(row.id)
              : handleCheckIn(row.id)
          }
        >
          {row.checkedIn ? (
            <XCircle className="mr-1 h-4 w-4 text-muted-foreground" />
          ) : (
            <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
          )}
          {row.checkedIn ? "Undo" : "Check In"}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Judge PIN */}
      <SectionCard.Root>
        <SectionCard.Header title="Judge PIN" />
        <SectionCard.Body>
          <p className="mb-3 text-sm text-muted-foreground">
            Share this PIN with judges as they check in so they can log into the
            app.
          </p>
          <div className="flex items-center gap-4">
            {pin ? (
              <div className="flex items-center gap-3">
                <KeyRound className="h-5 w-5 text-primary" />
                <span className="text-4xl font-bold tracking-widest font-mono">
                  {pin}
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No PIN generated yet.
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleGeneratePin}
              className="ml-auto"
            >
              <RefreshCw className="mr-1 h-4 w-4" />
              {pin ? "Regenerate" : "Generate PIN"}
            </Button>
          </div>
          {pinError && (
            <p className="mt-2 text-sm text-destructive">{pinError}</p>
          )}
        </SectionCard.Body>
      </SectionCard.Root>

      {/* Summary Stats */}
      <div className="flex flex-wrap gap-4">
        <div className="rounded-lg border px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">Registered</p>
          <p className="text-2xl font-bold">{roster.length}</p>
        </div>
        <div className="rounded-lg border px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">Checked In</p>
          <p className="text-2xl font-bold text-green-600">
            {checkedInCount}
          </p>
        </div>
        <div className="rounded-lg border px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">Assigned</p>
          <p className="text-2xl font-bold">{assignedCount}</p>
        </div>
      </div>

      {/* Random Assign */}
      {unassignedCheckedIn > 0 && (
        <div className="flex items-center gap-3">
          <ConfirmDialog
            title="Random Table Assignment"
            description={`Randomly assign ${unassignedCheckedIn} checked-in judge${
              unassignedCheckedIn !== 1 ? "s" : ""
            } to tables (6 per table). Full tables will be skipped and new tables created as needed.`}
            onConfirm={handleRandomAssign}
            confirmLabel="Assign"
            trigger={
              <Button variant="outline">
                <Shuffle className="mr-2 h-4 w-4" />
                Random Assign ({unassignedCheckedIn} unassigned)
              </Button>
            }
          />
          {randomError && (
            <p className="text-sm text-destructive">{randomError}</p>
          )}
        </div>
      )}

      {/* Check-In Roster */}
      <SectionCard.Root>
        <SectionCard.Header
          title="Check-In Roster"
          actions={
            <span className="text-sm text-muted-foreground">
              {checkedInCount} / {roster.length} checked in
            </span>
          }
        />
        <SectionCard.Body>
          <DataTable
            columns={columns}
            data={roster}
            loading={isPending}
            searchFn={(item, q) =>
              item.user.cbjNumber.toLowerCase().includes(q) ||
              item.user.name.toLowerCase().includes(q)
            }
            emptyState={
              <p className="py-8 text-center text-sm text-muted-foreground">
                No judges registered. Add judges on the Roster tab first.
              </p>
            }
          />
        </SectionCard.Body>
      </SectionCard.Root>

      {/* Table Composition */}
      {showTables && tableEntries.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Tables</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {tableEntries.map(({ tableNumber, judges }) => (
              <SectionCard.Root key={tableNumber}>
                <SectionCard.Header
                  title={`Table ${tableNumber}`}
                  actions={
                    <Badge
                      variant={judges.length >= 6 ? "default" : "secondary"}
                    >
                      {judges.length}/6 Judges
                    </Badge>
                  }
                />
                <SectionCard.Body className="py-2">
                  <div className="divide-y">
                    {judges.map((j) => (
                      <div
                        key={j.userId}
                        className="flex items-center gap-3 py-2"
                      >
                        <span className="font-mono text-sm font-medium w-16">
                          {j.user.cbjNumber}
                        </span>
                        <span className="text-sm">{j.user.name}</span>
                      </div>
                    ))}
                  </div>
                </SectionCard.Body>
              </SectionCard.Root>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
