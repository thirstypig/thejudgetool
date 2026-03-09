"use server";

import { prisma } from "@/shared/lib/prisma";
import { auth } from "@/shared/lib/auth";
import { revalidatePath } from "next/cache";
import type { Session } from "next-auth";
import {
  KCBS_MANDATORY_CATEGORIES,
  CATEGORY_STATUS,
  COMPETITION_STATUS,
} from "@/shared/constants/kcbs";
import { competitionSchema, competitorSchema } from "../schemas";
import type { CompetitionWithRelations, CompetitionJudgeWithUser } from "../types";

async function requireOrganizer() {
  const session = (await auth()) as Session | null;
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ORGANIZER") {
    throw new Error("Unauthorized");
  }
  return session;
}

// --- Create Competition ---

export async function createCompetition(data: {
  name: string;
  date: string;
  location: string;
}) {
  await requireOrganizer();
  const parsed = competitionSchema.parse(data);

  const competition = await prisma.competition.create({
    data: {
      name: parsed.name,
      date: new Date(parsed.date),
      location: parsed.location,
      categoryRounds: {
        create: KCBS_MANDATORY_CATEGORIES.map((cat) => ({
          categoryName: cat.name,
          categoryType: cat.type,
          order: cat.order,
          status: CATEGORY_STATUS.PENDING,
        })),
      },
    },
  });

  revalidatePath("/organizer");
  return competition;
}

// --- Get Competitions ---

export async function getCompetitions() {
  const competitions = await prisma.competition.findMany({
    orderBy: { date: "desc" },
    include: {
      _count: {
        select: { competitors: true, tables: true },
      },
      categoryRounds: { orderBy: { order: "asc" } },
    },
  });
  return competitions;
}

// --- Get Competition By ID ---

export async function getCompetitionById(
  id: string
): Promise<CompetitionWithRelations | null> {
  const competition = await prisma.competition.findUnique({
    where: { id },
    include: {
      competitors: { orderBy: { anonymousNumber: "asc" } },
      tables: {
        orderBy: { tableNumber: "asc" },
        include: {
          captain: { select: { id: true, name: true, cbjNumber: true } },
          assignments: {
            orderBy: { seatNumber: "asc" },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  cbjNumber: true,
                  role: true,
                },
              },
            },
          },
        },
      },
      categoryRounds: { orderBy: { order: "asc" } },
      _count: { select: { competitors: true, tables: true } },
    },
  });

  return competition as CompetitionWithRelations | null;
}

// --- Add Competitor ---

export async function addCompetitor(
  competitionId: string,
  data: { teamName: string; anonymousNumber: string; headCookName?: string; headCookKcbsNumber?: string }
) {
  await requireOrganizer();
  const parsed = competitorSchema.parse(data);

  const existing = await prisma.competitor.findUnique({
    where: {
      competitionId_anonymousNumber: {
        competitionId,
        anonymousNumber: parsed.anonymousNumber,
      },
    },
  });
  if (existing) {
    throw new Error(
      `Anonymous number ${parsed.anonymousNumber} is already in use`
    );
  }

  const competitor = await prisma.competitor.create({
    data: {
      competitionId,
      teamName: parsed.teamName,
      anonymousNumber: parsed.anonymousNumber,
      headCookName: parsed.headCookName || null,
      headCookKcbsNumber: parsed.headCookKcbsNumber || null,
    },
  });

  revalidatePath(`/organizer/${competitionId}/setup`);
  return competitor;
}

// --- Assign Judge to Table ---

