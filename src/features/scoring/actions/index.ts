"use server";

import { prisma } from "@/shared/lib/prisma";
import { requireAuth, requireCaptain } from "@/shared/lib/auth-guards";
import { revalidatePath } from "next/cache";
import { markCategoryRoundSubmittedIfReady } from "@features/competition";
import type {
  TableScoringStatus,
  ScoreCardWithJudge,
  CommentCardWithJudge,
  CorrectionRequestWithDetails,
} from "../types";

// --- Get Table Scoring Status ---

export async function getTableScoringStatus(
  tableId: string,
  categoryRoundId: string
): Promise<TableScoringStatus> {
  const { userId } = await requireCaptain();
  const table = await prisma.table.findUniqueOrThrow({
    where: { id: tableId },
    select: { id: true, tableNumber: true, captainId: true },
  });

  // Organizers can view any table; captains only their own
  const session = await prisma.table.findFirst({
    where: { id: tableId, captainId: userId },
    select: { id: true },
  });
  const isOrganizer = !!(await prisma.user.findFirst({
    where: { id: userId, role: "ORGANIZER" },
    select: { id: true },
  }));
  if (!session && !isOrganizer) {
    throw new Error("You can only view scoring status for your own table");
  }

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

  // Count submitted scorecards per judge in a single query
  const scoreCardCounts = await prisma.scoreCard.groupBy({
    by: ["judgeId"],
    where: {
      submissionId: { in: submissionIds },
      locked: true,
    },
    _count: { id: true },
  });

  const countByJudge = new Map(
    scoreCardCounts.map((c) => [c.judgeId, c._count.id])
  );

  const judges = assignments.map((a) => {
    const submittedCount = countByJudge.get(a.userId) ?? 0;
    return {
      judge: a.user,
      seatNumber: a.seatNumber,
      submittedCount,
      totalCount: submissions.length,
      allSubmitted: submittedCount >= submissions.length,
    };
  });

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
  const { userId } = await requireCaptain();

  // Verify captain owns this table (organizers also allowed)
  const table = await prisma.table.findUniqueOrThrow({
    where: { id: tableId },
    select: { captainId: true },
  });
  const isOrganizer = !!(await prisma.user.findFirst({
    where: { id: userId, role: "ORGANIZER" },
    select: { id: true },
  }));
  if (table.captainId !== userId && !isOrganizer) {
    throw new Error("You can only view score cards for your own table");
  }

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

  // TODO: replace with Prisma.GetPayload to tie type to query shape
  return scoreCards as ScoreCardWithJudge[];
}

// --- Get Pending Correction Requests ---

export async function getPendingCorrectionRequests(
  tableId: string
): Promise<CorrectionRequestWithDetails[]> {
  const { userId } = await requireCaptain();

  // Verify captain owns this table (organizers also allowed)
  const table = await prisma.table.findUniqueOrThrow({
    where: { id: tableId },
    select: { captainId: true },
  });
  const isOrganizer = !!(await prisma.user.findFirst({
    where: { id: userId, role: "ORGANIZER" },
    select: { id: true },
  }));
  if (table.captainId !== userId && !isOrganizer) {
    throw new Error("You can only view correction requests for your own table");
  }
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

  // TODO: replace with Prisma.GetPayload to tie type to query shape
  return requests as CorrectionRequestWithDetails[];
}

// --- Approve Correction Request ---

