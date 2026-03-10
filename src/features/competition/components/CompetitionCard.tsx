"use client";

import Link from "next/link";
import { format } from "date-fns";
import { MapPin, Calendar, Users, LayoutGrid } from "lucide-react";
import { SectionCard } from "@/shared/components/common/SectionCard";
import { StatusBadge } from "@/shared/components/common/StatusBadge";
import { Button } from "@/shared/components/ui/button";
import type { Competition, CategoryRound } from "@prisma/client";

interface CompetitionCardProps {
  competition: Competition & {
    _count: { competitors: number; tables: number };
    categoryRounds: CategoryRound[];
  };
}

function mapStatus(status: string) {
  const map: Record<string, "pending" | "active" | "closed"> = {
    SETUP: "pending",
    ACTIVE: "active",
    CLOSED: "closed",
  };
  return map[status] ?? "pending";
}

export function CompetitionCard({ competition }: CompetitionCardProps) {
  const activeRound = competition.categoryRounds.find(
    (r) => r.status === "ACTIVE"
  );

  return (
    <SectionCard.Root>
      <SectionCard.Header
        title={competition.name}
        actions={<StatusBadge status={mapStatus(competition.status)} />}
      />
      <SectionCard.Body className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {format(new Date(competition.date), "PPP")}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {competition.location}
        </div>
        <div className="flex gap-4">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-4 w-4" />
            {competition._count.competitors} teams
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <LayoutGrid className="h-4 w-4" />
            {competition._count.tables} tables
          </span>
        </div>
        {activeRound && (
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
            Now judging: {activeRound.categoryName}
          </p>
        )}
      </SectionCard.Body>
      <SectionCard.Footer className="flex gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href={`/organizer/${competition.id}/setup`}>Setup</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={`/organizer/${competition.id}/status`}>Status</Link>
        </Button>
      </SectionCard.Footer>
    </SectionCard.Root>
  );
}