export async function assignJudgeToTable(
  competitionId: string,
  cbjNumber: string,
  tableNumber: number,
  seatNumber: number | null,
  isCaptain: boolean
) {
  await requireOrganizer();

  const user = await prisma.user.findUnique({ where: { cbjNumber } });
  if (!user) throw new Error(`No judge found with CBJ number ${cbjNumber}`);

  // Find or create table
  let table = await prisma.table.findUnique({
    where: {
      competitionId_tableNumber: { competitionId, tableNumber },
    },
  });

  if (!table) {
    table = await prisma.table.create({
      data: {
        competitionId,
        tableNumber,
        captainId: isCaptain ? user.id : null,
      },
    });
  }

  // Check seat conflict (only if seat is specified)
  if (seatNumber !== null) {
    const seatTaken = await prisma.tableAssignment.findUnique({
      where: { tableId_seatNumber: { tableId: table.id, seatNumber } },
    });
    if (seatTaken) throw new Error(`Seat ${seatNumber} is already occupied`);
  }

  // Check judge not already assigned to this table
  const alreadyAssigned = await prisma.tableAssignment.findFirst({
    where: { tableId: table.id, userId: user.id },
  });
  if (alreadyAssigned) {
    throw new Error(`${cbjNumber} is already assigned to this table`);
  }

  const assignment = await prisma.tableAssignment.create({
    data: { tableId: table.id, userId: user.id, seatNumber },
  });

  if (isCaptain) {
    await prisma.table.update({
      where: { id: table.id },
      data: { captainId: user.id },
    });
  }

  revalidatePath(`/organizer/${competitionId}/setup`);
  return assignment;
}

// --- Validate No Repeat Competitor (BR-2) ---

export async function validateNoRepeatCompetitor(
  _competitionId: string,
  tableId: string,
  competitorId: string
): Promise<boolean> {
  const submission = await prisma.submission.findFirst({
    where: { tableId, competitorId },
  });
  return !submission;
}

// --- Generate Judge PIN ---

export async function generateJudgePin(competitionId: string) {
  await requireOrganizer();

  const pin = String(Math.floor(1000 + Math.random() * 9000)); // 4-digit

  await prisma.competition.update({
    where: { id: competitionId },
    data: { judgePin: pin },
  });

  revalidatePath(`/organizer/${competitionId}/judges`);
  return pin;
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

  let registered = 0;
  for (const userId of userIds) {
    const existing = await prisma.competitionJudge.findUnique({
      where: { competitionId_userId: { competitionId, userId } },
    });
    if (!existing) {
      await prisma.competitionJudge.create({
        data: { competitionId, userId },
      });
      registered++;
    }
  }

  revalidatePath(`/organizer/${competitionId}/judges`);
  return { registered };
}

// --- Get Competition Roster ---

export async function getCompetitionRoster(
  competitionId: string
): Promise<CompetitionJudgeWithUser[]> {
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

  await prisma.competitionJudge.update({
    where: { id: competitionJudgeId },
    data: { checkedIn: true, checkedInAt: new Date() },
  });

  revalidatePath("/organizer");
}

// --- Uncheck In Judge ---

export async function uncheckInJudge(competitionJudgeId: string) {
  await requireOrganizer();

  await prisma.competitionJudge.update({
    where: { id: competitionJudgeId },
    data: { checkedIn: false, checkedInAt: null },
  });

  revalidatePath("/organizer");
}

// --- Assign Judge to Table Only (no seat) ---

export async function assignJudgeToTableOnly(
  competitionId: string,
  userId: string,
  tableNumber: number
) {
  await requireOrganizer();

  // Find or create table (captainId is now optional)
  let table = await prisma.table.findUnique({
    where: {
      competitionId_tableNumber: { competitionId, tableNumber },
    },
  });

  if (!table) {
    table = await prisma.table.create({
      data: { competitionId, tableNumber },
    });
  }

  // Check if judge already assigned to a table in this competition
  const existingAssignment = await prisma.tableAssignment.findFirst({
    where: { userId, table: { competitionId } },
  });
  if (existingAssignment) {
    // Update existing assignment to new table
    await prisma.tableAssignment.update({
      where: { id: existingAssignment.id },
      data: { tableId: table.id, seatNumber: null },
    });
  } else {
    await prisma.tableAssignment.create({
      data: { tableId: table.id, userId, seatNumber: null },
    });
  }

  revalidatePath(`/organizer/${competitionId}/judges`);
  revalidatePath(`/organizer/${competitionId}/setup`);
}

