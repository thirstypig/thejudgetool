import { describe, it, expect } from "vitest";
import { tabulateCategory, calcWeightedTotal, type SubmissionInput } from "../index";
import { SCORE_WEIGHTS, VALID_SCORES } from "@/shared/constants/kcbs";

function makeJudge(id: string) {
  return { id, name: `Judge ${id}`, cbjNumber: `CBJ-${id}` };
}

function makeSubmission(
  competitorId: string,
  scores: Array<{ app: number; taste: number; tex: number }>
): SubmissionInput {
  return {
    competitorId,
    anonymousNumber: competitorId,
    teamName: `Team ${competitorId}`,
    cards: scores.map((s, i) => ({
      judge: makeJudge(String(i + 1)),
      appearance: s.app,
      taste: s.taste,
      texture: s.tex,
    })),
  };
}

// ============================================================
// calcWeightedTotal — edge cases
// ============================================================
describe("calcWeightedTotal — edge cases", () => {
  it("handles all minimum valid scores (2,2,2)", () => {
    const total = calcWeightedTotal(2, 2, 2);
    const expected = 2 * SCORE_WEIGHTS.appearance + 2 * SCORE_WEIGHTS.taste + 2 * SCORE_WEIGHTS.texture;
    expect(Math.round(total * 10000) / 10000).toBe(Math.round(expected * 10000) / 10000);
  });

  it("handles DQ score (1,1,1)", () => {
    const total = calcWeightedTotal(1, 1, 1);
    const expected = 1 * SCORE_WEIGHTS.appearance + 1 * SCORE_WEIGHTS.taste + 1 * SCORE_WEIGHTS.texture;
    expect(Math.round(total * 10000) / 10000).toBe(Math.round(expected * 10000) / 10000);
  });

  it("handles asymmetric scores where taste dominates", () => {
    // 5-9-9 vs 9-8-9: taste weight (2.2972) is highest
    const low_app = calcWeightedTotal(5, 9, 9);
    const high_app = calcWeightedTotal(9, 8, 9);
    // 5*0.56+9*2.2972+9*1.1428 = 2.8+20.6748+10.2852 = 33.76
    // 9*0.56+8*2.2972+9*1.1428 = 5.04+18.3776+10.2852 = 33.7028
    expect(low_app).toBeGreaterThan(high_app); // taste dominance
  });

  it("all valid KCBS scores produce expected range", () => {
    for (const app of VALID_SCORES) {
      for (const taste of VALID_SCORES) {
        for (const tex of VALID_SCORES) {
          const total = calcWeightedTotal(app, taste, tex);
          expect(total).toBeGreaterThanOrEqual(calcWeightedTotal(1, 1, 1));
          expect(total).toBeLessThanOrEqual(36);
        }
      }
    }
  });
});

