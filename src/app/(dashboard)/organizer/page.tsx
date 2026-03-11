import type { Metadata } from "next";
import { Trophy } from "lucide-react";

export const metadata: Metadata = {
  title: "Competitions | The Judge Tool",
};
import { PageHeader } from "@/shared/components/common/PageHeader";
import { EmptyState } from "@/shared/components/common/EmptyState";
import {
  CompetitionCard,
  CreateCompetitionSection,
  getCompetitions,
} from "@features/competition";

export default async function OrganizerPage() {
  const competitions = await getCompetitions();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Competitions"
        subtitle="Manage your BBQ competitions"
      />

      <CreateCompetitionSection />

      {competitions.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No competitions yet"
          description="Create your first competition to get started."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {competitions.map((comp) => (
            <CompetitionCard key={comp.id} competition={comp} />
          ))}
        </div>
      )}
    </div>
  );
}
