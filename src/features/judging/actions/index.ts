"use server";

import { prisma } from "@/shared/lib/prisma";
import { requireJudge } from "@/shared/lib/auth-guards";
import { revalidatePath } from "next/cache";
import { CATEGORY_STATUS } from "@/shared/constants/kcbs";
import { scorecardSchema, correctionSchema, tableSetupSchema, boxCodeSchema } from "../schemas";
import type { JudgeSession, JudgeSetupState, SubmissionWithDetails, BoxEntry } from "../types";

// --- Helper: verify judge is assigned to the table owning a submission ---

async function verifyJudgeTableMembership(
  judgeId: string,
  submissionId: string
): Promise<void> {
  const submission = await prisma.submission.findUniqueOrThrow({
    where: { id: submissionId },
    select: { tableId: true },
  });
  const assignment = await prisma.tableAssignment.findFirst({
    where: { tableId: submission.tableId, userId: judgeId },
  });
  if (!assignment) {
    throw new Error("You can only submit scores for your assigned table");
  }
}

// --- Get Judge Setup State ---

export async function getJudgeSetupState(): Promise<JudgeSetupState> {
  const { cbjNumber } = await requireJudge();
  const judge = await prisma.user.findUnique({
    where: { cbjNumber },
  });
  if (!judge) return { phase: "not-registered" };

  // Check if registered for any active competition
  const registration = await prisma.competitionJudge.findFirst({
    where: {
      userId: judge.id,
      competition: { status: { in: ["SETUP", "ACTIVE"] } },
    },
    include: {
      competition: { select: { id: true, name: true } },
    },
    orderBy: { competition: { date: "desc" } },
  });

  if (!registration) return { phase: "not-registered" };

  // Check if assigned to a table
  const assignment = await prisma.tableAssignment.findFirst({
    where: {
      userId: judge.id,
      table: { competitionId: registration.competitionId },
    },
    include: {
      table: {
        select: {
          id: true,
          tableNumber: true,
          assignments: {
            where: { seatNumber: { not: null } },
            include: { user: { select: { name: true } } },
          },
        },
      },
    },
  });

  if (!assignment) {
    return {
      phase: "awaiting-table",
      competitionName: registration.competition.name,
    };
  }

  // Has table but no seat
  if (assignment.seatNumber === null) {
    const takenSeats = assignment.table.assignments
      .filter((a) => a.seatNumber !== null)
      .map((a) => ({
        seatNumber: a.seatNumber!,
        judgeName: a.user.name,
      }));

    return {
      phase: "pick-seat",
      assignmentId: assignment.id,
      tableNumber: assignment.table.tableNumber,
      competitionName: registration.competition.name,
      takenSeats,
    };
  }

  return { phase: "ready" };
}

// --- Claim Seat ---

export async function claimSeat(assignmentId: string, seatNumber: number) {
  const { userId } = await requireJudge();

  if (seatNumber < 1 || seatNumber > 6) {
    throw new Error("Seat must be between 1 and 6");
  }

  const assignment = await prisma.tableAssignment.findUnique({
    where: { id: assignmentId },
  });
  if (!assignment) throw new Error("Assignment not found");

  // Verify the judge owns this assignment
  if (assignment.userId !== userId) {
    throw new Error("You can only claim a seat on your own assignment");
  }

  // Check if seat is taken
  const seatTaken = await prisma.tableAssignment.findFirst({
    where: {
      tableId: assignment.tableId,
      seatNumber,
      id: { not: assignmentId },
    },
  });
  if (seatTaken) throw new Error(`Seat ${seatNumber} is already taken`);

  await prisma.tableAssignment.update({
    where: { id: assignmentId },
    data: { seatNumber },
  });

  revalidatePath("/judge");
  return { success: true };
}

// --- Get Judge Session ---

