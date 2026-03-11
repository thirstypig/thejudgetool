"use server";

import { prisma } from "@/shared/lib/prisma";
import { requireAuth, requireOrganizer } from "@/shared/lib/auth-guards";
import { revalidatePath } from "next/cache";
import {
  CATEGORY_STATUS,
  COMPETITION_STATUS,
} from "@/shared/constants/kcbs";

// --- Advance Category Round (BR-1) ---

export async function advanceCategoryRound(competitionId: string) {
  await requireOrganizer();

  const rounds = await prisma.categoryRound.findMany({
    where: { competitionId },
    orderBy: { order: "asc" },
  });

  const activeRound = rounds.find((r) => r.status === CATEGORY_STATUS.ACTIVE);
  if (activeRound) {
    // Count how many tables have/haven't submitted
    const allTables = await prisma.table.findMany({
      where: { competitionId },
      select: { id: true, tableNumber: true },
    });
    const submitLogs = await prisma.auditLog.findMany({
      where: {
        competitionId,
        action: "SUBMIT_CATEGORY",
        entityType: "CategoryRound",
        entityId: { startsWith: `${activeRound.id}:` },
      },
    });
    const submittedTableIds = new Set(
      submitLogs.map((log) => log.entityId.split(":")[1])
    );
    const pending = allTables.filter((t) => !submittedTableIds.has(t.id));
    const submitted = allTables.length - pending.length;

    throw new Error(
      `"${activeRound.categoryName}" is still active. ${submitted}/${allTables.length} tables have submitted. Waiting on table(s): ${pending.map((t) => t.tableNumber).join(", ")}.`
    );
  }

  const nextPending = rounds.find(
    (r) => r.status === CATEGORY_STATUS.PENDING
  );
  if (!nextPending) {
    await prisma.competition.update({
      where: { id: competitionId },
      data: { status: COMPETITION_STATUS.CLOSED },
    });
    revalidatePath(`/organizer/${competitionId}/competition`);
    return null;
  }

  const [round] = await prisma.$transaction([
    prisma.categoryRound.update({
      where: { id: nextPending.id },
      data: { status: CATEGORY_STATUS.ACTIVE },
    }),
    prisma.competition.update({
      where: { id: competitionId },
      data: { status: COMPETITION_STATUS.ACTIVE },
    }),
  ]);

  revalidatePath(`/organizer/${competitionId}/competition`);
  return round;
}

// --- Mark Category Round Submitted (if all tables done) ---

export async function markCategoryRoundSubmittedIfReady(
  competitionId: string,
  categoryRoundId: string,
  tableId: string
) {
  const session = await requireAuth();
  const captainId = (session.user as { id: string }).id;

  // Verify the caller is the captain of this table
  const table = await prisma.table.findUniqueOrThrow({
    where: { id: tableId },
    select: { captainId: true },
  });
  if (table.captainId !== captainId) {
    throw new Error("Only the table captain can submit a category");
  }

  await prisma.$transaction(async (tx) => {
    // Create audit log inside transaction for atomicity
    await tx.auditLog.create({
      data: {
        competitionId,
        actorId: captainId,
        action: "SUBMIT_CATEGORY",
        entityId: `${categoryRoundId}:${tableId}`,
        entityType: "CategoryRound",
      },
    });

    // Check if all tables have now submitted
    const allTables = await tx.table.findMany({
      where: { competitionId },
      select: { id: true },
    });

    const submitLogs = await tx.auditLog.findMany({
      where: {
        competitionId,
        action: "SUBMIT_CATEGORY",
        entityType: "CategoryRound",
        entityId: { startsWith: `${categoryRoundId}:` },
      },
    });

    const submittedTableIds = new Set(
      submitLogs.map((log) => log.entityId.split(":")[1])
    );
    const allSubmitted = allTables.every((t) => submittedTableIds.has(t.id));

    if (allSubmitted) {
      await tx.categoryRound.updateMany({
        where: { id: categoryRoundId, status: "ACTIVE" },
        data: { status: "SUBMITTED" },
      });
    }
  });
}

// --- Toggle Comment Cards ---

export async function toggleCommentCards(
  competitionId: string,
  enabled: boolean
) {
  await requireOrganizer();

  await prisma.competition.update({
    where: { id: competitionId },
    data: { commentCardsEnabled: enabled },
  });

  revalidatePath(`/organizer/${competitionId}/teams`);
}
