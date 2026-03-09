"use server";

import { prisma } from "@/shared/lib/prisma";
import { requireAuth, requireCaptain } from "@/shared/lib/auth-guards";
import { revalidatePath } from "next/cache";
import type {
  TableScoringStatus,
  ScoreCardWithJudge,
  CorrectionRequestWithDetails,
} from "../types";

// --- Get Table Scoring Status ---

export async function getTableScoringStatus(
  tableId: string,
  categoryRoundId: string
): Promise<TableScoringStatus> {
  await requireAuth();
  const table = await prisma.table.findUniqueOrThrow({
    where: { id: tableId },
    select: { id: true, tableNumber: true },
  });

  const categoryRound = await prisma.categoryRound.findUniqueOrThrow({
    where: { id: categoryRoundId },
    select: { id: true, categoryName: true },
  });

  // Get all submissions for this table + category
  const submissions = await prisma.submission.findMany({
    where: { tableId, categoryRoundId },
    select: { id: true },
  });
  const submissionIds = submissions.map((s) => s.id);

  // Get all judge assignments for this table
  const assignments = await prisma.tableAssignment.findMany({
    where: { tableId },
    include: {
      user: { select: { id: true, name: true, cbjNumber: true } },
    },
    orderBy: { seatNumber: "asc" },
  });

  // For each judge, count submitted scorecards
  const judges = await Promise.all(
    assignments.map(async (a) => {
      const submittedCount = await prisma.scoreCard.count({
        where: {
          submissionId: { in: submissionIds },
          judgeId: a.userId,
          locked: true,
        },
      });

      return {
        judge: a.user,
        seatNumber: a.seatNumber,
        submittedCount,
        totalCount: submissions.length,
        allSubmitted: submittedCount >= submissions.length,
      };
    })
  );

  const totalScoreCards = assignments.length * submissions.length;
  const submittedScoreCards = judges.reduce(
    (sum, j) => sum + j.submittedCount,
    0
  );

  return {
    tableId: table.id,
    tableNumber: table.tableNumber,
    categoryRoundId: categoryRound.id,
    categoryName: categoryRound.categoryName,
    judges,
    allJudgesDone: judges.every((j) => j.allSubmitted),
    totalScoreCards,
    submittedScoreCards,
  };
}

// --- Get Table Score Cards ---

export async function getTableScoreCards(
  tableId: string,
  categoryRoundId: string
): Promise<ScoreCardWithJudge[]> {
  await requireAuth();
  const scoreCards = await prisma.scoreCard.findMany({
    where: {
      submission: { tableId, categoryRoundId },
    },
    include: {
      judge: { select: { id: true, name: true, cbjNumber: true } },
      submission: {
        select: {
          id: true,
          boxNumber: true,
          boxCode: true,
          competitor: { select: { id: true, anonymousNumber: true } },
          categoryRound: { select: { id: true, categoryName: true } },
        },
      },
    },
    orderBy: [
      { submission: { boxNumber: "asc" } },
      { judge: { cbjNumber: "asc" } },
    ],
  });

  return scoreCards as ScoreCardWithJudge[];
}

// --- Get Pending Correction Requests ---

export async function getPendingCorrectionRequests(
  tableId: string
): Promise<CorrectionRequestWithDetails[]> {
  await requireAuth();
  const requests = await prisma.correctionRequest.findMany({
    where: {
      status: "PENDING",
      scoreCard: {
        submission: { tableId },
      },
    },
    include: {
      judge: { select: { id: true, name: true, cbjNumber: true } },
      scoreCard: {
        include: {
          submission: {
            select: {
              id: true,
              boxNumber: true,
              boxCode: true,
              competitor: { select: { id: true, anonymousNumber: true } },
            },
          },
        },
      },
    },
    orderBy: { id: "desc" },
  });

  return requests as CorrectionRequestWithDetails[];
}

// --- Approve Correction Request ---

export async function approveCorrectionRequest(
  requestId: string
) {
  const { userId: captainId } = await requireCaptain();

  const request = await prisma.correctionRequest.findUniqueOrThrow({
    where: { id: requestId },
    include: { scoreCard: true },
  });

  if (request.status !== "PENDING") {
    throw new Error("This correction request has already been resolved");
  }

  // Unlock the score card and update correction status
  const [correction] = await prisma.$transaction([
    prisma.correctionRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        decidedBy: captainId,
        decidedAt: new Date(),
      },
    }),
    prisma.scoreCard.update({
      where: { id: request.scoreCardId },
      data: { locked: false },
    }),
  ]);

  revalidatePath("/captain");
  revalidatePath("/judge");
  return correction;
}

// --- Deny Correction Request ---

export async function denyCorrectionRequest(
  requestId: string
) {
  const { userId: captainId } = await requireCaptain();

  const request = await prisma.correctionRequest.findUniqueOrThrow({
    where: { id: requestId },
  });

  if (request.status !== "PENDING") {
    throw new Error("This correction request has already been resolved");
  }

  const correction = await prisma.correctionRequest.update({
    where: { id: requestId },
    data: {
      status: "DENIED",
      decidedBy: captainId,
      decidedAt: new Date(),
    },
  });

  revalidatePath("/captain");
  return correction;
}

// --- Submit Category to Organizer (BR-6) ---

export async function submitCategoryToOrganizer(
  tableId: string,
  categoryRoundId: string
) {
  const { userId: captainId } = await requireCaptain();

  // Verify all judges have submitted all scorecards
  const status = await getTableScoringStatus(tableId, categoryRoundId);
  if (!status.allJudgesDone) {
    const blocking = status.judges
      .filter((j) => !j.allSubmitted)
      .map((j) => `${j.judge.name} (${j.submittedCount}/${j.totalCount})`);
    throw new Error(
      `Cannot submit: waiting on judges — ${blocking.join(", ")}`
    );
  }

  // Check for pending correction requests
  const pendingRequests = await getPendingCorrectionRequests(tableId);
  if (pendingRequests.length > 0) {
    throw new Error(
      `Cannot submit: ${pendingRequests.length} pending correction request(s) must be resolved first`
    );
  }

  // Get competition ID for audit log
  const table = await prisma.table.findUniqueOrThrow({
    where: { id: tableId },
    select: { competitionId: true },
  });

  // Log to audit
  await prisma.auditLog.create({
    data: {
      competitionId: table.competitionId,
      actorId: captainId,
      action: "SUBMIT_CATEGORY",
      entityId: categoryRoundId,
      entityType: "CategoryRound",
    },
  });

  revalidatePath("/captain");
  revalidatePath(`/organizer`);
}