export async function getJudgeSession(
  competitionId?: string
): Promise<JudgeSession | null> {
  const { cbjNumber } = await requireJudge();
  const judge = await prisma.user.findUnique({
    where: { cbjNumber },
    select: { id: true, name: true, cbjNumber: true },
  });
  if (!judge) return null;

  // Find the judge's table assignment — for a specific competition or any active one
  const assignment = await prisma.tableAssignment.findFirst({
    where: {
      userId: judge.id,
      table: competitionId
        ? { competitionId }
        : { competition: { status: { in: ["SETUP", "ACTIVE"] } } },
    },
    include: {
      table: {
        select: { id: true, tableNumber: true, competitionId: true },
      },
    },
    orderBy: { table: { competition: { date: "desc" } } },
  });
  if (!assignment) return null;

  const resolvedCompetitionId = assignment.table.competitionId;

  // Batch parallel queries: competition, registration, activeCategory
  const [competition, registration, activeCategory] = await Promise.all([
    prisma.competition.findUnique({
      where: { id: resolvedCompetitionId },
      select: {
        status: true,
        commentCardsEnabled: true,
        organizerName: true,
        kcbsRepName: true,
        city: true,
        state: true,
      },
    }),
    prisma.competitionJudge.findUnique({
      where: { competitionId_userId: { competitionId: resolvedCompetitionId, userId: judge.id } },
      select: { hasStartedJudging: true },
    }),
    prisma.categoryRound.findFirst({
      where: { competitionId: resolvedCompetitionId, status: CATEGORY_STATUS.ACTIVE },
      select: { id: true, categoryName: true, status: true, order: true },
    }),
  ]);

  // Batch: submissions + commentCard count (both depend on activeCategory)
  let assignedSubmissions: SubmissionWithDetails[] = [];
  let commentCardsDone = false;
  if (activeCategory) {
    const [subs, commentCardCount] = await Promise.all([
      prisma.submission.findMany({
        where: {
          tableId: assignment.table.id,
          categoryRoundId: activeCategory.id,
        },
        include: {
          competitor: { select: { id: true, anonymousNumber: true } },
          scoreCards: { where: { judgeId: judge.id } },
          categoryRound: { select: { id: true, categoryName: true, status: true } },
          table: { select: { id: true, tableNumber: true } },
        },
        orderBy: { boxNumber: "asc" },
      }),
      competition?.commentCardsEnabled
        ? prisma.commentCard.count({
            where: {
              judgeId: judge.id,
              categoryRoundId: activeCategory.id,
              submission: { tableId: assignment.table.id },
            },
          })
        : Promise.resolve(0),
    ]);
    assignedSubmissions = subs as SubmissionWithDetails[];
    commentCardsDone = competition?.commentCardsEnabled
      ? commentCardCount >= subs.length
      : false;
  }

  return {
    judge,
    table: assignment.table,
    seatNumber: assignment.seatNumber ?? 0,
    activeCategory,
    assignedSubmissions,
    competitionStatus: competition?.status ?? "SETUP",
    commentCardsEnabled: competition?.commentCardsEnabled ?? false,
    hasStartedJudging: registration?.hasStartedJudging ?? false,
    commentCardsDone,
    organizerName: competition?.organizerName ?? null,
    kcbsRepName: competition?.kcbsRepName ?? null,
    city: competition?.city ?? null,
    state: competition?.state ?? null,
  };
}

// --- Mark Judging Started ---

export async function markJudgingStarted(competitionId: string) {
  const { userId } = await requireJudge();

  // Verify judge is registered and competition is active
  const registration = await prisma.competitionJudge.findUnique({
    where: { competitionId_userId: { competitionId, userId } },
    include: { competition: { select: { status: true } } },
  });
  if (!registration) {
    throw new Error("You are not registered for this competition");
  }
  if (registration.competition.status !== "ACTIVE" && registration.competition.status !== "SETUP") {
    throw new Error("This competition is no longer active");
  }

  await prisma.competitionJudge.update({
    where: { competitionId_userId: { competitionId, userId } },
    data: { hasStartedJudging: true },
  });

  revalidatePath("/judge");
}

// --- Get Submissions for Judge ---

