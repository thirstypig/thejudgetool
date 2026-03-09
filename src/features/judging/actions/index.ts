"use server";

import { prisma } from "@/shared/lib/prisma";
import { auth } from "@/shared/lib/auth";
import { revalidatePath } from "next/cache";
import type { Session } from "next-auth";
import { CATEGORY_STATUS } from "@/shared/constants/kcbs";
import { scorecardSchema, correctionSchema, tableSetupSchema, boxCodeSchema } from "../schemas";
import type { JudgeSession, JudgeSetupState, SubmissionWithDetails, BoxEntry } from "../types";

async function requireJudge() {
  const session = (await auth()) as Session | null;
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || (role !== "JUDGE" && role !== "TABLE_CAPTAIN")) {
    throw new Error("Unauthorized: must be a judge");
  }
  const cbjNumber = (session.user as { cbjNumber?: string }).cbjNumber;
  if (!cbjNumber) throw new Error("Unauthorized: missing CBJ number");
  return { session, cbjNumber };
}

// --- Get Judge Setup State ---

export async function getJudgeSetupState(
  cbjNumber: string
): Promise<JudgeSetupState> {
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
  await requireJudge();

  if (seatNumber < 1 || seatNumber > 6) {
    throw new Error("Seat must be between 1 and 6");
  }

  const assignment = await prisma.tableAssignment.findUnique({
    where: { id: assignmentId },
  });
  if (!assignment) throw new Error("Assignment not found");

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
  cbjNumber: string,
  competitionId?: string
): Promise<JudgeSession | null> {
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

  // Fetch competition details for event info + comment cards
  const competition = await prisma.competition.findUnique({
    where: { id: resolvedCompetitionId },
    select: {
      status: true,
      commentCardsEnabled: true,
      organizerName: true,
      kcbsRepName: true,
      city: true,
      state: true,
    },
  });

  // Find the active category round
  const activeCategory = await prisma.categoryRound.findFirst({
    where: { competitionId: resolvedCompetitionId, status: CATEGORY_STATUS.ACTIVE },
    select: { id: true, categoryName: true, status: true, order: true },
  });

  // Get submissions for this table in the active category
  let assignedSubmissions: SubmissionWithDetails[] = [];
  if (activeCategory) {
    assignedSubmissions = (await prisma.submission.findMany({
      where: {
        tableId: assignment.table.id,
        categoryRoundId: activeCategory.id,
      },
      include: {
        competitor: {
          select: { id: true, anonymousNumber: true },
        },
        scoreCards: {
          where: { judgeId: judge.id },
        },
        categoryRound: {
          select: { id: true, categoryName: true, status: true },
        },
        table: {
          select: { id: true, tableNumber: true },
        },
      },
      orderBy: { boxNumber: "asc" },
    })) as SubmissionWithDetails[];
  }

  return {
    judge,
    table: assignment.table,
    seatNumber: assignment.seatNumber ?? 0,
    activeCategory,
    assignedSubmissions,
    competitionStatus: competition?.status ?? "SETUP",
    commentCardsEnabled: competition?.commentCardsEnabled ?? false,
    organizerName: competition?.organizerName ?? null,
    kcbsRepName: competition?.kcbsRepName ?? null,
    city: competition?.city ?? null,
    state: competition?.state ?? null,
  };
}

// --- Get Submissions for Judge ---

export async function getSubmissionsForJudge(
  judgeId: string,
  categoryRoundId: string
): Promise<SubmissionWithDetails[]> {
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
  judgeId: string,
  scores: { appearance: number; taste: number; texture: number }
) {
  await requireJudge();
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

  const scoreCard = await prisma.scoreCard.upsert({
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

  revalidatePath("/judge");
  return scoreCard;
}

// --- Request Correction ---

export async function requestCorrection(
  scorecardId: string,
  judgeId: string,
  reason: string
) {
  await requireJudge();
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
  const competition = await prisma.competition.findFirst({
    where: { status: { in: ["SETUP", "ACTIVE"] } },
    select: { id: true, name: true, date: true, location: true },
    orderBy: { date: "desc" },
  });
  return competition;
}

// --- Register Judge at Table ---

export async function registerJudgeAtTable(
  cbjNumber: string,
  competitionId: string,
  tableNumber: number,
  seatNumber: number
) {
  await requireJudge();
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
  boxCode: string,
  judgeId: string
): Promise<BoxEntry> {
  await requireJudge();
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
  await requireJudge();

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
  const submissions = await prisma.submission.findMany({
    where: { tableId, categoryRoundId },
    select: { id: true, boxCode: true, boxNumber: true },
    orderBy: { boxNumber: "asc" },
  });
  return submissions;
}

// --- Appearance Scoring (batch) ---

export async function submitAppearanceScores(
  judgeId: string,
  scores: Array<{ submissionId: string; appearance: number }>
) {
  await requireJudge();

  const now = new Date();
  for (const { submissionId, appearance } of scores) {
    const validScores = new Set([1, 2, 5, 6, 7, 8, 9]);
    if (!validScores.has(appearance)) {
      throw new Error("Score must be one of: 1, 2, 5, 6, 7, 8, 9");
    }

    await prisma.scoreCard.upsert({
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
    });
  }

  revalidatePath("/judge");
}

// --- Comment Card Actions ---

export async function submitCommentCard(
  submissionId: string,
  judgeId: string,
  categoryRoundId: string,
  data: {
    otherLine?: string;
    appearanceText?: string;
    tasteChecks?: string[];
    tendernessChecks?: string[];
    otherComments?: string;
  }
) {
  await requireJudge();

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
  judgeId: string,
  categoryRoundId: string
) {
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
  judgeId: string,
  scores: { taste: number; texture: number }
) {
  await requireJudge();

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
