"use server";

import { prisma } from "@/shared/lib/prisma";
import bcrypt from "bcryptjs";
import { requireAuth, requireOrganizer } from "@/shared/lib/auth-guards";
import { revalidatePath } from "next/cache";
import {
  KCBS_MANDATORY_CATEGORIES,
  CATEGORY_STATUS,
  COMPETITION_STATUS,
} from "@/shared/constants/kcbs";
import { z } from "zod";
import { competitionSchema, competitorSchema } from "../schemas";
import type { CompetitionWithRelations, CompetitionJudgeWithUser } from "../types";
import {
  generateBoxDistribution,
  validateDistribution,
} from "../utils/generateBoxDistribution";

// --- Shared Helpers ---

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** Guard + cascade-delete all submissions and their children for a competition. */
async function guardAndCascadeDeleteSubmissions(tx: TxClient, competitionId: string) {
  const hasLockedScores = await tx.scoreCard.findFirst({
    where: { submission: { categoryRound: { competitionId } }, locked: true },
    select: { id: true },
  });
  if (hasLockedScores) {
    throw new Error("Cannot modify distribution after scoring has begun");
  }

  await tx.commentCard.deleteMany({
    where: { submission: { categoryRound: { competitionId } } },
  });
  await tx.correctionRequest.deleteMany({
    where: { scoreCard: { submission: { categoryRound: { competitionId } } } },
  });
  await tx.scoreCard.deleteMany({
    where: { submission: { categoryRound: { competitionId } } },
  });
  await tx.submission.deleteMany({
    where: { categoryRound: { competitionId } },
  });
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
  await requireAuth();
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
  await requireAuth();
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

  // TODO: replace with Prisma.GetPayload to tie type to query shape
  return competition as CompetitionWithRelations | null;
}

// --- Add Competitor ---

export async function addCompetitor(
  competitionId: string,
  data: { teamName: string; anonymousNumber: string; headCookName?: string; headCookKcbsNumber?: string }
) {
  await requireOrganizer();
  // Verify competition exists (prevents writing to unknown competitions)
  await prisma.competition.findUniqueOrThrow({ where: { id: competitionId } });
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

  revalidatePath(`/organizer/${competitionId}/teams`);
  return competitor;
}

// --- Add Competitors Bulk (CSV import) ---

const bulkCompetitorSchema = z.array(competitorSchema).min(1).max(200);

export async function addCompetitorsBulk(
  competitionId: string,
  teams: { anonymousNumber: string; teamName: string; headCookName?: string; headCookKcbsNumber?: string }[]
) {
  await requireOrganizer();
  // Verify competition exists (prevents writing to unknown competitions)
  await prisma.competition.findUniqueOrThrow({ where: { id: competitionId } });

  const parsed = bulkCompetitorSchema.parse(teams);

  const beforeCount = await prisma.competitor.count({ where: { competitionId } });

  await prisma.competitor.createMany({
    data: parsed.map((t) => ({
      competitionId,
      teamName: t.teamName,
      anonymousNumber: t.anonymousNumber,
      headCookName: t.headCookName || null,
      headCookKcbsNumber: t.headCookKcbsNumber || null,
    })),
    skipDuplicates: true,
  });

  const afterCount = await prisma.competitor.count({ where: { competitionId } });
  const added = afterCount - beforeCount;
  const skipped = parsed.length - added;

  revalidatePath(`/organizer/${competitionId}/teams`);
  return { added, skipped };
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

  revalidatePath(`/organizer/${competitionId}/teams`);
  return assignment;
}

// --- Validate No Repeat Competitor (BR-2) ---

export async function validateNoRepeatCompetitor(
  _competitionId: string,
  tableId: string,
  competitorId: string
): Promise<boolean> {
  await requireAuth();
  const submission = await prisma.submission.findFirst({
    where: { tableId, competitorId },
  });
  return !submission;
}

// --- Generate Judge PIN ---

