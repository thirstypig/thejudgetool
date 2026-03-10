"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Users, Plus, CheckCircle, XCircle, Upload } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import {
  DataTable,
  type ColumnDef,
} from "@/shared/components/common/DataTable";
import { EmptyState } from "@/shared/components/common/EmptyState";
import { SectionCard } from "@/shared/components/common/SectionCard";
import {
  competitorSchema,
  type CompetitorSchemaType,
} from "../schemas";
import { addCompetitor, addCompetitorsBulk, checkInTeam, uncheckInTeam } from "../actions";
import type { Competitor } from "@prisma/client";

// --- Context ---

const CompetitorListContext = React.createContext<{
  competitionId: string;
  competitors: Competitor[];
}>({
  competitionId: "",
  competitors: [],
});

// --- Root ---

function Root({
  competitionId,
  competitors,
  children,
}: {
  competitionId: string;
  competitors: Competitor[];
  children: React.ReactNode;
}) {
  return (
    <CompetitorListContext.Provider value={{ competitionId, competitors }}>
      <div className="space-y-6">{children}</div>
    </CompetitorListContext.Provider>
  );
}

// --- Add Form (shown at top) ---

function AddForm() {
  const { competitionId } = React.useContext(CompetitorListContext);
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [csvUploading, setCsvUploading] = React.useState(false);
  const [csvResult, setCsvResult] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CompetitorSchemaType>({
    resolver: zodResolver(competitorSchema),
  });

  async function onSubmit(data: CompetitorSchemaType) {
    try {
      setServerError(null);
      await addCompetitor(competitionId, data);
      reset();
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Failed to add team"
      );
    }
  }

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvUploading(true);
    setServerError(null);
    setCsvResult(null);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      // Skip header if it looks like one
      const startIdx = lines[0]?.toLowerCase().includes("team") ? 1 : 0;
      const teams: { anonymousNumber: string; teamName: string; headCookName?: string; headCookKcbsNumber?: string }[] = [];
      for (let i = startIdx; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        if (cols.length < 2) continue;
        teams.push({
          anonymousNumber: cols[0],
          teamName: cols[1],
          headCookName: cols[2] || undefined,
          headCookKcbsNumber: cols[3] || undefined,
        });
      }
      if (teams.length === 0) {
        setServerError("No valid rows found in CSV. Expected: Number, Team Name, Head Cook (optional), KCBS # (optional)");
        return;
      }
      const result = await addCompetitorsBulk(competitionId, teams);
      setCsvResult(`Added ${result.added} team${result.added !== 1 ? "s" : ""}${result.skipped > 0 ? `, ${result.skipped} skipped (duplicate #)` : ""}`);
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Failed to import CSV");
    } finally {
      setCsvUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <SectionCard.Root>
      <SectionCard.Header
        title="Add BBQ Team"
        actions={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={csvUploading}
            >
              <Upload className="mr-1 h-4 w-4" />
              {csvUploading ? "Importing..." : "Import CSV"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCsvUpload}
            />
            <Button
              size="sm"
              variant={showForm ? "outline" : "default"}
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? "Cancel" : (
                <>
                  <Plus className="mr-1 h-4 w-4" />
                  Add
                </>
              )}
            </Button>
          </div>
        }
      />
      {showForm && (
        <SectionCard.Body>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="flex items-end gap-3">
              <div className="space-y-1">
                <Label htmlFor="anonymousNumber"># Number</Label>
                <Input
                  id="anonymousNumber"
                  placeholder="101"
                  className="w-24 font-mono"
                  {...register("anonymousNumber")}
                />
                {errors.anonymousNumber && (
                  <p className="text-xs text-destructive">
                    {errors.anonymousNumber.message}
                  </p>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  placeholder="Smokin' Aces"
                  {...register("teamName")}
                />
                {errors.teamName && (
                  <p className="text-xs text-destructive">
                    {errors.teamName.message}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1">
                <Label htmlFor="headCookName">Head Cook (optional)</Label>
                <Input
                  id="headCookName"
                  placeholder="Name"
                  {...register("headCookName")}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="headCookKcbsNumber">KCBS # (optional)</Label>
                <Input
                  id="headCookKcbsNumber"
                  placeholder="KCBS #"
                  className="w-28 font-mono"
                  {...register("headCookKcbsNumber")}
                />
              </div>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add"}
              </Button>
            </div>
          </form>
          {serverError && (
            <p className="mt-2 text-sm text-destructive">{serverError}</p>
          )}
        </SectionCard.Body>
      )}
      {!showForm && (serverError || csvResult) && (
        <SectionCard.Body>
          {serverError && <p role="alert" className="text-sm text-destructive">{serverError}</p>}
          {csvResult && <p className="text-sm text-green-600 dark:text-green-400">{csvResult}</p>}
        </SectionCard.Body>
      )}
    </SectionCard.Root>
  );
}

// --- Table ---

function CompetitorTable({ showCheckIn = true }: { showCheckIn?: boolean }) {
  const { competitors } = React.useContext(CompetitorListContext);
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const checkedInCount = competitors.filter((c) => c.checkedIn).length;

  function handleToggleCheckIn(competitor: Competitor) {
    startTransition(async () => {
      if (competitor.checkedIn) {
        await uncheckInTeam(competitor.id);
      } else {
        await checkInTeam(competitor.id);
      }
      router.refresh();
    });
  }

  const columns: ColumnDef<Competitor>[] = [
    { header: "#", accessorKey: "anonymousNumber", className: "w-20 font-mono" },
    { header: "Team Name", accessorKey: "teamName" },
    { header: "Head Cook", accessorKey: "headCookName" },
    { header: "KCBS #", accessorKey: "headCookKcbsNumber", className: "font-mono" },
    ...(showCheckIn
      ? [
          {
            header: "Check-In",
            cell: (row: Competitor) => (
              <div className="flex items-center gap-2">
                <Badge variant={row.checkedIn ? "default" : "secondary"}>
                  {row.checkedIn ? "Checked In" : "Not Checked In"}
                </Badge>
                {row.checkedIn && row.checkedInAt && (
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(row.checkedInAt), "h:mm a")}
                  </span>
                )}
              </div>
            ),
          },
          {
            header: "",
            cell: (row: Competitor) => (
              <Button
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={() => handleToggleCheckIn(row)}
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
        ]
      : []),
  ];

  return (
    <SectionCard.Root>
      <SectionCard.Header
        title="BBQ Teams"
        actions={
          showCheckIn ? (
            <span className="text-sm text-muted-foreground">
              {checkedInCount} / {competitors.length} teams checked in
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">
              {competitors.length} team{competitors.length !== 1 ? "s" : ""}
            </span>
          )
        }
      />
      <SectionCard.Body>
        <DataTable
          columns={columns}
          data={competitors}
          striped
          searchFn={(item, q) =>
            item.anonymousNumber.includes(q) ||
            item.teamName.toLowerCase().includes(q) ||
            (item.headCookName?.toLowerCase().includes(q) ?? false)
          }
          emptyState={
            <EmptyState
              icon={Users}
              title="No teams yet"
              description="Add BBQ teams above to get started."
            />
          }
        />
      </SectionCard.Body>
    </SectionCard.Root>
  );
}

// --- Named Exports (RSC-safe) ---

export const CompetitorListRoot = Root;
export const CompetitorListAddForm = AddForm;
export const CompetitorListTable = CompetitorTable;

