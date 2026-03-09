import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Competitors | BBQ Judge",
};
import { PageHeader } from "@/shared/components/common/PageHeader";
import {
  CompetitorListRoot,
  CompetitorListAddForm,
  CompetitorListTable,
  CommentCardToggle,
  getCompetitionById,
} from "@features/competition";

interface Props {
  params: { competitionId: string };
}

export default async function CompetitorsPage({ params }: Props) {
  const competition = await getCompetitionById(params.competitionId);
  if (!competition) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Competitors"
        subtitle={competition.name}
      />

      <CompetitorListRoot
        competitionId={competition.id}
        competitors={competition.competitors}
      >
        <CompetitorListAddForm />
        <CompetitorListTable />
      </CompetitorListRoot>

      {/* Settings */}
      <CommentCardToggle
        competitionId={competition.id}
        enabled={competition.commentCardsEnabled}
      />
    </div>
  );
}
