/**
 * Exhaustive QA Simulation
 *
 * Simulates a full KCBS competition lifecycle:
 * 1. Seeds fresh data (24 teams, 24 judges, 4 tables)
 * 2. Generates + approves box distribution
 * 3. Advances through all 4 category rounds
 * 4. All 24 judges score all 6 competitors at their table for each category
 * 5. Includes random DQ scores and correction requests
 * 6. Validates BR-2 (no competitor at same table twice)
 * 7. Validates box number uniqueness
 * 8. Validates tabulation results
 *
 * Run: npx tsx scripts/simulate-competition.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

// Safety: refuse to run in production
if (process.env.NODE_ENV === "production") {
  console.error("ERROR: This script cannot be run in production. It wipes all data.");
  process.exit(1);
}

const SALT_ROUNDS = 10;
import {
  generateBoxDistribution,
  validateDistribution,
} from "../src/features/competition/utils/generateBoxDistribution";
import {
  tabulateCategory,
  type SubmissionInput,
} from "../src/features/tabulation/utils";
import {
  VALID_SCORES,
  SCORE_WEIGHTS,
} from "../src/shared/constants/kcbs";

const prisma = new PrismaClient();

// Markdown report accumulator
const reportLines: string[] = [];
function md(line: string = "") {
  reportLines.push(line);
}

// Helpers
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomScore(): number {
  // Weighted toward higher scores (more realistic)
  const weights = [1, 1, 3, 8, 15, 20, 15]; // 1,2,5,6,7,8,9
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < VALID_SCORES.length; i++) {
    r -= weights[i];
    if (r <= 0) return VALID_SCORES[i];
  }
  return 7;
}

let passed = 0;
let failed = 0;
const errors: string[] = [];

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
  } else {
    failed++;
    errors.push(`FAIL: ${msg}`);
    console.error(`  ✗ ${msg}`);
  }
}

async function main() {
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║  BBQ Judge — Exhaustive QA Simulation            ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  // ═══════════════════════════════════════════
  // PHASE 1: Clean + Seed
  // ═══════════════════════════════════════════
  console.log("▶ Phase 1: Seeding fresh data...");

  await prisma.auditLog.deleteMany();
  await prisma.commentCard.deleteMany();
  await prisma.correctionRequest.deleteMany();
  await prisma.scoreCard.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.categoryRound.deleteMany();
  await prisma.tableAssignment.deleteMany();
  await prisma.table.deleteMany();
  await prisma.competitionJudge.deleteMany();
  await prisma.competitor.deleteMany();
  await prisma.user.deleteMany();
  await prisma.competition.deleteMany();

  const competition = await prisma.competition.create({
    data: {
      name: "QA Simulation 2026",
      date: new Date("2026-09-20T08:00:00Z"),
      location: "Kansas City, MO",
      status: "ACTIVE",
      judgePin: "9999",
      commentCardsEnabled: true,
      organizerName: "QA Bot",
      kcbsRepName: "Test Rep",
      city: "Kansas City",
      state: "MO",
    },
  });

  const organizer = await prisma.user.create({
    data: {
      cbjNumber: "ADMIN",
      name: "QA Organizer",
      email: "organizer@qa-test.test",
      role: "ORGANIZER",
      pin: await bcrypt.hash("admin123", SALT_ROUNDS),
    },
  });

  // 24 judges (batch)
  const captainIndices = new Set([0, 6, 12, 18]);
  const hashedPin = await bcrypt.hash("1234", SALT_ROUNDS);
  const judgeData = Array.from({ length: 24 }, (_, i) => ({
    cbjNumber: String(200000 + i + 1),
    name: `QA Judge ${i + 1}`,
    email: `qa-judge-${i + 1}@test.test`,
    role: captainIndices.has(i) ? "TABLE_CAPTAIN" : "JUDGE",
    pin: hashedPin,
  }));
  // createManyAndReturn gives us IDs back
  const judges = await prisma.user.createManyAndReturn({ data: judgeData });
  // Sort by cbjNumber to maintain deterministic order
  judges.sort((a, b) => a.cbjNumber.localeCompare(b.cbjNumber));

  await prisma.competitionJudge.createMany({
    data: judges.map((j) => ({
      competitionId: competition.id,
      userId: j.id,
      checkedIn: true,
      checkedInAt: new Date(),
    })),
  });

  // 4 tables (batch, then assign judges)
  const tableData = Array.from({ length: 4 }, (_, t) => ({
    competitionId: competition.id,
    tableNumber: t + 1,
    captainId: judges[t * 6].id,
  }));
  const tables = await prisma.table.createManyAndReturn({ data: tableData });
  tables.sort((a, b) => a.tableNumber - b.tableNumber);

  const assignmentData = tables.flatMap((table, t) =>
    Array.from({ length: 6 }, (_, j) => ({
      tableId: table.id,
      userId: judges[t * 6 + j].id,
      seatNumber: null as number | null,
    }))
  );
  await prisma.tableAssignment.createMany({ data: assignmentData });

  // 24 competitors (batch, all checked in)
  const competitorData = Array.from({ length: 24 }, (_, i) => ({
    competitionId: competition.id,
    anonymousNumber: String(200 + i + 1),
    teamName: `QA Team ${i + 1}`,
    checkedIn: true,
    checkedInAt: new Date(),
  }));
  const competitors = await prisma.competitor.createManyAndReturn({ data: competitorData });
  competitors.sort((a, b) => a.anonymousNumber.localeCompare(b.anonymousNumber));

  // 4 category rounds (batch)
  const categoryNames = ["Chicken", "Pork Ribs", "Pork", "Brisket"];
  const roundData = categoryNames.map((name, i) => ({
    competitionId: competition.id,
    categoryName: name,
    categoryType: "MANDATORY",
    order: i + 1,
    status: i === 0 ? "ACTIVE" : "PENDING",
  }));
  const rounds = await prisma.categoryRound.createManyAndReturn({ data: roundData });
  rounds.sort((a, b) => a.order - b.order);

  console.log(`  ✓ Created competition with ${competitors.length} teams, ${judges.length} judges, ${tables.length} tables, ${rounds.length} categories\n`);

  // Report header + setup
  md(`# BBQ Judge — Simulation Report`);
  md();
  md(`**Competition:** ${competition.name}`);
  md(`**Date:** ${competition.date.toISOString().split("T")[0]}`);
  md(`**Generated:** ${new Date().toISOString()}`);
  md();
  md(`## Setup`);
  md();
  md(`| Item | Count |`);
  md(`|------|-------|`);
  md(`| BBQ Teams | ${competitors.length} |`);
  md(`| Judges | ${judges.length} |`);
  md(`| Tables | ${tables.length} |`);
  md(`| Categories | ${rounds.length} |`);
  md();

  // ═══════════════════════════════════════════
  // PHASE 2: Box Distribution
  // ═══════════════════════════════════════════
  console.log("▶ Phase 2: Box Distribution...");

  const distribution = generateBoxDistribution(
    competitors.map((c) => ({ id: c.id, anonymousNumber: c.anonymousNumber })),
    tables.map((t) => ({ id: t.id, tableNumber: t.tableNumber })),
    rounds.map((r) => ({ id: r.id, categoryName: r.categoryName, order: r.order }))
  );

  // Validate BR-2
  const validation = validateDistribution(distribution);
  assert(validation.valid, `BR-2 validation: no competitor appears at same table across categories (${validation.violations.length} violations)`);

  if (!validation.valid) {
    for (const v of validation.violations.slice(0, 5)) {
      console.error(`    Violation: competitor ${v.competitorId} at table ${v.tableId} in categories: ${v.categories.join(", ")}`);
    }
  }

  // Validate box number uniqueness
  const allBoxNumbers = new Set<number>();
  let boxDuplicates = 0;
  let totalBoxes = 0;
  for (const cat of distribution) {
    for (const table of cat.tables) {
      for (const comp of table.competitors) {
        totalBoxes++;
        if (allBoxNumbers.has(comp.boxNumber)) {
          boxDuplicates++;
        }
        allBoxNumbers.add(comp.boxNumber);
      }
    }
  }
  assert(boxDuplicates === 0, `Box number uniqueness: ${totalBoxes} boxes, ${boxDuplicates} duplicates`);

  // Validate box number format (uniform leading digit)
  const boxNums = Array.from(allBoxNumbers);
  const leadingDigits = new Set(boxNums.map((n) => String(n)[0]));
  assert(leadingDigits.size === 1, `Box numbers have uniform leading digit: ${Array.from(leadingDigits).join(",")}`);

  // Validate each table has exactly 6 competitors per category
  for (const cat of distribution) {
    for (const table of cat.tables) {
      assert(
        table.competitors.length === 6,
        `${cat.categoryName} Table ${table.tableNumber}: has ${table.competitors.length} competitors (expected 6)`
      );
    }
  }

  // Validate each competitor appears exactly once per category
  for (const cat of distribution) {
    const compIds = new Set<string>();
    for (const table of cat.tables) {
      for (const comp of table.competitors) {
        assert(
          !compIds.has(comp.competitorId),
          `${cat.categoryName}: competitor ${comp.anonymousNumber} appears only once`
        );
        compIds.add(comp.competitorId);
      }
    }
    assert(compIds.size === 24, `${cat.categoryName}: all 24 competitors assigned (got ${compIds.size})`);
  }

  // Save distribution to DB (create submissions)
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
  await prisma.submission.createMany({ data: submissionData });
  await prisma.competition.update({
    where: { id: competition.id },
    data: { distributionStatus: "APPROVED" },
  });

  const savedSubmissions = await prisma.submission.count({
    where: { categoryRound: { competitionId: competition.id } },
  });
  assert(savedSubmissions === 96, `Saved ${savedSubmissions} submissions (expected 96 = 4 categories × 4 tables × 6 competitors)`);

  console.log(`  ✓ Distribution validated and saved\n`);

  // Report: Box Distribution
  md(`## Box Distribution`);
  md();
  md(`- **BR-2 validation:** ${validation.valid ? "PASS" : "FAIL"} (${validation.violations.length} violations)`);
  md(`- **Box uniqueness:** ${boxDuplicates === 0 ? "PASS" : "FAIL"} (${totalBoxes} boxes, ${boxDuplicates} duplicates)`);
  md(`- **Uniform leading digit:** ${leadingDigits.size === 1 ? "PASS" : "FAIL"} (digits: ${Array.from(leadingDigits).join(", ")})`);
  md(`- **Submissions saved:** ${savedSubmissions}`);
  md();

  // ═══════════════════════════════════════════
  // PHASE 3: Simulate Scoring (all 4 categories)
  // ═══════════════════════════════════════════
  console.log("▶ Phase 3: Simulating judge scoring...");

  let totalScoreCards = 0;
  let dqCount = 0;
  let correctionCount = 0;
  const categoryResults: Record<string, ReturnType<typeof tabulateCategory>> = {};

  for (let catIdx = 0; catIdx < 4; catIdx++) {
    const round = rounds[catIdx];
    const catName = categoryNames[catIdx];

    // Activate this round if not already
    if (catIdx > 0) {
      // Close previous round
      await prisma.categoryRound.update({
        where: { id: rounds[catIdx - 1].id },
        data: { status: "SUBMITTED" },
      });
      // Activate current
      await prisma.categoryRound.update({
        where: { id: round.id },
        data: { status: "ACTIVE" },
      });
    }

    // Get submissions for this round
    const submissions = await prisma.submission.findMany({
      where: { categoryRoundId: round.id },
      include: {
        table: true,
        competitor: true,
      },
    });

    assert(submissions.length === 24, `${catName}: has ${submissions.length} submissions (expected 24)`);

    // Group submissions by table
    const submissionsByTable = new Map<string, typeof submissions>();
    for (const sub of submissions) {
      const key = sub.tableId;
      if (!submissionsByTable.has(key)) submissionsByTable.set(key, []);
      submissionsByTable.get(key)!.push(sub);
    }

    // Build all score cards for this category in memory, then batch insert
    const scoreCardBatch: Array<{
      submissionId: string;
      judgeId: string;
      appearance: number;
      taste: number;
      texture: number;
      locked: boolean;
      submittedAt: Date;
      appearanceSubmittedAt: Date;
    }> = [];
    // Track which cards need correction requests (by index in batch)
    const correctionCandidates: Array<{ submissionId: string; judgeId: string }> = [];

    for (const [tableId, tableSubs] of Array.from(submissionsByTable)) {
      const tableIdx = tables.findIndex((t) => t.id === tableId);
      const tableJudges = judges.slice(tableIdx * 6, tableIdx * 6 + 6);

      for (const judge of tableJudges) {
        for (const sub of tableSubs) {
          const isDQ = Math.random() < 0.02;
          const app = isDQ ? 1 : randomScore();
          const taste = randomScore();
          const tex = randomScore();
          if (isDQ) dqCount++;

          scoreCardBatch.push({
            submissionId: sub.id,
            judgeId: judge.id,
            appearance: app,
            taste,
            texture: tex,
            locked: true,
            submittedAt: new Date(),
            appearanceSubmittedAt: new Date(),
          });
          totalScoreCards++;

          if (!isDQ && Math.random() < 0.01) {
            correctionCandidates.push({ submissionId: sub.id, judgeId: judge.id });
          }
        }
      }
    }

    // Batch insert all score cards for this category
    await prisma.scoreCard.createMany({ data: scoreCardBatch });

    // Create correction requests (need to look up scoreCard IDs)
    for (const { submissionId, judgeId } of correctionCandidates) {
      const scoreCard = await prisma.scoreCard.findFirst({
        where: { submissionId, judgeId },
        select: { id: true },
      });
      if (scoreCard) {
        await prisma.correctionRequest.create({
          data: {
            scoreCardId: scoreCard.id,
            judgeId,
            reason: "Simulated correction request for QA testing",
            status: pick(["PENDING", "APPROVED", "DENIED"] as const),
          },
        });
        correctionCount++;
      }
    }

    // Validate: each submission should have exactly 6 score cards
    for (const sub of submissions) {
      const cardCount = await prisma.scoreCard.count({
        where: { submissionId: sub.id },
      });
      assert(
        cardCount === 6,
        `${catName} submission ${sub.boxNumber}: has ${cardCount} score cards (expected 6)`
      );
    }

    // Tabulate results for this category
    const tabulationInput: SubmissionInput[] = [];
    for (const sub of submissions) {
      const cards = await prisma.scoreCard.findMany({
        where: { submissionId: sub.id },
        include: { judge: { select: { id: true, name: true, cbjNumber: true } } },
      });
      tabulationInput.push({
        competitorId: sub.competitorId!,
        anonymousNumber: sub.competitor!.anonymousNumber,
        teamName: sub.competitor!.teamName,
        cards: cards.map((c) => ({
          judge: c.judge,
          appearance: c.appearance,
          taste: c.taste,
          texture: c.texture,
        })),
      });
    }

    const results = tabulateCategory(tabulationInput);
    categoryResults[catName] = results;

    // Validate rankings
    assert(results.length === 24, `${catName} tabulation: ${results.length} results (expected 24)`);
    assert(results[0].rank === 1, `${catName} tabulation: first place rank is 1`);
    assert(results[23].rank === 24, `${catName} tabulation: last place rank is 24`);

    // Validate scores are within range
    for (const r of results) {
      assert(
        r.totalPoints >= 0 && r.totalPoints <= 180,
        `${catName} ${r.anonymousNumber}: total ${r.totalPoints} in valid range [0, 180]`
      );
      for (const b of r.breakdown) {
        assert(
          VALID_SCORES.includes(b.appearance as any),
          `${catName} ${r.anonymousNumber} judge ${b.cbjNumber}: appearance ${b.appearance} is valid KCBS score`
        );
        assert(
          VALID_SCORES.includes(b.taste as any),
          `${catName} ${r.anonymousNumber} judge ${b.cbjNumber}: taste ${b.taste} is valid KCBS score`
        );
        assert(
          VALID_SCORES.includes(b.texture as any),
          `${catName} ${r.anonymousNumber} judge ${b.cbjNumber}: texture ${b.texture} is valid KCBS score`
        );
      }
    }

    // Validate ranking order (higher points should rank higher)
    for (let i = 1; i < results.length; i++) {
      const prev = results[i - 1];
      const curr = results[i];
      // DQ entries sort to bottom
      if (!prev.isDQ && !curr.isDQ) {
        assert(
          prev.totalPoints >= curr.totalPoints - 0.001,
          `${catName}: rank ${prev.rank} (${prev.totalPoints.toFixed(2)}) >= rank ${curr.rank} (${curr.totalPoints.toFixed(2)})`
        );
      }
    }

    // Mark round as submitted
    await prisma.categoryRound.update({
      where: { id: round.id },
      data: { status: "SUBMITTED" },
    });

    console.log(`  ✓ ${catName}: scored and tabulated (winner: ${results[0].anonymousNumber} / ${results[0].teamName} with ${results[0].totalPoints.toFixed(2)} pts)`);
  }

  // Close competition
  await prisma.competition.update({
    where: { id: competition.id },
    data: { status: "CLOSED" },
  });

  console.log(`  ✓ Total: ${totalScoreCards} score cards, ${dqCount} DQs, ${correctionCount} corrections\n`);

  // Report: Scoring results per category
  md(`## Scoring Results`);
  md();
  md(`**Summary:** ${totalScoreCards} score cards, ${dqCount} DQs, ${correctionCount} correction requests`);
  md();
  for (const [catName, results] of Object.entries(categoryResults)) {
    md(`### ${catName}`);
    md();
    md(`| Rank | Team # | Team Name | Score | DQ |`);
    md(`|------|--------|-----------|-------|----|`);
    for (let i = 0; i < Math.min(10, results.length); i++) {
      const r = results[i];
      md(`| ${r.rank} | ${r.anonymousNumber} | ${r.teamName} | ${r.totalPoints.toFixed(2)} | ${r.isDQ ? "Yes" : ""} |`);
    }
    if (results.length > 10) {
      md(`| ... | *${results.length - 10} more teams* | | | |`);
    }
    md();
  }

  // ═══════════════════════════════════════════
  // PHASE 4: Cross-Category Validation
  // ═══════════════════════════════════════════
  console.log("▶ Phase 4: Cross-category validation...");

  // BR-2: Verify no competitor at same table in multiple categories
  const tableCompetitorHistory = new Map<string, Map<string, string[]>>();
  const allSubmissions = await prisma.submission.findMany({
    where: { categoryRound: { competitionId: competition.id } },
    include: {
      categoryRound: { select: { categoryName: true } },
      table: { select: { id: true, tableNumber: true } },
      competitor: { select: { id: true, anonymousNumber: true } },
    },
  });

  for (const sub of allSubmissions) {
    const tableKey = sub.table.id;
    if (!tableCompetitorHistory.has(tableKey)) {
      tableCompetitorHistory.set(tableKey, new Map());
    }
    const compMap = tableCompetitorHistory.get(tableKey)!;
    const compKey = sub.competitorId!;
    if (!compMap.has(compKey)) compMap.set(compKey, []);
    compMap.get(compKey)!.push(sub.categoryRound.categoryName);
  }

  let br2Violations = 0;
  tableCompetitorHistory.forEach((compMap, tableId) => {
    compMap.forEach((categories, compId) => {
      if (categories.length > 1) {
        br2Violations++;
        const table = allSubmissions.find((s) => s.table.id === tableId);
        const comp = allSubmissions.find((s) => s.competitorId === compId);
        console.error(`    BR-2 violation: competitor ${comp?.competitor?.anonymousNumber} at table ${table?.table?.tableNumber} in ${categories.join(", ")}`);
      }
    });
  });
  assert(br2Violations === 0, `BR-2 across all categories: ${br2Violations} violations`);

  // Verify total submissions
  assert(allSubmissions.length === 96, `Total submissions: ${allSubmissions.length} (expected 96)`);

  // Verify all box numbers are unique
  const allSavedBoxNumbers = new Set(allSubmissions.map((s) => s.boxNumber));
  assert(allSavedBoxNumbers.size === 96, `All saved box numbers unique: ${allSavedBoxNumbers.size} unique out of 96`);

  // Verify total score cards
  const totalCards = await prisma.scoreCard.count({
    where: { submission: { categoryRound: { competitionId: competition.id } } },
  });
  assert(totalCards === 576, `Total score cards: ${totalCards} (expected 576 = 24 submissions × 6 judges × 4 categories)`);

  console.log(`  ✓ Cross-category validation complete\n`);

  // Report: Cross-category validation
  md(`## Cross-Category Validation`);
  md();
  md(`- **BR-2 (no repeat competitor at same table):** ${br2Violations === 0 ? "PASS" : "FAIL"} (${br2Violations} violations)`);
  md(`- **Total submissions:** ${allSubmissions.length} (expected 96)`);
  md(`- **Unique box numbers:** ${allSavedBoxNumbers.size} / 96`);
  md(`- **Total score cards:** ${totalCards} (expected 576)`);
  md();

  // ═══════════════════════════════════════════
  // PHASE 5: Overall Results
  // ═══════════════════════════════════════════
  console.log("▶ Phase 5: Overall standings...");

  // Calculate grand champion (sum of all category points)
  const overallStandings = new Map<string, { name: string; number: string; total: number; categories: Record<string, number> }>();
  for (const [catName, results] of Object.entries(categoryResults)) {
    for (const r of results) {
      if (!overallStandings.has(r.competitorId)) {
        overallStandings.set(r.competitorId, {
          name: r.teamName ?? "",
          number: r.anonymousNumber,
          total: 0,
          categories: {},
        });
      }
      const standing = overallStandings.get(r.competitorId)!;
      standing.total += r.totalPoints;
      standing.categories[catName] = r.totalPoints;
    }
  }

  const sortedOverall = Array.from(overallStandings.values())
    .sort((a, b) => b.total - a.total);

  console.log("\n  ┌─────────────────────────────────────────────────────────────────────┐");
  console.log("  │  OVERALL STANDINGS                                                  │");
  console.log("  ├──────┬──────────────────┬──────────┬──────────┬──────────┬──────────┤");
  console.log("  │ Rank │ Team             │ Chicken  │ Ribs     │ Pork     │ Brisket  │");
  console.log("  ├──────┼──────────────────┼──────────┼──────────┼──────────┼──────────┤");

  for (let i = 0; i < Math.min(10, sortedOverall.length); i++) {
    const s = sortedOverall[i];
    const c = s.categories;
    console.log(
      `  │ ${String(i + 1).padStart(4)} │ ${s.number.padEnd(16)} │ ${(c["Chicken"] ?? 0).toFixed(1).padStart(8)} │ ${(c["Pork Ribs"] ?? 0).toFixed(1).padStart(8)} │ ${(c["Pork"] ?? 0).toFixed(1).padStart(8)} │ ${(c["Brisket"] ?? 0).toFixed(1).padStart(8)} │`
    );
  }
  console.log("  └──────┴──────────────────┴──────────┴──────────┴──────────┴──────────┘");

  const champion = sortedOverall[0];
  console.log(`\n  🏆 Grand Champion: ${champion.name} (#${champion.number}) — ${champion.total.toFixed(2)} total points\n`);

  // Report: Overall Standings
  md(`## Overall Standings`);
  md();
  md(`| Rank | Team # | Team Name | Chicken | Ribs | Pork | Brisket | Total |`);
  md(`|------|--------|-----------|---------|------|------|---------|-------|`);
  for (let i = 0; i < sortedOverall.length; i++) {
    const s = sortedOverall[i];
    const c = s.categories;
    md(`| ${i + 1} | ${s.number} | ${s.name} | ${(c["Chicken"] ?? 0).toFixed(2)} | ${(c["Pork Ribs"] ?? 0).toFixed(2)} | ${(c["Pork"] ?? 0).toFixed(2)} | ${(c["Brisket"] ?? 0).toFixed(2)} | ${s.total.toFixed(2)} |`);
  }
  md();

  // Report: Grand Champion
  md(`## Grand Champion`);
  md();
  md(`**${champion.name}** (#${champion.number}) — **${champion.total.toFixed(2)} total points**`);
  md();

  // ═══════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  QA SIMULATION SUMMARY                           ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log(`  Assertions passed: ${passed}`);
  console.log(`  Assertions failed: ${failed}`);
  console.log(`  Score cards created: ${totalScoreCards}`);
  console.log(`  DQ scores: ${dqCount}`);
  console.log(`  Correction requests: ${correctionCount}`);
  console.log(`  Box numbers: ${allSavedBoxNumbers.size} unique`);

  // Report: Assertion Summary
  md(`## Assertion Summary`);
  md();
  md(`| Metric | Value |`);
  md(`|--------|-------|`);
  md(`| Passed | ${passed} |`);
  md(`| Failed | ${failed} |`);
  md(`| Score cards | ${totalScoreCards} |`);
  md(`| DQ scores | ${dqCount} |`);
  md(`| Corrections | ${correctionCount} |`);
  md(`| Unique box numbers | ${allSavedBoxNumbers.size} |`);
  md();
  if (failed > 0) {
    md(`### Failures`);
    md();
    for (const err of errors) {
      md(`- ${err}`);
    }
    md();
  }
  md(`**Result:** ${failed === 0 ? "ALL ASSERTIONS PASSED" : `${failed} FAILURES`}`);

  // Write report file
  const reportsDir = join(process.cwd(), "reports");
  mkdirSync(reportsDir, { recursive: true });
  const reportPath = join(reportsDir, "simulation-report.md");
  writeFileSync(reportPath, reportLines.join("\n") + "\n");
  console.log(`\n  📄 Report written to ${reportPath}`);

  if (failed > 0) {
    console.log(`\n  ✗ ${failed} FAILURES:`);
    for (const err of errors) {
      console.log(`    ${err}`);
    }
    process.exit(1);
  } else {
    console.log(`\n  ✓ ALL ${passed} ASSERTIONS PASSED — Competition simulation successful!\n`);
  }
}

main()
  .catch((e) => {
    console.error("Simulation failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