export async function getSubmissionsForJudge(
  categoryRoundId: string
): Promise<SubmissionWithDetails[]> {
  const { userId: judgeId } = await requireJudge();
  // Find the judge's table
  const assignment = await prisma.tableAssignment.findFirst({
    where: {
      userId: judgeId,
      table: {
        submissions: {
          some: { categoryRoundId },
        },
      },
    },
    include: { table: true },
  });
  if (!assignment) return [];

  const submissions = await prisma.submission.findMany({
    where: {
      tableId: assignment.tableId,
      categoryRoundId,
    },
    include: {
      competitor: {
        select: { id: true, anonymousNumber: true },
      },
      scoreCards: {
        where: { judgeId },
      },
      categoryRound: {
        select: { id: true, categoryName: true, status: true },
      },
      table: {
        select: { id: true, tableNumber: true },
      },
    },
    orderBy: { boxNumber: "asc" },
  });

  return submissions as SubmissionWithDetails[];
}

// --- Submit Score Card (BR-3: locks on create) ---

export async function submitScoreCard(
  submissionId: string,
  scores: { appearance: number; taste: number; texture: number }
) {
  const { userId: judgeId } = await requireJudge();
  const parsed = scorecardSchema.parse(scores);

  // Check if a score card already exists (prevent double submission)
  const existing = await prisma.scoreCard.findUnique({
    where: { submissionId_judgeId: { submissionId, judgeId } },
  });
  if (existing?.locked) {
    throw new Error(
      "This score card is locked. Submit a correction request to modify."
    );
  }

  // Verify judge is assigned to this submission's table
  await verifyJudgeTableMembership(judgeId, submissionId);

  // Get competition context for audit logging
  const submission = await prisma.submission.findUniqueOrThrow({
    where: { id: submissionId },
    select: { categoryRound: { select: { competitionId: true } } },
  });

  const scoreCard = await prisma.$transaction(async (tx) => {
    const card = await tx.scoreCard.upsert({
      where: { submissionId_judgeId: { submissionId, judgeId } },
      create: {
        submissionId,
        judgeId,
        appearance: parsed.appearance,
        taste: parsed.taste,
        texture: parsed.texture,
        locked: true,
        submittedAt: new Date(),
      },
      update: {
        appearance: parsed.appearance,
        taste: parsed.taste,
        texture: parsed.texture,
        locked: true,
        submittedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        competitionId: submission.categoryRound.competitionId,
        actorId: judgeId,
        action: "SUBMIT_SCORE_CARD",
        entityId: card.id,
        entityType: "ScoreCard",
      },
    });

    return card;
  });

  revalidatePath("/judge");
  return scoreCard;
}

// --- Request Correction ---

export async function requestCorrection(
  scorecardId: string,
  reason: string
) {
  const { userId: judgeId } = await requireJudge();
  const parsed = correctionSchema.parse({ reason });

  // Verify the score card belongs to the judge and is locked
  const scoreCard = await prisma.scoreCard.findUnique({
    where: { id: scorecardId },
  });
  if (!scoreCard) throw new Error("Score card not found");
  if (scoreCard.judgeId !== judgeId) {
    throw new Error("You can only request corrections for your own scores");
  }
  if (!scoreCard.locked) {
    throw new Error("Score card is not locked — you can still edit it");
  }

  const correction = await prisma.correctionRequest.create({
    data: {
      scoreCardId: scorecardId,
      judgeId,
      reason: parsed.reason,
    },
  });

  revalidatePath("/judge");
  return correction;
}

// --- Get Active Competition for Judge ---

export async function getActiveCompetitionForJudge(): Promise<{
  id: string;
  name: string;
  date: Date;
  location: string;
} | null> {
  await requireJudge();
  const competition = await prisma.competition.findFirst({
    where: { status: { in: ["SETUP", "ACTIVE"] } },
    select: { id: true, name: true, date: true, location: true },
    orderBy: { date: "desc" },
  });
  return competition;
}

// --- Register Judge at Table ---

