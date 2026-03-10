import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/shared/lib/auth";
import type { Session } from "next-auth";
import { PageHeader } from "@/shared/components/common/PageHeader";
import {
  getCompetitionById,
  CompetitorListRoot,
  CompetitorListTable,
} from "@features/competition";

export const metadata: Metadata = {
  title: "Team Check-In | BBQ Judge",
};

export default async function TeamCheckInPage({
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
      <PageHeader title="Team Check-In" />
      <CompetitorListRoot
        competitionId={competition.id}
        competitors={competition.competitors}
      >
        <CompetitorListTable showCheckIn={true} />
      </CompetitorListRoot>
    </div>
  );
}
