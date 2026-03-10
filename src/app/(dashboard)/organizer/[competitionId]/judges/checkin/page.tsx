import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/shared/lib/auth";
import type { Session } from "next-auth";
import { PageHeader } from "@/shared/components/common/PageHeader";
import {
  getCompetitionById,
  getCompetitionRoster,
  CheckInTab,
} from "@features/competition";

export const metadata: Metadata = {
  title: "Judge Check-In | BBQ Judge",
};

export default async function JudgeCheckInPage({
  params,
}: {
  params: { competitionId: string };
}) {
  const session = (await auth()) as Session | null;
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ORGANIZER") redirect("/login");

  const competition = await getCompetitionById(params.competitionId);
  if (!competition) redirect("/organizer");

  const roster = await getCompetitionRoster(params.competitionId);

  return (
    <div className="space-y-6">
      <PageHeader title="Judge Check-In" />
      <CheckInTab
        competitionId={params.competitionId}
        judgePin={competition.judgePin}
        roster={roster}
        showTables={false}
      />
    </div>
  );
}
