"use server";

import { prisma } from "@/shared/lib/prisma";
import { requireOrganizer } from "@/shared/lib/auth-guards";
import { revalidatePath } from "next/cache";
import { getCompetitionRoster } from "./judges";

// --- Assign Judge to Table ---

export async function assignJudgeToTable(
  competitionId: string,
  cbjNumber: string,
  tableNumber: number,
  seatNumber: number | null,
  isCaptain: boolean,
  isJudging: boolean = true
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

  // Non-judging captain: set captainId only, no TableAssignment
  if (isCaptain && !isJudging) {
    await prisma.table.update({
      where: { id: table.id },
      data: { captainId: user.id },
    });
    revalidatePath(`/organizer/${competitionId}/teams`);
    revalidatePath(`/organizer/${competitionId}/judges`);
    return null;
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
  revalidatePath(`/organizer/${competitionId}/judges`);
  return assignment;
}

// --- Toggle Captain Judging ---

export async function toggleCaptainJudging(
  competitionId: string,
  tableId: string,
  isJudging: boolean
) {
  await requireOrganizer();

  const table = await prisma.table.findUniqueOrThrow({
    where: { id: tableId },
    select: { captainId: true, competitionId: true },
  });

  if (!table.captainId) {
    throw new Error("This table has no captain");
  }
  if (table.competitionId !== competitionId) {
    throw new Error("Table does not belong to this competition");
  }

  if (isJudging) {
    // Add a TableAssignment for the captain (no seat yet)
    const existing = await prisma.tableAssignment.findFirst({
      where: { tableId, userId: table.captainId },
    });
    if (!existing) {
      await prisma.tableAssignment.create({
        data: { tableId, userId: table.captainId, seatNumber: null },
      });
    }
  } else {
    // Remove the captain's TableAssignment (they stay as captain but don't judge)
    // Check for locked scores first
    const hasScores = await prisma.scoreCard.findFirst({
      where: {
        judgeId: table.captainId,
        submission: { tableId },
        locked: true,
      },
      select: { id: true },
    });
    if (hasScores) {
      throw new Error("Cannot remove judging role — captain has submitted scores");
    }

    await prisma.tableAssignment.deleteMany({
      where: { tableId, userId: table.captainId },
    });
  }

  revalidatePath(`/organizer/${competitionId}/teams`);
  revalidatePath(`/organizer/${competitionId}/judges`);
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

  // Build a map of existing table numbers to IDs
  const tableIdByNumber = new Map(
    existingTables.map((t) => [t.tableNumber, t.id])
  );

  // Pre-compute assignments: round-robin judges across table slots
  const pendingAssignments: { tableNumber: number; userId: string }[] = [];
  let slotIdx = 0;
  for (const judge of shuffled) {
    while (tableSlots[slotIdx].available <= 0) {
      slotIdx = (slotIdx + 1) % tableSlots.length;
    }
    pendingAssignments.push({
      tableNumber: tableSlots[slotIdx].tableNumber,
      userId: judge.userId,
    });
    tableSlots[slotIdx].available--;
    slotIdx = (slotIdx + 1) % tableSlots.length;
  }

  // Batch create new tables + assignments in a single transaction
  await prisma.$transaction(async (tx) => {
    // Create any new tables that don't exist yet
    const newTableNumbers = Array.from(new Set(
      pendingAssignments
        .map((a) => a.tableNumber)
        .filter((n) => !tableIdByNumber.has(n))
    ));
    for (const tableNumber of newTableNumbers) {
      const table = await tx.table.create({
        data: { competitionId, tableNumber },
      });
      tableIdByNumber.set(tableNumber, table.id);
    }

    // Batch create all assignments
    await tx.tableAssignment.createMany({
      data: pendingAssignments.map((a) => ({
        tableId: tableIdByNumber.get(a.tableNumber)!,
        userId: a.userId,
        seatNumber: null,
      })),
      skipDuplicates: true,
    });
  });

  revalidatePath(`/organizer/${competitionId}/judges`);
  revalidatePath(`/organizer/${competitionId}/teams`);
  return { assigned: shuffled.length };
}
