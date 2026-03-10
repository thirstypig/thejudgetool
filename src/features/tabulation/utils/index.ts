import type { JudgeScoreBreakdown, CategoryResult } from "../types";
import {
  SCORE_WEIGHTS,
  DQ_SCORE,
  COUNTING_JUDGES,
} from "@/shared/constants/kcbs";

export interface ScoreCardInput {
  judge: { id: string; name: string; cbjNumber: string };
  appearance: number;
  taste: number;
  texture: number;
}

export interface SubmissionInput {
  competitorId: string;
  anonymousNumber: string;
  teamName: string;
  cards: ScoreCardInput[];
}

/** Calculate KCBS weighted total for a single judge's scores */
export function calcWeightedTotal(
  appearance: number,
  taste: number,
  texture: number
): number {
  return (
    appearance * SCORE_WEIGHTS.appearance +
    taste * SCORE_WEIGHTS.taste +
    texture * SCORE_WEIGHTS.texture
  );
}

/**
 * Pure tabulation function — KCBS-style weighted scoring.
 *
 * Rules:
 * - Weighted: appearance × 0.56, taste × 2.2972, texture × 1.1428 (max 36/judge)
 * - Drop lowest weighted total (only top 5 of 6 count)
 * - Score of 1 in any dimension = DQ
 * - Tiebreaking: cumulative Taste → Tenderness → Appearance → dropped low score → coin toss
 */
export function tabulateCategory(
  submissions: SubmissionInput[],
  declaredWinners: Set<string> = new Set()
): CategoryResult[] {
  const results: CategoryResult[] = [];

  for (const entry of submissions) {
    const isDQ = entry.cards.some(
      (c) =>
        c.appearance === DQ_SCORE ||
        c.taste === DQ_SCORE ||
        c.texture === DQ_SCORE
    );

    const breakdown: JudgeScoreBreakdown[] = entry.cards.map((card) => {
      const total = card.appearance + card.taste + card.texture;
      const weightedTotal = calcWeightedTotal(
        card.appearance,
        card.taste,
        card.texture
      );
      return {
        judgeId: card.judge.id,
        judgeName: card.judge.name,
        cbjNumber: card.judge.cbjNumber,
        appearance: card.appearance,
        taste: card.taste,
        texture: card.texture,
        total,
        weightedTotal: Math.round(weightedTotal * 10000) / 10000,
        isDQ:
          card.appearance === DQ_SCORE ||
          card.taste === DQ_SCORE ||
          card.texture === DQ_SCORE,
        isOutlier: false,
        isDropped: false,
      };
    });

    // Outlier detection: flag scores >2 weighted pts from average
    if (breakdown.length > 1) {
      const avgWeighted =
        breakdown.reduce((s, b) => s + b.weightedTotal, 0) / breakdown.length;
      for (const b of breakdown) {
        if (Math.abs(b.weightedTotal - avgWeighted) > 2) {
          b.isOutlier = true;
        }
      }
    }

    // Drop lowest: sort by weighted total ascending, mark the lowest as dropped
    let droppedScore: number | null = null;
    if (breakdown.length > COUNTING_JUDGES) {
      const sorted = [...breakdown].sort(
        (a, b) => a.weightedTotal - b.weightedTotal
      );
      const dropped = sorted[0];
      // Find and mark the dropped judge in the original breakdown
      const droppedIdx = breakdown.findIndex(
        (b) => b.judgeId === dropped.judgeId
      );
      if (droppedIdx >= 0) {
        breakdown[droppedIdx].isDropped = true;
        droppedScore = dropped.weightedTotal;
      }
    }

    // Sum weighted totals of counting judges (non-dropped)
    const countingJudges = breakdown.filter((b) => !b.isDropped);
    const totalPoints = countingJudges.reduce(
      (s, b) => s + b.weightedTotal,
      0
    );
    const judgeCount = breakdown.length;
    const countingCount = countingJudges.length;
    const averageScore =
      countingCount > 0 ? totalPoints / countingCount : 0;

    results.push({
      rank: 0,
      competitorId: entry.competitorId,
      anonymousNumber: entry.anonymousNumber,
      teamName: entry.teamName,
      totalPoints: Math.round(totalPoints * 10000) / 10000,
      averageScore: Math.round(averageScore * 100) / 100,
      judgeCount,
      isDQ,
      breakdown,
      winnerDeclared: declaredWinners.has(entry.competitorId),
      droppedScore,
    });
  }

  // Sort: non-DQ first, then by totalPoints desc, then KCBS tiebreakers
  results.sort((a, b) => {
    // DQ always last
    if (a.isDQ !== b.isDQ) return a.isDQ ? 1 : -1;

    // Primary: total weighted points (higher is better)
    const pointsDiff = b.totalPoints - a.totalPoints;
    if (Math.abs(pointsDiff) > 0.0001) return pointsDiff;

    // Tiebreaker 1: cumulative Taste (all judges, including dropped)
    const aTaste = a.breakdown.reduce(
      (s, j) => s + j.taste * SCORE_WEIGHTS.taste,
      0
    );
    const bTaste = b.breakdown.reduce(
      (s, j) => s + j.taste * SCORE_WEIGHTS.taste,
      0
    );
    if (Math.abs(bTaste - aTaste) > 0.0001) return bTaste - aTaste;

    // Tiebreaker 2: cumulative Tenderness/Texture (all judges)
    const aTexture = a.breakdown.reduce(
      (s, j) => s + j.texture * SCORE_WEIGHTS.texture,
      0
    );
    const bTexture = b.breakdown.reduce(
      (s, j) => s + j.texture * SCORE_WEIGHTS.texture,
      0
    );
    if (Math.abs(bTexture - aTexture) > 0.0001) return bTexture - aTexture;

    // Tiebreaker 3: cumulative Appearance (all judges)
    const aAppearance = a.breakdown.reduce(
      (s, j) => s + j.appearance * SCORE_WEIGHTS.appearance,
      0
    );
    const bAppearance = b.breakdown.reduce(
      (s, j) => s + j.appearance * SCORE_WEIGHTS.appearance,
      0
    );
    if (Math.abs(bAppearance - aAppearance) > 0.0001)
      return bAppearance - aAppearance;

    // Tiebreaker 4: dropped low score (higher dropped score wins)
    const aDropped = a.droppedScore ?? 0;
    const bDropped = b.droppedScore ?? 0;
    if (Math.abs(bDropped - aDropped) > 0.0001) return bDropped - aDropped;

    // Tiebreaker 5: random coin toss (deterministic by competitor ID for consistency)
    const aHash = simpleHash(a.competitorId);
    const bHash = simpleHash(b.competitorId);
    return bHash - aHash;
  });

  // Assign ranks
  results.forEach((r, i) => {
    r.rank = i + 1;
  });

  return results;
}

/** Simple deterministic hash for coin-toss tiebreaker (always non-negative) */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
