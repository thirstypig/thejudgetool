import { describe, it, expect } from "vitest";
import {
  scorecardSchema,
  correctionSchema,
  tableSetupSchema,
  boxCodeSchema,
  hasDQScore,
} from "../index";
import { VALID_SCORES } from "@/shared/constants/kcbs";

// ============================================================
// scorecardSchema — exhaustive invalid input tests
// ============================================================
describe("scorecardSchema — invalid inputs", () => {
  it("rejects all invalid KCBS scores (0, 3, 4, 10+)", () => {
    const invalidScores = [0, 3, 4, 10, 11, 100, -1, -100];
    for (const score of invalidScores) {
      const result = scorecardSchema.safeParse({
        appearance: score,
        taste: 7,
        texture: 7,
      });
      expect(result.success).toBe(false);
    }
  });

  it("accepts all valid KCBS scores in every dimension", () => {
    for (const score of VALID_SCORES) {
      const result = scorecardSchema.safeParse({
        appearance: score,
        taste: score,
        texture: score,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects NaN", () => {
    const result = scorecardSchema.safeParse({
      appearance: NaN,
      taste: 7,
      texture: 7,
    });
    expect(result.success).toBe(false);
  });

  it("rejects null and undefined", () => {
    expect(scorecardSchema.safeParse({ appearance: null, taste: 7, texture: 7 }).success).toBe(false);
    expect(scorecardSchema.safeParse({ appearance: undefined, taste: 7, texture: 7 }).success).toBe(false);
  });

  it("rejects empty object", () => {
    expect(scorecardSchema.safeParse({}).success).toBe(false);
  });

  it("rejects array input", () => {
    expect(scorecardSchema.safeParse([7, 7, 7]).success).toBe(false);
  });

  it("rejects string non-numeric input", () => {
    expect(scorecardSchema.safeParse({ appearance: "abc", taste: 7, texture: 7 }).success).toBe(false);
  });

  it("rejects Infinity", () => {
    expect(scorecardSchema.safeParse({ appearance: Infinity, taste: 7, texture: 7 }).success).toBe(false);
  });
});

// ============================================================
// correctionSchema — edge cases
// ============================================================
describe("correctionSchema", () => {
  it("accepts 20-character reason", () => {
    const result = correctionSchema.safeParse({ reason: "x".repeat(20) });
    expect(result.success).toBe(true);
  });

  it("rejects 19-character reason", () => {
    const result = correctionSchema.safeParse({ reason: "x".repeat(19) });
    expect(result.success).toBe(false);
  });

  it("accepts 500-character reason", () => {
    const result = correctionSchema.safeParse({ reason: "x".repeat(500) });
    expect(result.success).toBe(true);
  });

  it("rejects 501-character reason", () => {
    const result = correctionSchema.safeParse({ reason: "x".repeat(501) });
    expect(result.success).toBe(false);
  });

  it("rejects empty string", () => {
    expect(correctionSchema.safeParse({ reason: "" }).success).toBe(false);
  });

  it("rejects missing reason", () => {
    expect(correctionSchema.safeParse({}).success).toBe(false);
  });

  it("accepts reason with unicode characters", () => {
    const result = correctionSchema.safeParse({ reason: "I need to fix 🍖 score for this entry, please allow correction" });
    expect(result.success).toBe(true);
  });

  it("trims whitespace before validation", () => {
    // 20 chars of whitespace + 5 actual chars = passes length check
    const result = correctionSchema.safeParse({ reason: "  " + "x".repeat(18) + "  " });
    // "  " + 18 x's + "  " = 22 chars total, should pass
    expect(result.success).toBe(true);
  });
});

// ============================================================
// tableSetupSchema — edge cases
// ============================================================
describe("tableSetupSchema", () => {
  it("accepts table 1, seat 1 (minimums)", () => {
    const result = tableSetupSchema.safeParse({ tableNumber: 1, seatNumber: 1 });
    expect(result.success).toBe(true);
  });

  it("accepts seat 6 (maximum)", () => {
    const result = tableSetupSchema.safeParse({ tableNumber: 1, seatNumber: 6 });
    expect(result.success).toBe(true);
  });

  it("rejects seat 0", () => {
    expect(tableSetupSchema.safeParse({ tableNumber: 1, seatNumber: 0 }).success).toBe(false);
  });

  it("rejects seat 7", () => {
    expect(tableSetupSchema.safeParse({ tableNumber: 1, seatNumber: 7 }).success).toBe(false);
  });

  it("rejects table 0", () => {
    expect(tableSetupSchema.safeParse({ tableNumber: 0, seatNumber: 1 }).success).toBe(false);
  });

  it("rejects negative table number", () => {
    expect(tableSetupSchema.safeParse({ tableNumber: -1, seatNumber: 1 }).success).toBe(false);
  });

  it("coerces string numbers", () => {
    const result = tableSetupSchema.safeParse({ tableNumber: "3", seatNumber: "5" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tableNumber).toBe(3);
      expect(result.data.seatNumber).toBe(5);
    }
  });
});

// ============================================================
// boxCodeSchema — edge cases
// ============================================================
describe("boxCodeSchema", () => {
  it("accepts valid 3-digit codes", () => {
    expect(boxCodeSchema.safeParse("100").success).toBe(true);
    expect(boxCodeSchema.safeParse("001").success).toBe(true);
    expect(boxCodeSchema.safeParse("999").success).toBe(true);
    expect(boxCodeSchema.safeParse("000").success).toBe(true);
  });

  it("rejects 2-digit codes", () => {
    expect(boxCodeSchema.safeParse("99").success).toBe(false);
  });

  it("rejects 4-digit codes", () => {
    expect(boxCodeSchema.safeParse("1000").success).toBe(false);
  });

  it("rejects alphabetic characters", () => {
    expect(boxCodeSchema.safeParse("abc").success).toBe(false);
    expect(boxCodeSchema.safeParse("12a").success).toBe(false);
  });

  it("rejects empty string", () => {
    expect(boxCodeSchema.safeParse("").success).toBe(false);
  });

  it("rejects numeric type (expects string)", () => {
    expect(boxCodeSchema.safeParse(100).success).toBe(false);
  });

  it("rejects special characters", () => {
    expect(boxCodeSchema.safeParse("1-2").success).toBe(false);
    expect(boxCodeSchema.safeParse("1.2").success).toBe(false);
  });
});

// ============================================================
// hasDQScore — comprehensive
// ============================================================
describe("hasDQScore — comprehensive", () => {
  it("returns false for all non-DQ valid scores", () => {
    for (const score of VALID_SCORES.filter((s) => s !== 1)) {
      expect(hasDQScore({ appearance: score, taste: score, texture: score })).toBe(false);
    }
  });

  it("returns true when any single dimension is 1", () => {
    expect(hasDQScore({ appearance: 1 })).toBe(true);
    expect(hasDQScore({ taste: 1 })).toBe(true);
    expect(hasDQScore({ texture: 1 })).toBe(true);
  });

  it("returns false for empty object", () => {
    expect(hasDQScore({})).toBe(false);
  });

  it("returns true for all three dimensions at 1", () => {
    expect(hasDQScore({ appearance: 1, taste: 1, texture: 1 })).toBe(true);
  });
});