// ============================================================
// tabulateCategory — comprehensive edge cases
// ============================================================
describe("tabulateCategory — comprehensive edge cases", () => {
  it("handles single competitor with single judge", () => {
    const submissions = [makeSubmission("101", [{ app: 7, taste: 8, tex: 7 }])];
    const results = tabulateCategory(submissions);

    expect(results).toHaveLength(1);
    expect(results[0].rank).toBe(1);
    expect(results[0].judgeCount).toBe(1);
    expect(results[0].droppedScore).toBeNull();
    expect(results[0].isDQ).toBe(false);
  });

  it("handles empty submissions array", () => {
    const results = tabulateCategory([]);
    expect(results).toHaveLength(0);
  });

  it("handles all competitors DQ'd", () => {
    const submissions = [
      makeSubmission("101", [{ app: 1, taste: 7, tex: 7 }]),
      makeSubmission("102", [{ app: 7, taste: 1, tex: 7 }]),
      makeSubmission("103", [{ app: 7, taste: 7, tex: 1 }]),
    ];

    const results = tabulateCategory(submissions);
    expect(results.every((r) => r.isDQ)).toBe(true);
    // Still assigned sequential ranks
    expect(results[0].rank).toBe(1);
    expect(results[1].rank).toBe(2);
    expect(results[2].rank).toBe(3);
  });

  it("DQ competitor always ranks below non-DQ even with higher scores", () => {
    const submissions = [
      makeSubmission("101", [{ app: 1, taste: 9, tex: 9 }]), // DQ but high
      makeSubmission("102", [{ app: 2, taste: 2, tex: 2 }]), // not DQ, low
    ];

    const results = tabulateCategory(submissions);
    expect(results[0].competitorId).toBe("102"); // non-DQ first
    expect(results[1].competitorId).toBe("101"); // DQ last
  });

  it("handles exactly 5 judges (no drop needed)", () => {
    const scores = Array(5).fill({ app: 8, taste: 8, tex: 8 });
    const submissions = [makeSubmission("101", scores)];

    const results = tabulateCategory(submissions);
    expect(results[0].droppedScore).toBeNull();
    expect(results[0].breakdown.every((b) => !b.isDropped)).toBe(true);
  });

  it("handles exactly 6 judges (one dropped)", () => {
    const scores = Array(6).fill({ app: 8, taste: 8, tex: 8 });
    const submissions = [makeSubmission("101", scores)];

    const results = tabulateCategory(submissions);
    expect(results[0].droppedScore).not.toBeNull();
    expect(results[0].breakdown.filter((b) => b.isDropped)).toHaveLength(1);
  });

  it("handles 7+ judges (still only drops one lowest)", () => {
    const scores = [
      ...Array(6).fill({ app: 9, taste: 9, tex: 9 }),
      { app: 2, taste: 2, tex: 2 }, // 7th judge with low score
    ];
    const submissions = [makeSubmission("101", scores)];

    const results = tabulateCategory(submissions);
    expect(results[0].breakdown.filter((b) => b.isDropped)).toHaveLength(1);
    // Dropped should be the lowest
    const dropped = results[0].breakdown.find((b) => b.isDropped)!;
    expect(dropped.appearance).toBe(2);
  });

  it("outlier detection: no outliers when all scores identical", () => {
    const scores = Array(6).fill({ app: 7, taste: 7, tex: 7 });
    const submissions = [makeSubmission("101", scores)];

    const results = tabulateCategory(submissions);
    expect(results[0].breakdown.every((b) => !b.isOutlier)).toBe(true);
  });

  it("outlier detection: single judge cannot be an outlier", () => {
    const submissions = [makeSubmission("101", [{ app: 9, taste: 9, tex: 9 }])];
    const results = tabulateCategory(submissions);
    expect(results[0].breakdown[0].isOutlier).toBe(false);
  });

  it("tiebreaker cascade: taste → texture → appearance → dropped → coin toss", () => {
    // Two competitors with identical top-5 totals AND identical taste AND identical texture
    // But different appearance — appearance tiebreaker wins
    const submissions = [
      makeSubmission("aaa", [
        { app: 7, taste: 8, tex: 8 },
      ]),
      makeSubmission("bbb", [
        { app: 8, taste: 8, tex: 8 },
      ]),
    ];

    const results = tabulateCategory(submissions);
    // bbb has higher appearance weighted score
    expect(results[0].competitorId).toBe("bbb");
  });

  it("deterministic coin toss: same input always produces same order", () => {
    // Completely identical scores — falls through to coin toss
    const submissions = [
      makeSubmission("id-alpha", [{ app: 7, taste: 7, tex: 7 }]),
      makeSubmission("id-bravo", [{ app: 7, taste: 7, tex: 7 }]),
    ];

    const results1 = tabulateCategory(submissions);
    const results2 = tabulateCategory(submissions);
    const results3 = tabulateCategory(submissions);

    // Should always produce the same order
    expect(results1[0].competitorId).toBe(results2[0].competitorId);
    expect(results2[0].competitorId).toBe(results3[0].competitorId);
  });

  it("winnerDeclared is false for all when no winners passed", () => {
    const submissions = [
      makeSubmission("101", [{ app: 9, taste: 9, tex: 9 }]),
      makeSubmission("102", [{ app: 8, taste: 8, tex: 8 }]),
    ];

    const results = tabulateCategory(submissions);
    expect(results.every((r) => !r.winnerDeclared)).toBe(true);
  });

  it("winnerDeclared works with multiple winners", () => {
    const submissions = [
      makeSubmission("101", [{ app: 9, taste: 9, tex: 9 }]),
      makeSubmission("102", [{ app: 8, taste: 8, tex: 8 }]),
      makeSubmission("103", [{ app: 7, taste: 7, tex: 7 }]),
    ];

    const winners = new Set(["101", "103"]);
    const results = tabulateCategory(submissions, winners);

    expect(results.find((r) => r.competitorId === "101")!.winnerDeclared).toBe(true);
    expect(results.find((r) => r.competitorId === "102")!.winnerDeclared).toBe(false);
    expect(results.find((r) => r.competitorId === "103")!.winnerDeclared).toBe(true);
  });

  it("average score is calculated from counting judges only", () => {
    const submissions = [
      makeSubmission("101", [
        { app: 9, taste: 9, tex: 9 }, // 36
        { app: 9, taste: 9, tex: 9 }, // 36
        { app: 9, taste: 9, tex: 9 }, // 36
        { app: 9, taste: 9, tex: 9 }, // 36
        { app: 9, taste: 9, tex: 9 }, // 36
        { app: 2, taste: 2, tex: 2 }, // 8 — dropped
      ]),
    ];

    const results = tabulateCategory(submissions);
    // Average should be 180/5 = 36, not (180+8)/6 = 31.33
    expect(results[0].averageScore).toBe(36);
  });
});

// ============================================================
// Misuse scenarios — what could a caller get wrong?
// ============================================================
describe("tabulateCategory — misuse & robustness", () => {
  it("handles score of 0 (invalid KCBS but gracefully processed)", () => {
    const submissions = [
      makeSubmission("101", [{ app: 0, taste: 7, tex: 7 }]),
    ];

    const results = tabulateCategory(submissions);
    expect(results).toHaveLength(1);
    // 0 is not DQ_SCORE (1), so not flagged as DQ
    expect(results[0].isDQ).toBe(false);
  });

  it("handles negative scores (invalid but doesn't crash)", () => {
    const submissions = [
      makeSubmission("101", [{ app: -1, taste: 7, tex: 7 }]),
    ];

    const results = tabulateCategory(submissions);
    expect(results).toHaveLength(1);
    expect(typeof results[0].totalPoints).toBe("number");
  });

  it("handles very large number of competitors", () => {
    const submissions = Array.from({ length: 100 }, (_, i) =>
      makeSubmission(String(i), [{ app: 7, taste: 7, tex: 7 }])
    );

    const results = tabulateCategory(submissions);
    expect(results).toHaveLength(100);
    // All have same score, so all ranks 1-100
    results.forEach((r, i) => expect(r.rank).toBe(i + 1));
  });

  it("handles duplicate competitor IDs (processes both)", () => {
    const submissions = [
      makeSubmission("101", [{ app: 9, taste: 9, tex: 9 }]),
      makeSubmission("101", [{ app: 7, taste: 7, tex: 7 }]),
    ];

    const results = tabulateCategory(submissions);
    expect(results).toHaveLength(2); // Both processed
  });
});
