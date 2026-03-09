import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data (order matters for FK constraints)
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

  // --- Competition ---
  const competition = await prisma.competition.create({
    data: {
      name: "American Royal Open 2026",
      date: new Date("2026-09-20T08:00:00Z"),
      location: "Kansas City, MO",
      status: "ACTIVE",
      judgePin: "1234",
      commentCardsEnabled: true,
      organizerName: "Sarah Mitchell",
      kcbsRepName: "Bob Thompson",
      city: "Kansas City",
      state: "MO",
    },
  });

  // --- Organizer ---
  const organizer = await prisma.user.create({
    data: {
      cbjNumber: "ADMIN",
      name: "Sarah Mitchell",
      email: "organizer@bbq-judge.test",
      role: "ORGANIZER",
      pin: "organizer123",
    },
  });

  // --- 24 Judges ---
  const judgeNames = [
    "Marcus Johnson", "Lisa Chen", "David Williams", "Angela Rodriguez",
    "Robert Kim", "Patricia Brown", "James Wilson", "Maria Garcia",
    "Thomas Lee", "Jennifer Martinez", "William Davis", "Sandra Taylor",
    "Michael Thompson", "Karen White", "Christopher Harris", "Donna Clark",
    "Daniel Lewis", "Nancy Walker", "Matthew Robinson", "Betty Hall",
    "Andrew Young", "Dorothy King", "Joshua Wright", "Helen Lopez",
  ];

  // Table captains: judges 1, 7, 13, 19 (one per table)
  const captainIndices = new Set([0, 6, 12, 18]);

  const judges = [];
  for (let i = 1; i <= 24; i++) {
    const judge = await prisma.user.create({
      data: {
        cbjNumber: String(i).padStart(3, "0"),
        name: judgeNames[i - 1],
        email: `judge${i}@bbq-judge.test`,
        role: captainIndices.has(i - 1) ? "TABLE_CAPTAIN" : "JUDGE",
        pin: "1234",
      },
    });
    judges.push(judge);
  }

  // --- Register all judges for the competition (all checked in) ---
  for (const judge of judges) {
    await prisma.competitionJudge.create({
      data: {
        competitionId: competition.id,
        userId: judge.id,
        checkedIn: true,
        checkedInAt: new Date(),
      },
    });
  }

  // --- 4 Tables, 6 judges each ---
  const tableConfigs = [
    { number: 1, captainIdx: 0, judgeStart: 0 },
    { number: 2, captainIdx: 6, judgeStart: 6 },
    { number: 3, captainIdx: 12, judgeStart: 12 },
    { number: 4, captainIdx: 18, judgeStart: 18 },
  ];

  const tableRecords = [];
  for (const tc of tableConfigs) {
    const table = await prisma.table.create({
      data: {
        competitionId: competition.id,
        tableNumber: tc.number,
        captainId: judges[tc.captainIdx].id,
      },
    });
    tableRecords.push(table);

    for (let i = 0; i < 6; i++) {
      await prisma.tableAssignment.create({
        data: {
          tableId: table.id,
          userId: judges[tc.judgeStart + i].id,
          seatNumber: i + 1,
        },
      });
    }
  }

  // --- 24 Competitors ---
  const competitorData = [
    { anonymousNumber: "101", teamName: "Smokin' Aces" },
    { anonymousNumber: "102", teamName: "Pit Masters United" },
    { anonymousNumber: "103", teamName: "Holy Smokes BBQ" },
    { anonymousNumber: "104", teamName: "The Rib Whisperers" },
    { anonymousNumber: "105", teamName: "Flame & Fortune" },
    { anonymousNumber: "106", teamName: "Low & Slow Legends" },
    { anonymousNumber: "107", teamName: "Char & Barrel" },
    { anonymousNumber: "108", teamName: "Backyard Champions" },
    { anonymousNumber: "109", teamName: "Smoke Ring Society" },
    { anonymousNumber: "110", teamName: "The Brisket Brothers" },
    { anonymousNumber: "111", teamName: "Ember & Oak" },
    { anonymousNumber: "112", teamName: "Pitfire Collective" },
    { anonymousNumber: "113", teamName: "Sweet Heat BBQ" },
    { anonymousNumber: "114", teamName: "Burnin' Love Smokehouse" },
    { anonymousNumber: "115", teamName: "Ash & Iron" },
    { anonymousNumber: "116", teamName: "Hickory Haven" },
    { anonymousNumber: "117", teamName: "Smoke Signal BBQ" },
    { anonymousNumber: "118", teamName: "The Grill Sergeants" },
    { anonymousNumber: "119", teamName: "Red Oak Revival" },
    { anonymousNumber: "120", teamName: "Mesquite Mavericks" },
    { anonymousNumber: "121", teamName: "Carbon & Spice" },
    { anonymousNumber: "122", teamName: "Pitmaster's Pride" },
    { anonymousNumber: "123", teamName: "Southern Comfort Q" },
    { anonymousNumber: "124", teamName: "Firebox Legends" },
  ];

  const competitors = [];
  for (const data of competitorData) {
    const c = await prisma.competitor.create({
      data: { competitionId: competition.id, ...data },
    });
    competitors.push(c);
  }

  // --- 4 KCBS Category Rounds ---
  const categories = [
    { name: "Chicken", order: 1, status: "ACTIVE" },
    { name: "Pork Ribs", order: 2, status: "PENDING" },
    { name: "Pork", order: 3, status: "PENDING" },
    { name: "Brisket", order: 4, status: "PENDING" },
  ];

  const rounds = [];
  for (const cat of categories) {
    const round = await prisma.categoryRound.create({
      data: {
        competitionId: competition.id,
        categoryName: cat.name,
        categoryType: "MANDATORY",
        order: cat.order,
        status: cat.status,
      },
    });
    rounds.push(round);
  }

  const chickenRound = rounds[0];

  // --- Submissions for Chicken round ---
  // Each table gets 6 competitors (24 total, 6 per table)
  for (let tableIdx = 0; tableIdx < 4; tableIdx++) {
    for (let i = 0; i < 6; i++) {
      const compIdx = tableIdx * 6 + i;
      await prisma.submission.create({
        data: {
          competitorId: competitors[compIdx].id,
          categoryRoundId: chickenRound.id,
          tableId: tableRecords[tableIdx].id,
          boxNumber: i + 1,
          boxCode: competitors[compIdx].anonymousNumber,
        },
      });
    }
  }

  // --- Pre-fill scorecards for Table 1 Chicken (first 4 competitors) ---
  const table1Submissions = await prisma.submission.findMany({
    where: { tableId: tableRecords[0].id, categoryRoundId: chickenRound.id },
    orderBy: { boxNumber: "asc" },
  });

  const scoreData = [
    // competitor 101: strong across the board
    { app: 8, taste: 9, tex: 8 },
    { app: 7, taste: 8, tex: 8 },
    { app: 8, taste: 8, tex: 7 },
    { app: 9, taste: 9, tex: 8 },
    { app: 7, taste: 8, tex: 8 },
    { app: 8, taste: 9, tex: 9 },
    // competitor 102: good but not great
    { app: 7, taste: 7, tex: 6 },
    { app: 6, taste: 7, tex: 7 },
    { app: 7, taste: 6, tex: 7 },
    { app: 7, taste: 7, tex: 6 },
    { app: 6, taste: 7, tex: 7 },
    { app: 7, taste: 7, tex: 7 },
    // competitor 103: fair
    { app: 6, taste: 6, tex: 5 },
    { app: 5, taste: 6, tex: 6 },
    { app: 6, taste: 5, tex: 6 },
    { app: 6, taste: 6, tex: 5 },
    { app: 5, taste: 6, tex: 6 },
    { app: 6, taste: 6, tex: 6 },
    // competitor 104: mixed, one DQ score
    { app: 7, taste: 8, tex: 7 },
    { app: 8, taste: 7, tex: 7 },
    { app: 7, taste: 7, tex: 8 },
    { app: 1, taste: 7, tex: 7 }, // DQ from judge 4 (appearance = 1)
    { app: 7, taste: 8, tex: 7 },
    null, // Judge 6 hasn't scored yet
  ];

  let scoreIdx = 0;
  for (let compIdx = 0; compIdx < 4; compIdx++) {
    for (let judgeIdx = 0; judgeIdx < 6; judgeIdx++) {
      const scores = scoreData[scoreIdx];
      scoreIdx++;

      if (scores === null) continue;

      const submittedAt = new Date(
        Date.now() - (24 - scoreIdx) * 60 * 1000
      );

      await prisma.scoreCard.create({
        data: {
          submissionId: table1Submissions[compIdx].id,
          judgeId: judges[judgeIdx].id,
          appearance: scores.app,
          taste: scores.taste,
          texture: scores.tex,
          locked: true,
          submittedAt,
          appearanceSubmittedAt: submittedAt,
        },
      });
    }
  }

  // --- Pending correction request for DQ score ---
  const dqScoreCard = await prisma.scoreCard.findFirst({
    where: {
      submissionId: table1Submissions[3].id,
      judgeId: judges[3].id,
    },
  });

  if (dqScoreCard) {
    await prisma.correctionRequest.create({
      data: {
        scoreCardId: dqScoreCard.id,
        judgeId: judges[3].id,
        reason:
          "I accidentally submitted a 1 (DQ) for appearance. The chicken had good presentation and I meant to score a 7.",
        status: "PENDING",
      },
    });
  }

  // --- Audit log entries ---
  await prisma.auditLog.create({
    data: {
      competitionId: competition.id,
      actorId: organizer.id,
      action: "CREATE_COMPETITION",
      entityId: competition.id,
      entityType: "Competition",
    },
  });

  await prisma.auditLog.create({
    data: {
      competitionId: competition.id,
      actorId: organizer.id,
      action: "ADVANCE_CATEGORY",
      entityId: chickenRound.id,
      entityType: "CategoryRound",
    },
  });

  // --- Summary ---
  console.log("\n  Seed data created successfully!\n");
  console.log("  Competition: American Royal Open 2026 (ACTIVE)");
  console.log("  ───────────────────────────────────────────────");
  console.log("  Organizer:  organizer@bbq-judge.test / organizer123");
  console.log("  ───────────────────────────────────────────────");
  console.log("  24 Judges:  CBJ-001 through CBJ-024, PIN: 1234");
  console.log("  Table 1:    CBJ-001 (captain) + CBJ-002–006");
  console.log("  Table 2:    CBJ-007 (captain) + CBJ-008–012");
  console.log("  Table 3:    CBJ-013 (captain) + CBJ-014–018");
  console.log("  Table 4:    CBJ-019 (captain) + CBJ-020–024");
  console.log("  ───────────────────────────────────────────────");
  console.log("  24 Competitors: 101–124");
  console.log("  Categories:  Chicken (ACTIVE) | Pork Ribs, Pork, Brisket (PENDING)");
  console.log("  ───────────────────────────────────────────────");
  console.log("  Pre-filled:  Table 1 Chicken — 4 of 6 competitors scored");
  console.log("               Competitor 104 has a DQ score + pending correction");
  console.log("               Competitors 105, 106 await scoring");
  console.log("               Tables 2–4 have no scores yet\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
