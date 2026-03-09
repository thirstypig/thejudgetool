"use server";

import { prisma } from "@/shared/lib/prisma";
import { requireOrganizer } from "@/shared/lib/auth-guards";
import type {
  CategoryProgress,
  CompetitionProgress,
  CategoryResult,
  AllCategoryResults,
  AuditLogEntry,
} from "../types";
import {
  tabulateCategory as tabulateCategoryPure,
  type SubmissionInput,
} from "../utils";

// --- Get Competition Progress ---

export async function getCompetitionProgress(
  competitionId: string
): Promise<CompetitionProgress> {
  await requireOrganizer();

  const rounds = await prisma.categoryRound.findMany({
    where: { competitionId },
    orderBy: { order: "asc" },
    include: {
      submissions: {
        include: {
          scoreCards: true,
        },
      },
    },
  });

  const tables = await prisma.table.findMany({
    where: { competitionId },
  });

  const totalTables = tables.length;

  const categories: CategoryProgress[] = rounds.map((round) => {
    // A table is "submitted" for this round if all score cards for all submissions at that table are locked
    const tableSubmissions = new Map<string, { total: number; locked: number }>();

    for (const sub of round.submissions) {
      const existing = tableSubmissions.get(sub.tableId) ?? {
        total: 0,
        locked: 0,
      };
      for (const card of sub.scoreCards) {
        existing.total++;
        if (card.locked) existing.locked++;
      }
      tableSubmissions.set(sub.tableId, existing);
    }

    let tablesSubmitted = 0;
    tableSubmissions.forEach((counts) => {
      if (counts.total > 0 && counts.total === counts.locked) {
        tablesSubmitted++;
      }
    });

    return {
      categoryRoundId: round.id,
      categoryName: round.categoryName,
      order: round.order,
      status: round.status,
      tablesSubmitted,
      totalTables,
    };
  });

  return { competitionId, categories };
}

// --- Tabulate Category ---

export async function tabulateCategory(
  competitionId: string,
  categoryRoundId: string
): Promise<CategoryResult[]> {
  await requireOrganizer();

  const submissions = await prisma.submission.findMany({
    where: { categoryRoundId },
    include: {
      competitor: true,
      scoreCards: {
        where: { locked: true },
        include: {
          judge: {
            select: { id: true, name: true, cbjNumber: true },
          },
        },
      },
    },
  });

  // Check for declared winners
  const winnerLogs = await prisma.auditLog.findMany({
    where: {
      competitionId,
      action: "DECLARE_WINNER",
      entityType: "CategoryWinner",
    },
  });

  // Parse winner entries: entityId encodes "categoryRoundId:competitorId"
  const declaredWinners = new Set<string>();
  for (const log of winnerLogs) {
    if (log.entityId.startsWith(categoryRoundId + ":")) {
      const competitorId = log.entityId.split(":")[1];
      declaredWinners.add(competitorId);
    }
  }

  // Group score cards by competitor
  const competitorScoresMap = new Map<string, SubmissionInput>();

  for (const sub of submissions) {
    if (!sub.competitorId || !sub.competitor) continue;
    const key = sub.competitorId;
    if (!competitorScoresMap.has(key)) {
      competitorScoresMap.set(key, {
        competitorId: sub.competitorId,
        anonymousNumber: sub.competitor.anonymousNumber,
        teamName: sub.competitor.teamName,
        cards: [],
      });
    }
    const entry = competitorScoresMap.get(key)!;
    for (const card of sub.scoreCards) {
      entry.cards.push({
        judge: card.judge,
        appearance: card.appearance,
        taste: card.taste,
        texture: card.texture,
      });
    }
  }

  // Delegate to pure tabulation function (KCBS weighted scoring + tiebreakers)
  return tabulateCategoryPure(
    Array.from(competitorScoresMap.values()),
    declaredWinners
  );
}

// --- Get All Category Results ---

export async function getAllCategoryResults(
  competitionId: string
): Promise<AllCategoryResults> {
  await requireOrganizer();

  const rounds = await prisma.categoryRound.findMany({
    where: { competitionId },
    orderBy: { order: "asc" },
  });

  const entries = await Promise.all(
    rounds.map(async (round) => {
      const results = await tabulateCategory(competitionId, round.id);
      return [round.categoryName, results] as const;
    })
  );

  return Object.fromEntries(entries);
}

// --- Declare Winner ---

export async function declareWinner(
  competitionId: string,
  categoryRoundId: string,
  competitorId: string
) {
  const session = await requireOrganizer();
  const actorId = session.user?.id;
  if (!actorId) throw new Error("No user ID in session");

  const entityId = `${categoryRoundId}:${competitorId}`;

  // Idempotent check
  const existing = await prisma.auditLog.findFirst({
    where: {
      competitionId,
      action: "DECLARE_WINNER",
      entityType: "CategoryWinner",
      entityId,
    },
  });

  if (existing) return existing;

  const log = await prisma.auditLog.create({
    data: {
      competitionId,
      actorId,
      action: "DECLARE_WINNER",
      entityId,
      entityType: "CategoryWinner",
    },
  });

  return log;
}

// --- Export Results ---

export async function exportResults(
  competitionId: string,
  format: "csv" | "json"
): Promise<string> {
  const allResults = await getAllCategoryResults(competitionId);

  if (format === "json") {
    return JSON.stringify(allResults, null, 2);
  }

  // CSV format
  const lines: string[] = [
    "Category,Rank,Anonymous Number,Team Name,Weighted Average,Weighted Total,Judge Count,DQ,Winner",
  ];

  for (const [categoryName, results] of Object.entries(allResults)) {
    for (const r of results) {
      lines.push(
        [
          `"${categoryName}"`,
          r.rank,
          r.anonymousNumber,
          `"${r.teamName ?? ""}"`,
          r.averageScore,
          r.totalPoints,
          r.judgeCount,
          r.isDQ ? "Yes" : "No",
          r.winnerDeclared ? "Yes" : "No",
        ].join(",")
      );
    }
  }

  return lines.join("\n");
}

// --- Get Audit Log ---

export async function getAuditLog(
  competitionId: string
): Promise<AuditLogEntry[]> {
  await requireOrganizer();

  const logs = await prisma.auditLog.findMany({
    where: { competitionId },
    orderBy: { timestamp: "desc" },
    include: {
      actor: {
        select: { id: true, name: true, cbjNumber: true },
      },
    },
  });

  return logs;
}
