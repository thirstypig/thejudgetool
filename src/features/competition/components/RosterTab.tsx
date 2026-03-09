"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { SectionCard } from "@/shared/components/common/SectionCard";
import { DataTable } from "@/shared/components/common/DataTable";
import { ConfirmDialog } from "@/shared/components/common/ConfirmDialog";
import { JudgeImportForm } from "@features/users";
import {
  registerJudgesBulkForCompetition,
  unregisterJudgeFromCompetition,
} from "../actions";
import type { CompetitionJudgeWithUser } from "../types";

interface RosterTabProps {
  competitionId: string;
  roster: CompetitionJudgeWithUser[];
}

export function RosterTab({ competitionId, roster }: RosterTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [removeError, setRemoveError] = useState<string | null>(null);

  async function handleImported(userIds: string[]) {
    await registerJudgesBulkForCompetition(competitionId, userIds);
    startTransition(() => router.refresh());
  }

  async function handleRemove(registrationId: string) {
    setRemoveError(null);
    try {
      await unregisterJudgeFromCompetition(registrationId);
      startTransition(() => router.refresh());
    } catch (err) {
      setRemoveError(
        err instanceof Error ? err.message : "Failed to remove judge"
      );
    }
  }

  const columns = [
    {
      header: "CBJ #",
      cell: (row: CompetitionJudgeWithUser) => (
        <span className="font-mono font-medium">CBJ-{row.user.cbjNumber}</span>
      ),
    },
    {
      header: "Name",
      cell: (row: CompetitionJudgeWithUser) => row.user.name,
    },
    {
      header: "",
      cell: (row: CompetitionJudgeWithUser) => (
        <ConfirmDialog
          title="Remove Judge"
          description={`Remove ${row.user.name} (CBJ-${row.user.cbjNumber}) from this competition?`}
          destructive
          onConfirm={() => handleRemove(row.id)}
          trigger={
            <Button variant="ghost" size="sm" className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          }
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Register Judges */}
      <SectionCard.Root>
        <SectionCard.Header title="Register Judges" />
        <SectionCard.Body>
          <JudgeImportForm onImported={handleImported} />
        </SectionCard.Body>
      </SectionCard.Root>

      {/* Registered Judges Table */}
      <SectionCard.Root>
        <SectionCard.Header
          title="Registered Judges"
          actions={
            <span className="text-sm text-muted-foreground">
              {roster.length} judge{roster.length !== 1 ? "s" : ""}
            </span>
          }
        />
        <SectionCard.Body>
          {removeError && (
            <p className="mb-3 text-sm text-destructive">{removeError}</p>
          )}
          <DataTable
            columns={columns}
            data={roster}
            loading={isPending}
            emptyState={
              <p className="py-8 text-center text-sm text-muted-foreground">
                No judges registered yet. Use the form above to register judges
                for this competition.
              </p>
            }
          />
        </SectionCard.Body>
      </SectionCard.Root>
    </div>
  );
}