export async function registerJudgeAtTable(
  competitionId: string,
  tableNumber: number,
  seatNumber: number
) {
  const { cbjNumber } = await requireJudge();
  const parsed = tableSetupSchema.parse({ tableNumber, seatNumber });

  const judge = await prisma.user.findUnique({ where: { cbjNumber } });
  if (!judge) throw new Error("Judge not found");

  // Find the table
  const table = await prisma.table.findUnique({
    where: {
      competitionId_tableNumber: {
        competitionId,
        tableNumber: parsed.tableNumber,
      },
    },
    include: {
      assignments: { select: { seatNumber: true, userId: true } },
    },
  });
  if (!table) throw new Error(`Table ${parsed.tableNumber} not found`);

  // Check if seat is taken
  const seatTaken = table.assignments.find(
    (a) => a.seatNumber === parsed.seatNumber
  );
  if (seatTaken) {
    if (seatTaken.userId === judge.id) {
      return { success: true, message: "Already assigned" };
    }
    throw new Error(`Seat ${parsed.seatNumber} is already taken`);
  }

  // Check if judge is already assigned at another table
  const existing = await prisma.tableAssignment.findFirst({
    where: {
      userId: judge.id,
      table: { competitionId },
    },
  });
  if (existing) throw new Error("You are already assigned to a table");

  await prisma.tableAssignment.create({
    data: {
      tableId: table.id,
      userId: judge.id,
      seatNumber: parsed.seatNumber,
    },
  });

  revalidatePath("/judge");
  return { success: true };
}

// --- Box Entry Actions ---

export async function addBoxToTable(
  tableId: string,
  categoryRoundId: string,
  boxCode: string
): Promise<BoxEntry> {
  const { userId: judgeId } = await requireJudge();
  const parsedCode = boxCodeSchema.parse(boxCode);

  // Check for duplicate box code
  const existing = await prisma.submission.findUnique({
    where: {
      categoryRoundId_tableId_boxCode: {
        categoryRoundId,
        tableId,
        boxCode: parsedCode,
      },
    },
  });
  if (existing) throw new Error(`Box ${parsedCode} already entered`);

  // Get next box number
  const lastSub = await prisma.submission.findFirst({
    where: { tableId, categoryRoundId },
    orderBy: { boxNumber: "desc" },
  });
  const nextBoxNumber = (lastSub?.boxNumber ?? 0) + 1;

  const submission = await prisma.submission.create({
    data: {
      categoryRoundId,
      tableId,
      boxCode: parsedCode,
      boxNumber: nextBoxNumber,
      enteredByJudgeId: judgeId,
    },
  });

  revalidatePath("/judge");
  return { id: submission.id, boxCode: submission.boxCode, boxNumber: submission.boxNumber };
}

export async function removeBoxFromTable(
  submissionId: string
) {
  const { userId: judgeId } = await requireJudge();
  await verifyJudgeTableMembership(judgeId, submissionId);

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { scoreCards: true },
  });
  if (!submission) throw new Error("Submission not found");
  if (submission.scoreCards.length > 0) {
    throw new Error("Cannot remove a box that already has scores");
  }

  await prisma.submission.delete({ where: { id: submissionId } });
  revalidatePath("/judge");
}

export async function getBoxesForTable(
  tableId: string,
  categoryRoundId: string
): Promise<BoxEntry[]> {
  const { userId: judgeId } = await requireJudge();
  // Verify judge is assigned to this table
  const assignment = await prisma.tableAssignment.findFirst({
    where: { tableId, userId: judgeId },
  });
  if (!assignment) {
    throw new Error("You can only view boxes for your assigned table");
  }
  const submissions = await prisma.submission.findMany({
    where: { tableId, categoryRoundId },
    select: { id: true, boxCode: true, boxNumber: true },
    orderBy: { boxNumber: "asc" },
  });
  return submissions;
}

// --- Appearance Scoring (batch) ---