export async function approveCorrectionRequest(
  requestId: string
) {
  const { userId: captainId } = await requireCaptain();

  const request = await prisma.correctionRequest.findUniqueOrThrow({
    where: { id: requestId },
    include: { scoreCard: { include: { submission: { select: { tableId: true, categoryRound: { select: { competitionId: true } } } } } } },
  });

  // Verify captain owns this table
  const captainTable = await prisma.table.findFirst({
    where: { id: request.scoreCard.submission.tableId, captainId },
    select: { id: true },
  });
  if (!captainTable) {
    throw new Error("You can only manage correction requests for your own table");
  }

  if (request.status !== "PENDING") {
    throw new Error("This correction request has already been resolved");
  }

  const competitionId = request.scoreCard.submission.categoryRound.competitionId;

  // Unlock the score card, update correction status, and log audit
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
    prisma.auditLog.create({
      data: {
        competitionId,
        actorId: captainId,
        action: "APPROVE_CORRECTION",
        entityId: requestId,
        entityType: "CorrectionRequest",
      },
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
    include: { scoreCard: { include: { submission: { select: { tableId: true, categoryRound: { select: { competitionId: true } } } } } } },
  });

  // Verify captain owns this table
  const captainTable = await prisma.table.findFirst({
    where: { id: request.scoreCard.submission.tableId, captainId },
    select: { id: true },
  });
  if (!captainTable) {
    throw new Error("You can only manage correction requests for your own table");
  }

  if (request.status !== "PENDING") {
    throw new Error("This correction request has already been resolved");
  }

  const [correction] = await prisma.$transaction([
    prisma.correctionRequest.update({
      where: { id: requestId },
      data: {
        status: "DENIED",
        decidedBy: captainId,
        decidedAt: new Date(),
      },
    }),
    prisma.auditLog.create({
      data: {
        competitionId: request.scoreCard.submission.categoryRound.competitionId,
        actorId: captainId,
        action: "DENY_CORRECTION",
        entityId: requestId,
        entityType: "CorrectionRequest",
      },
    }),
  ]);

  revalidatePath("/captain");
  return correction;
}

// --- Get Table Comment Cards ---

export async function getTableCommentCards(
  tableId: string,
  categoryRoundId: string
): Promise<CommentCardWithJudge[]> {
  const { userId } = await requireCaptain();

  // Verify captain owns this table (organizers also allowed)
  const table = await prisma.table.findUniqueOrThrow({
    where: { id: tableId },
    select: { captainId: true },
  });
  const isOrganizer = !!(await prisma.user.findFirst({
    where: { id: userId, role: "ORGANIZER" },
    select: { id: true },
  }));
  if (table.captainId !== userId && !isOrganizer) {
    throw new Error("You can only view comment cards for your own table");
  }

  const commentCards = await prisma.commentCard.findMany({
    where: {
      categoryRoundId,
      submission: { tableId },
    },
    include: {
      judge: { select: { id: true, name: true, cbjNumber: true } },
      submission: {
        select: {
          id: true,
          boxNumber: true,
          boxCode: true,
          competitor: { select: { id: true, anonymousNumber: true } },
        },
      },
    },
    orderBy: [
      { submission: { boxNumber: "asc" } },
      { judge: { cbjNumber: "asc" } },
    ],
  });

  // TODO: replace with Prisma.GetPayload to tie type to query shape
  return commentCards as CommentCardWithJudge[];
}

// --- Check if Category Already Submitted by Table ---

export async function isCategorySubmittedByTable(
  tableId: string,
  categoryRoundId: string
): Promise<boolean> {
  await requireAuth();
  const table = await prisma.table.findUniqueOrThrow({
    where: { id: tableId },
    select: { competitionId: true },
  });

  const log = await prisma.auditLog.findFirst({
    where: {
      competitionId: table.competitionId,
      action: "SUBMIT_CATEGORY",
      entityId: `${tableId}:${categoryRoundId}`,
      entityType: "CategoryRound",
    },
  });
  return !!log;
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

  // Get table and verify captain ownership
  const table = await prisma.table.findUniqueOrThrow({
    where: { id: tableId },
    select: { competitionId: true, captainId: true },
  });

  if (table.captainId !== captainId) {
    throw new Error("You can only submit for your own table");
  }

  // Delegate audit log + auto-transition to competition module
  await markCategoryRoundSubmittedIfReady(
    table.competitionId,
    categoryRoundId,
    tableId
  );

  revalidatePath("/captain");
  revalidatePath(`/organizer`);
}
