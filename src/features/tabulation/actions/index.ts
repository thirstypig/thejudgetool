"use server";

import { prisma } from "@/shared/lib/prisma";
import { requireOrganizer } from "@/shared/lib/auth-guards";
import { SCORE_WEIGHTS } from "@/shared/constants/kcbs";
import type {
  CategoryProgress,
  CompetitionProgress,
  CategoryResult,
  AllCategoryResults,
  AuditLogEntry,
  DetailedCategoryResult,
  DetailedTableResult,
  DetailedCompetitorResult,
  DetailedJudgeScore,
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

  const [tables, submitLogs] = await Promise.all([
    prisma.table.findMany({ where: { competitionId } }),
    prisma.auditLog.findMany({
      where: {
        competitionId,
        action: "SUBMIT_CATEGORY",
        entityType: "CategoryRound",
      },
    }),
  ]);

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

    // Count captain SUBMIT_CATEGORY audit logs for this round
    const captainSubmissions = submitLogs.filter(
      (log) => log.entityId.endsWith(`:${round.id}`)
    ).length;

    return {
      categoryRoundId: round.id,
      categoryName: round.categoryName,
      order: round.order,
      status: round.status,
      tablesSubmitted,
      totalTables,
      captainSubmissions,
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

  // Single-pass: fetch all data in 3 parallel queries instead of per-category N+1
  const [rounds, allSubmissions, winnerLogs] = await Promise.all([
    prisma.categoryRound.findMany({
      where: { competitionId },
      orderBy: { order: "asc" },
    }),
    prisma.submission.findMany({
      where: { categoryRound: { competitionId } },
      include: {
        competitor: true,
        scoreCards: {
          where: { locked: true },
          include: {
            judge: { select: { id: true, name: true, cbjNumber: true } },
          },
        },
        categoryRound: { select: { id: true } },
      },
    }),
    prisma.auditLog.findMany({
      where: {
        competitionId,
        action: "DECLARE_WINNER",
        entityType: "CategoryWinner",
      },
    }),
  ]);

  // Group submissions by categoryRoundId
  const submissionsByRound = new Map<string, typeof allSubmissions>();
  for (const sub of allSubmissions) {
    const key = sub.categoryRound.id;
    if (!submissionsByRound.has(key)) submissionsByRound.set(key, []);
    submissionsByRound.get(key)!.push(sub);
  }

  const entries = rounds.map((round) => {
    // Filter winner logs for this round
    const declaredWinners = new Set<string>();
    for (const log of winnerLogs) {
      if (log.entityId.startsWith(round.id + ":")) {
        declaredWinners.add(log.entityId.split(":")[1]);
      }
    }

    // Group score cards by competitor
    const competitorScoresMap = new Map<string, SubmissionInput>();
    const roundSubs = submissionsByRound.get(round.id) ?? [];
    for (const sub of roundSubs) {
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

    const results = tabulateCategoryPure(
      Array.from(competitorScoresMap.values()),
      declaredWinners
    );
    return [round.categoryName, results] as const;
  });

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

// --- Get Detailed Category Results (Score Audit) ---

export async function getDetailedCategoryResults(
  competitionId: string,
  categoryRoundId: string
): Promise<DetailedCategoryResult> {
  await requireOrganizer();

  const round = await prisma.categoryRound.findUniqueOrThrow({
    where: { id: categoryRoundId },
  });

  const submissions = await prisma.submission.findMany({
    where: { categoryRoundId },
    include: {
      competitor: true,
      table: true,
      scoreCards: {
        where: { locked: true },
        include: {
          judge: { select: { id: true, name: true, cbjNumber: true } },
        },
      },
    },
    orderBy: { boxNumber: "asc" },
  });

  // Group submissions by table
  const tableMap = new Map<string, { tableNumber: number; subs: typeof submissions }>();
  for (const sub of submissions) {
    if (!tableMap.has(sub.tableId)) {
      tableMap.set(sub.tableId, { tableNumber: sub.table.tableNumber, subs: [] });
    }
    tableMap.get(sub.tableId)!.subs.push(sub);
  }

  const tables: DetailedTableResult[] = [];

  for (const [tableId, { tableNumber, subs }] of Array.from(tableMap.entries())) {
    const competitors: DetailedCompetitorResult[] = [];

    for (const sub of subs) {
      if (!sub.competitor) continue;

      const judgeScores: DetailedJudgeScore[] = sub.scoreCards.map((sc) => {
        const wApp = sc.appearance * SCORE_WEIGHTS.appearance;
        const wTaste = sc.taste * SCORE_WEIGHTS.taste;
        const wTexture = sc.texture * SCORE_WEIGHTS.texture;
        return {
          judgeId: sc.judge.id,
          judgeName: sc.judge.name,
          cbjNumber: sc.judge.cbjNumber,
          appearance: sc.appearance,
          taste: sc.taste,
          texture: sc.texture,
          weightedAppearance: Math.round(wApp * 100) / 100,
          weightedTaste: Math.round(wTaste * 100) / 100,
          weightedTexture: Math.round(wTexture * 100) / 100,
          weightedTotal: Math.round((wApp + wTaste + wTexture) * 100) / 100,
          isDropped: false,
          isDQ: sc.appearance === 1 || sc.taste === 1 || sc.texture === 1,
        };
      });

      // Find the dropped (lowest) score
      let droppedJudgeId: string | null = null;
      if (judgeScores.length >= 6) {
        const sorted = [...judgeScores].sort((a, b) => a.weightedTotal - b.weightedTotal);
        droppedJudgeId = sorted[0].judgeId;
        const dropped = judgeScores.find((j) => j.judgeId === droppedJudgeId);
        if (dropped) dropped.isDropped = true;
      }

      const top5Total = judgeScores
        .filter((j) => !j.isDropped)
        .reduce((sum, j) => sum + j.weightedTotal, 0);

      competitors.push({
        competitorId: sub.competitor.id,
        anonymousNumber: sub.competitor.anonymousNumber,
        teamName: sub.competitor.teamName,
        boxNumber: sub.boxNumber,
        judges: judgeScores,
        top5Total: Math.round(top5Total * 100) / 100,
        droppedJudgeId,
      });
    }

    tables.push({ tableId, tableNumber, competitors });
  }

  tables.sort((a, b) => a.tableNumber - b.tableNumber);

  return {
    categoryRoundId,
    categoryName: round.categoryName,
    tables,
  };
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
