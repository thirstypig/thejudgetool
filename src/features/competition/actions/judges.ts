"use server";

import { prisma } from "@/shared/lib/prisma";
import { requireAuth, requireOrganizer } from "@/shared/lib/auth-guards";
import { revalidatePath } from "next/cache";
import type { CompetitionJudgeWithUser } from "../types";

// --- Generate Judge PIN ---

export async function generateJudgePin(competitionId: string) {
  await requireOrganizer();

  const pin = String(Math.floor(1000 + Math.random() * 9000)); // 4-digit

  // Atomic: only update if not locked (prevents TOCTOU race)
  const result = await prisma.competition.updateMany({
    where: { id: competitionId, judgePinLocked: false },
    data: { judgePin: pin },
  });
  if (result.count === 0) {
    // Check if competition exists vs is locked
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: { judgePinLocked: true },
    });
    if (!competition) throw new Error("Competition not found");
    throw new Error("PIN is locked. Unlock it before regenerating.");
  }

  revalidatePath(`/organizer/${competitionId}/judges`);
  return pin;
}

// --- Toggle Judge PIN Lock ---

export async function togglePinLock(competitionId: string, locked: boolean) {
  await requireOrganizer();

  // Verify competition exists (consistent with other actions)
  await prisma.competition.findUniqueOrThrow({ where: { id: competitionId } });

  await prisma.competition.update({
    where: { id: competitionId },
    data: { judgePinLocked: locked },
  });

  revalidatePath(`/organizer/${competitionId}/judges`);
}

// --- Register Judge for Competition ---

export async function registerJudgeForCompetition(
  competitionId: string,
  userId: string
) {
  await requireOrganizer();

  const existing = await prisma.competitionJudge.findUnique({
    where: { competitionId_userId: { competitionId, userId } },
  });
  if (existing) return existing;

  const registration = await prisma.competitionJudge.create({
    data: { competitionId, userId },
  });

  revalidatePath(`/organizer/${competitionId}/judges`);
  return registration;
}

// --- Register Judges Bulk for Competition ---

export async function registerJudgesBulkForCompetition(
  competitionId: string,
  userIds: string[]
) {
  await requireOrganizer();

  if (userIds.length > 100) {
    throw new Error("Cannot register more than 100 judges at once");
  }

  const beforeCount = await prisma.competitionJudge.count({ where: { competitionId } });

  await prisma.competitionJudge.createMany({
    data: userIds.map((userId) => ({ competitionId, userId })),
    skipDuplicates: true,
  });

  const afterCount = await prisma.competitionJudge.count({ where: { competitionId } });

  revalidatePath(`/organizer/${competitionId}/judges`);
  return { registered: afterCount - beforeCount };
}

// --- Get Competition Roster ---

export async function getCompetitionRoster(
  competitionId: string
): Promise<CompetitionJudgeWithUser[]> {
  await requireAuth();
  const registrations = await prisma.competitionJudge.findMany({
    where: { competitionId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          cbjNumber: true,
          email: true,
          role: true,
          tableAssignments: {
            where: { table: { competitionId } },
            include: {
              table: { select: { tableNumber: true } },
            },
            take: 1,
          },
        },
      },
    },
    orderBy: { user: { cbjNumber: "asc" } },
  });

  return registrations.map((reg) => {
    const assignment = reg.user.tableAssignments[0];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tableAssignments, ...userWithoutAssignments } = reg.user;
    return {
      ...reg,
      user: userWithoutAssignments,
      tableAssignment: assignment
        ? {
            tableNumber: assignment.table.tableNumber,
            seatNumber: assignment.seatNumber,
          }
        : null,
    };
  });
}

// --- Check In Judge ---

export async function checkInJudge(competitionJudgeId: string) {
  await requireOrganizer();

  // Verify registration exists (prevents blind IDOR)
  const registration = await prisma.competitionJudge.findUniqueOrThrow({
    where: { id: competitionJudgeId },
    select: { competitionId: true },
  });

  await prisma.competitionJudge.update({
    where: { id: competitionJudgeId },
    data: { checkedIn: true, checkedInAt: new Date() },
  });

  revalidatePath(`/organizer/${registration.competitionId}`);
}

// --- Uncheck In Judge ---

export async function uncheckInJudge(competitionJudgeId: string) {
  await requireOrganizer();

  // Verify registration exists (prevents blind IDOR)
  const registration = await prisma.competitionJudge.findUniqueOrThrow({
    where: { id: competitionJudgeId },
    select: { competitionId: true },
  });

  await prisma.competitionJudge.update({
    where: { id: competitionJudgeId },
    data: { checkedIn: false, checkedInAt: null },
  });

  revalidatePath(`/organizer/${registration.competitionId}`);
}

// --- Unregister Judge from Competition ---

export async function unregisterJudgeFromCompetition(
  competitionJudgeId: string
) {
  await requireOrganizer();

  const registration = await prisma.competitionJudge.findUnique({
    where: { id: competitionJudgeId },
  });

  if (!registration) throw new Error("Registration not found");

  // Check if judge has score cards in this competition
  const scoreCards = await prisma.scoreCard.findFirst({
    where: {
      judgeId: registration.userId,
      submission: {
        categoryRound: { competitionId: registration.competitionId },
      },
    },
  });

  if (scoreCards) {
    throw new Error(
      "Cannot remove a judge who has submitted score cards. Delete their scores first."
    );
  }

  // Remove table assignment and registration atomically
  await prisma.$transaction([
    prisma.tableAssignment.deleteMany({
      where: {
        userId: registration.userId,
        table: { competitionId: registration.competitionId },
      },
    }),
    prisma.competitionJudge.delete({
      where: { id: competitionJudgeId },
    }),
  ]);

  revalidatePath(`/organizer/${registration.competitionId}/judges`);
}