export async function submitAppearanceScores(
  scores: Array<{ submissionId: string; appearance: number }>
) {
  const { userId: judgeId } = await requireJudge();

  const validScores = new Set([1, 2, 5, 6, 7, 8, 9]);
  for (const { appearance } of scores) {
    if (!validScores.has(appearance)) {
      throw new Error("Score must be one of: 1, 2, 5, 6, 7, 8, 9");
    }
  }

  // Verify judge is assigned to the table for all submissions
  if (scores.length > 0) {
    const submissions = await prisma.submission.findMany({
      where: { id: { in: scores.map((s) => s.submissionId) } },
      select: { id: true, tableId: true },
    });
    const tableIds = Array.from(new Set(submissions.map((s) => s.tableId)));
    for (const tableId of tableIds) {
      const assignment = await prisma.tableAssignment.findFirst({
        where: { tableId, userId: judgeId },
      });
      if (!assignment) {
        throw new Error("You can only submit scores for your assigned table");
      }
    }
  }

  const now = new Date();
  await prisma.$transaction(
    scores.map(({ submissionId, appearance }) =>
      prisma.scoreCard.upsert({
        where: { submissionId_judgeId: { submissionId, judgeId } },
        create: {
          submissionId,
          judgeId,
          appearance,
          appearanceSubmittedAt: now,
        },
        update: {
          appearance,
          appearanceSubmittedAt: now,
        },
      })
    )
  );

  revalidatePath("/judge");
}

// --- Comment Card Actions ---

export async function submitCommentCard(
  submissionId: string,
  categoryRoundId: string,
  data: {
    otherLine?: string;
    appearanceText?: string;
    tasteChecks?: string[];
    tendernessChecks?: string[];
    otherComments?: string;
  }
) {
  const { userId: judgeId } = await requireJudge();

  // Verify judge is assigned to this submission's table
  await verifyJudgeTableMembership(judgeId, submissionId);

  // Get the scorecard to auto-populate scores
  const scoreCard = await prisma.scoreCard.findUnique({
    where: { submissionId_judgeId: { submissionId, judgeId } },
  });
  if (!scoreCard) throw new Error("Score card not found");

  const commentCard = await prisma.commentCard.upsert({
    where: { submissionId_judgeId: { submissionId, judgeId } },
    create: {
      submissionId,
      judgeId,
      categoryRoundId,
      appearanceScore: scoreCard.appearance,
      tasteScore: scoreCard.taste,
      textureScore: scoreCard.texture,
      otherLine: data.otherLine || null,
      appearanceText: data.appearanceText || null,
      tasteChecks: data.tasteChecks || [],
      tendernessChecks: data.tendernessChecks || [],
      otherComments: data.otherComments || null,
    },
    update: {
      appearanceScore: scoreCard.appearance,
      tasteScore: scoreCard.taste,
      textureScore: scoreCard.texture,
      otherLine: data.otherLine || null,
      appearanceText: data.appearanceText || null,
      tasteChecks: data.tasteChecks || [],
      tendernessChecks: data.tendernessChecks || [],
      otherComments: data.otherComments || null,
    },
  });

  revalidatePath("/judge");
  return commentCard;
}

export async function getCommentCardsForJudge(
  categoryRoundId: string
) {
  const { userId: judgeId } = await requireJudge();
  const commentCards = await prisma.commentCard.findMany({
    where: { judgeId, categoryRoundId },
    include: {
      submission: {
        select: { id: true, boxNumber: true, boxCode: true },
      },
    },
    orderBy: { submission: { boxNumber: "asc" } },
  });
  return commentCards;
}

// --- Taste + Texture Scoring (per box) ---

export async function submitTasteTextureScores(
  submissionId: string,
  scores: { taste: number; texture: number }
) {
  const { userId: judgeId } = await requireJudge();

  const validScores = new Set([1, 2, 5, 6, 7, 8, 9]);
  if (!validScores.has(scores.taste) || !validScores.has(scores.texture)) {
    throw new Error("Scores must be one of: 1, 2, 5, 6, 7, 8, 9");
  }

  const existing = await prisma.scoreCard.findUnique({
    where: { submissionId_judgeId: { submissionId, judgeId } },
  });
  if (!existing) {
    throw new Error("Appearance must be scored first");
  }
  if (existing.locked) {
    throw new Error("Score card is already locked");
  }

  const scoreCard = await prisma.scoreCard.update({
    where: { submissionId_judgeId: { submissionId, judgeId } },
    data: {
      taste: scores.taste,
      texture: scores.texture,
      locked: true,
      submittedAt: new Date(),
    },
  });

  revalidatePath("/judge");
  return scoreCard;
}
