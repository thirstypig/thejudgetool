import type { Metadata } from "next";
import { auth } from "@/shared/lib/auth";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import {
  getJudgeSetupState,
  getJudgeSession,
  getActiveCompetitionForJudge,
  SeatSelectionScreen,
  TableSetupScreen,
} from "@features/judging";
import { JudgeDashboardClient } from "./JudgeDashboardClient";

export const metadata: Metadata = {
  title: "My Scorecards | BBQ Judge",
};

export default async function JudgePage() {
  const session = (await auth()) as Session | null;
  const role = (session?.user as { role?: string } | undefined)?.role;
  const cbjNumber = (session?.user as { cbjNumber?: string } | undefined)
    ?.cbjNumber;

  if (!session?.user || (role !== "JUDGE" && role !== "TABLE_CAPTAIN")) {
    redirect("/login");
  }
  if (!cbjNumber) redirect("/login");

  const judgeName = session.user.name ?? cbjNumber;

  // Check setup state (registration → table → seat → ready)
  const setupState = await getJudgeSetupState();
  const competition = await getActiveCompetitionForJudge();

  const competitionInfo = competition
    ? {
        name: competition.name,
        date: competition.date.toISOString(),
        location: competition.location,
      }
    : undefined;

  switch (setupState.phase) {
    case "not-registered": {
      // Fall back to legacy flow: check for direct table assignment
      const judgeSession = await getJudgeSession();
      if (judgeSession) {
        return (
          <JudgeDashboardClient cbjNumber={cbjNumber} judgeName={judgeName} competitionInfo={competitionInfo} />
        );
      }
      // No registration and no legacy assignment — show table setup
      if (!competition) {
        return (
          <div className="flex min-h-[80vh] items-center justify-center">
            <p className="text-lg text-muted-foreground">
              No active competition found.
            </p>
          </div>
        );
      }
      return (
        <TableSetupScreen
          judgeName={judgeName}
          competitionId={competition.id}
          competitionName={competition.name}
        />
      );
    }

    case "awaiting-table":
      return (
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
          <div className="w-full max-w-sm space-y-4 text-center">
            <h1 className="text-2xl font-bold">Welcome, {judgeName}</h1>
            <p className="text-muted-foreground">{setupState.competitionName}</p>
            <div className="rounded-lg border border-dashed p-6">
              <p className="text-lg font-medium">Waiting for table assignment</p>
              <p className="mt-2 text-sm text-muted-foreground">
                The organizer will assign you to a table. This page will update
                automatically.
              </p>
            </div>
          </div>
        </div>
      );

    case "pick-seat":
      return (
        <SeatSelectionScreen
          judgeName={judgeName}
          assignmentId={setupState.assignmentId}
          tableNumber={setupState.tableNumber}
          competitionName={setupState.competitionName}
          takenSeats={setupState.takenSeats}
        />
      );

    case "ready":
      return (
        <JudgeDashboardClient cbjNumber={cbjNumber} judgeName={judgeName} competitionInfo={competitionInfo} />
      );
  }
}
