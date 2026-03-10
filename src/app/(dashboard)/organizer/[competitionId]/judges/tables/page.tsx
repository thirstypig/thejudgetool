import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/shared/lib/auth";
import type { Session } from "next-auth";
import { PageHeader } from "@/shared/components/common/PageHeader";
import {
  getCompetitionById,
  TableSetupPanelRoot,
  TableSetupPanelTableCard,
  TableSetupPanelAssignForm,
  CommentCardToggle,
} from "@features/competition";

export const metadata: Metadata = {
  title: "Tables | BBQ Judge",
};

export default async function TablesPage({
  params,
}: {
  params: { competitionId: string };
}) {
  const session = (await auth()) as Session | null;
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ORGANIZER") redirect("/login");

  const competition = await getCompetitionById(params.competitionId);
  if (!competition) redirect("/organizer");

  return (
    <div className="space-y-6">
      <PageHeader title="Tables" />

      {/* Comment Cards Toggle */}
      <CommentCardToggle
        competitionId={competition.id}
        enabled={competition.commentCardsEnabled}
      />

      <TableSetupPanelRoot
        competitionId={competition.id}
        tables={competition.tables}
      >
        {competition.tables.map((table) => (
          <TableSetupPanelTableCard
            key={table.id}
            tableNumber={table.tableNumber}
          >
            <TableSetupPanelAssignForm tableNumber={table.tableNumber} />
          </TableSetupPanelTableCard>
        ))}
      </TableSetupPanelRoot>
    </div>
  );
}
