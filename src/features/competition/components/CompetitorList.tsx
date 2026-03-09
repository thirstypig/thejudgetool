"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Users, Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
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
import { addCompetitor } from "../actions";
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
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [showForm, setShowForm] = React.useState(false);

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
        err instanceof Error ? err.message : "Failed to add competitor"
      );
    }
  }

  return (
    <SectionCard.Root>
      <SectionCard.Header
        title="Add Competitor"
        actions={
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
    </SectionCard.Root>
  );
}

// --- Table ---

const columns: ColumnDef<Competitor>[] = [
  { header: "#", accessorKey: "anonymousNumber", className: "w-20 font-mono" },
  { header: "Team Name", accessorKey: "teamName" },
  { header: "Head Cook", accessorKey: "headCookName" },
  { header: "KCBS #", accessorKey: "headCookKcbsNumber", className: "font-mono" },
];

function CompetitorTable() {
  const { competitors } = React.useContext(CompetitorListContext);

  return (
    <SectionCard.Root>
      <SectionCard.Header
        title="Competitors"
        actions={
          <span className="text-sm text-muted-foreground">
            {competitors.length} competitor{competitors.length !== 1 ? "s" : ""}
          </span>
        }
      />
      <SectionCard.Body>
        <DataTable
          columns={columns}
          data={competitors}
          striped
          emptyState={
            <EmptyState
              icon={Users}
              title="No competitors yet"
              description="Add competitors above to get started."
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

// Keep these for backward compat but they're no longer used
export const CompetitorListHeader = () => null;
