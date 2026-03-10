import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/shared/lib/auth";
import type { Session } from "next-auth";
import { PageHeader } from "@/shared/components/common/PageHeader";
import {
  getCompetitionById,
  BoxDistributionPanel,
} from "@features/competition";

export const metadata: Metadata = {
  title: "Box Distribution | BBQ Judge",
};

export default async function BoxDistributionPage({
  params,
}: {
  params: { competitionId: string };
}) {
  const session = (await auth()) as Session | null;
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ORGANIZER") redirect("/login");

  const competition = await getCompetitionById(params.competitionId);
  if (!competition) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title="Box Distribution" />
      <BoxDistributionPanel
        competitionId={competition.id}
        distributionStatus={competition.distributionStatus}
        tableCount={competition.tables.length}
        competitorCount={competition.competitors.length}
        competitionName={competition.name}
      />
    </div>
  );
}