// --- Advance Category Round (BR-1) ---

export async function advanceCategoryRound(competitionId: string) {
  await requireOrganizer();

  const rounds = await prisma.categoryRound.findMany({
    where: { competitionId },
    orderBy: { order: "asc" },
  });

  const activeRound = rounds.find((r) => r.status === CATEGORY_STATUS.ACTIVE);
  if (activeRound) {
    throw new Error(
      `"${activeRound.categoryName}" is still active. Submit it before advancing.`
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
    revalidatePath(`/organizer/${competitionId}/status`);
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

  revalidatePath(`/organizer/${competitionId}/status`);
  return round;
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

  // Remove table assignment if any
  await prisma.tableAssignment.deleteMany({
    where: {
      userId: registration.userId,
      table: { competitionId: registration.competitionId },
    },
  });

  await prisma.competitionJudge.delete({
    where: { id: competitionJudgeId },
  });

  revalidatePath(`/organizer/${registration.competitionId}/judges`);
}

// --- Random Assign Tables ---

export async function randomAssignTables(competitionId: string) {
  await requireOrganizer();

  // Get checked-in judges without table assignments
  const roster = await getCompetitionRoster(competitionId);
  const unassigned = roster.filter(
    (r) => r.checkedIn && !r.tableAssignment
  );

  if (unassigned.length === 0) {
    throw new Error("No checked-in judges without table assignments");
  }

  // Fisher-Yates shuffle
  const shuffled = [...unassigned];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Get existing tables with their assignment counts
  const existingTables = await prisma.table.findMany({
    where: { competitionId },
    orderBy: { tableNumber: "asc" },
    include: { _count: { select: { assignments: true } } },
  });

  // Build table slots: existing tables with available seats
  const tableSlots: { tableNumber: number; available: number }[] =
    existingTables
      .map((t) => ({
        tableNumber: t.tableNumber,
        available: 6 - t._count.assignments,
      }))
      .filter((t) => t.available > 0);

  // Calculate how many more slots we need
  let totalAvailable = tableSlots.reduce((sum, t) => sum + t.available, 0);
  let nextTableNumber =
    existingTables.length > 0
      ? Math.max(...existingTables.map((t) => t.tableNumber)) + 1
      : 1;

  while (totalAvailable < shuffled.length) {
    tableSlots.push({ tableNumber: nextTableNumber, available: 6 });
    totalAvailable += 6;
    nextTableNumber++;
  }

  // Round-robin assign
  let slotIdx = 0;
  for (const judge of shuffled) {
    // Find next table with available slots
    while (tableSlots[slotIdx].available <= 0) {
      slotIdx = (slotIdx + 1) % tableSlots.length;
    }

    const tableNumber = tableSlots[slotIdx].tableNumber;

    // Find or create table
    let table = await prisma.table.findUnique({
      where: { competitionId_tableNumber: { competitionId, tableNumber } },
    });
    if (!table) {
      table = await prisma.table.create({
        data: { competitionId, tableNumber },
      });
    }

    // Check if already assigned (shouldn't happen but be safe)
    const existing = await prisma.tableAssignment.findFirst({
      where: { userId: judge.userId, table: { competitionId } },
    });
    if (!existing) {
      await prisma.tableAssignment.create({
        data: { tableId: table.id, userId: judge.userId, seatNumber: null },
      });
    }

    tableSlots[slotIdx].available--;
    slotIdx = (slotIdx + 1) % tableSlots.length;
  }

  revalidatePath(`/organizer/${competitionId}/judges`);
  revalidatePath(`/organizer/${competitionId}/setup`);
  return { assigned: shuffled.length };
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

  revalidatePath(`/organizer/${competitionId}/setup`);
}