export async function generateJudgePin(competitionId: string) {
  await requireOrganizer();

  const pin = String(Math.floor(1000 + Math.random() * 9000)); // 4-digit
  const hashedPin = await bcrypt.hash(pin, 10);

  await prisma.competition.update({
    where: { id: competitionId },
    data: { judgePin: hashedPin },
  });

  revalidatePath(`/organizer/${competitionId}/judges`);
  return pin; // Return plaintext for display; only hash is stored
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
  revalidatePath(`/organizer/${competitionId}/teams`);
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
        entityId: { endsWith: `:${activeRound.id}` },
      },
    });
    const submittedTableIds = new Set(
      submitLogs.map((log) => log.entityId.split(":")[0])
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

  // Round-robin assign within a transaction
  await prisma.$transaction(async (tx) => {
    let slotIdx = 0;
    for (const judge of shuffled) {
      // Find next table with available slots
      while (tableSlots[slotIdx].available <= 0) {
        slotIdx = (slotIdx + 1) % tableSlots.length;
      }

      const tableNumber = tableSlots[slotIdx].tableNumber;

      // Find or create table
      let table = await tx.table.findUnique({
        where: { competitionId_tableNumber: { competitionId, tableNumber } },
      });
      if (!table) {
        table = await tx.table.create({
          data: { competitionId, tableNumber },
        });
      }

      // Check if already assigned (shouldn't happen but be safe)
      const existing = await tx.tableAssignment.findFirst({
        where: { userId: judge.userId, table: { competitionId } },
      });
      if (!existing) {
        await tx.tableAssignment.create({
          data: { tableId: table.id, userId: judge.userId, seatNumber: null },
        });
      }

      tableSlots[slotIdx].available--;
      slotIdx = (slotIdx + 1) % tableSlots.length;
    }
  });

  revalidatePath(`/organizer/${competitionId}/judges`);
  revalidatePath(`/organizer/${competitionId}/teams`);
  return { assigned: shuffled.length };
}

// --- Generate Box Distribution (preview) ---

async function fetchCompetitionForDistribution(competitionId: string) {
  return prisma.competition.findUniqueOrThrow({
    where: { id: competitionId },
    include: {
      competitors: { orderBy: { anonymousNumber: "asc" } },
      tables: { orderBy: { tableNumber: "asc" } },
      categoryRounds: { orderBy: { order: "asc" } },
    },
  });
}

function buildDistribution(competition: Awaited<ReturnType<typeof fetchCompetitionForDistribution>>) {
  return generateBoxDistribution(
    competition.competitors.map((c) => ({
      id: c.id,
      anonymousNumber: c.anonymousNumber,
    })),
    competition.tables.map((t) => ({
      id: t.id,
      tableNumber: t.tableNumber,
    })),
    competition.categoryRounds.map((cr) => ({
      id: cr.id,
      categoryName: cr.categoryName,
      order: cr.order,
    }))
  );
}

export async function generateDistribution(competitionId: string) {
  await requireOrganizer();

  const competition = await fetchCompetitionForDistribution(competitionId);
  const distribution = buildDistribution(competition);

  await prisma.competition.update({
    where: { id: competitionId },
    data: { distributionStatus: "DRAFT" as const },
  });

  revalidatePath(`/organizer/${competitionId}/teams`);
  return distribution;
}

// --- Approve Box Distribution (regenerates server-side) ---

export async function approveDistribution(competitionId: string) {
  await requireOrganizer();

  const competition = await fetchCompetitionForDistribution(competitionId);

  // Regenerate distribution server-side
  const distribution = buildDistribution(competition);

  // Validate BR-2 server-side
  const validation = validateDistribution(distribution);
  if (!validation.valid) {
    throw new Error(
      `Distribution violates BR-2: ${validation.violations.length} competitor(s) appear at the same table in multiple categories`
    );
  }

  await prisma.$transaction(async (tx) => {
    await guardAndCascadeDeleteSubmissions(tx, competitionId);

    // Create all submissions in batch
    const submissionData = distribution.flatMap((cat) =>
      cat.tables.flatMap((table) =>
        table.competitors.map((comp) => ({
          categoryRoundId: cat.categoryRoundId,
          tableId: table.tableId,
          competitorId: comp.competitorId,
          boxNumber: comp.boxNumber,
          boxCode: String(comp.boxNumber),
        }))
      )
    );
    await tx.submission.createMany({ data: submissionData });

    await tx.competition.update({
      where: { id: competitionId },
      data: { distributionStatus: "APPROVED" as const },
    });
  });

  revalidatePath(`/organizer/${competitionId}/teams`);
}

