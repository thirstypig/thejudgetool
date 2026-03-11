"use server";

import { prisma } from "@/shared/lib/prisma";
import { requireAuth, requireOrganizer } from "@/shared/lib/auth-guards";
import { revalidatePath } from "next/cache";
import {
  generateBoxDistribution,
  validateDistribution,
} from "../utils/generateBoxDistribution";
import { guardAndCascadeDeleteSubmissions } from "./helpers";

// --- Shared: fetch competition data for distribution ---

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

// --- Generate Box Distribution (preview) ---

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
