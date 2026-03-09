import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/shared/lib/auth";
import type { Session } from "next-auth";
import { PageHeader } from "@/shared/components/common/PageHeader";
import {
  getCompetitionById,
  getCompetitionRoster,
  JudgeManagementTabs,
} from "@features/competition";

export const metadata: Metadata = {
  title: "Judges | BBQ Judge",
};

export default async function JudgesPage({
  params,
}: {
  params: { competitionId: string };
}) {
  const session = (await auth()) as Session | null;
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ORGANIZER") {
    redirect("/login");
  }

  const competition = await getCompetitionById(params.competitionId);
  if (!competition) {
    redirect("/organizer");
  }

  const roster = await getCompetitionRoster(params.competitionId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Judges"
        subtitle={competition.name}
      />
      <JudgeManagementTabs
        competitionId={params.competitionId}
        judgePin={competition.judgePin}
        roster={roster}
      />
    </div>
  );
}