// --- Get Existing Distribution (from submissions) ---

export async function getExistingDistribution(competitionId: string) {
  await requireAuth();

  const submissions = await prisma.submission.findMany({
    where: { categoryRound: { competitionId } },
    include: {
      competitor: { select: { id: true, anonymousNumber: true } },
      categoryRound: { select: { id: true, categoryName: true, order: true } },
      table: { select: { id: true, tableNumber: true } },
    },
    orderBy: [
      { categoryRound: { order: "asc" } },
      { table: { tableNumber: "asc" } },
      { boxNumber: "asc" },
    ],
  });

  if (submissions.length === 0) return null;

  // Group into BoxDistribution shape
  const catMap = new Map<string, {
    categoryRoundId: string;
    categoryName: string;
    order: number;
    tableMap: Map<string, {
      tableId: string;
      tableNumber: number;
      competitors: Array<{ competitorId: string; anonymousNumber: string; boxNumber: number }>;
    }>;
  }>();

  for (const sub of submissions) {
    const catKey = sub.categoryRound.id;
    if (!catMap.has(catKey)) {
      catMap.set(catKey, {
        categoryRoundId: sub.categoryRound.id,
        categoryName: sub.categoryRound.categoryName,
        order: sub.categoryRound.order,
        tableMap: new Map(),
      });
    }
    const cat = catMap.get(catKey)!;
    const tableKey = sub.table.id;
    if (!cat.tableMap.has(tableKey)) {
      cat.tableMap.set(tableKey, {
        tableId: sub.table.id,
        tableNumber: sub.table.tableNumber,
        competitors: [],
      });
    }
    cat.tableMap.get(tableKey)!.competitors.push({
      competitorId: sub.competitor?.id ?? "",
      anonymousNumber: sub.competitor?.anonymousNumber ?? "",
      boxNumber: sub.boxNumber,
    });
  }

  return Array.from(catMap.values())
    .sort((a, b) => a.order - b.order)
    .map((cat) => ({
      categoryRoundId: cat.categoryRoundId,
      categoryName: cat.categoryName,
      tables: Array.from(cat.tableMap.values()).sort((a, b) => a.tableNumber - b.tableNumber),
    }));
}

// --- Reset Box Distribution ---

export async function resetDistribution(competitionId: string) {
  await requireOrganizer();

  await prisma.$transaction(async (tx) => {
    await guardAndCascadeDeleteSubmissions(tx, competitionId);

    await tx.competition.update({
      where: { id: competitionId },
      data: { distributionStatus: null },
    });
  });

  revalidatePath(`/organizer/${competitionId}/teams`);
}

// --- Check In Team ---

export async function checkInTeam(competitorId: string) {
  await requireOrganizer();

  // Verify competitor exists (prevents blind IDOR)
  const competitor = await prisma.competitor.findUniqueOrThrow({
    where: { id: competitorId },
    select: { competitionId: true },
  });

  await prisma.competitor.update({
    where: { id: competitorId },
    data: { checkedIn: true, checkedInAt: new Date() },
  });

  revalidatePath(`/organizer/${competitor.competitionId}`);
}

// --- Uncheck In Team ---

export async function uncheckInTeam(competitorId: string) {
  await requireOrganizer();

  // Verify competitor exists (prevents blind IDOR)
  const competitor = await prisma.competitor.findUniqueOrThrow({
    where: { id: competitorId },
    select: { competitionId: true },
  });

  await prisma.competitor.update({
    where: { id: competitorId },
    data: { checkedIn: false, checkedInAt: null },
  });

  revalidatePath(`/organizer/${competitor.competitionId}`);
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
        entityId: `${tableId}:${categoryRoundId}`,
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
        entityId: { endsWith: `:${categoryRoundId}` },
      },
    });

    const submittedTableIds = new Set(
      submitLogs.map((log) => log.entityId.split(":")[0])
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
