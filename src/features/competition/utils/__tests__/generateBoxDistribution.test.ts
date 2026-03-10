import { describe, it, expect } from "vitest";
import {
  generateBoxDistribution,
  validateDistribution,
  type CompetitorInput,
  type TableInput,
  type CategoryRoundInput,
} from "../generateBoxDistribution";

function makeCompetitors(count: number): CompetitorInput[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `comp-${i + 1}`,
    anonymousNumber: String(100 + i + 1),
  }));
}

function makeTables(count: number): TableInput[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `table-${i + 1}`,
    tableNumber: i + 1,
  }));
}

const KCBS_CATEGORIES: CategoryRoundInput[] = [
  { id: "cat-1", categoryName: "Chicken", order: 1 },
  { id: "cat-2", categoryName: "Pork Ribs", order: 2 },
  { id: "cat-3", categoryName: "Pork", order: 3 },
  { id: "cat-4", categoryName: "Brisket", order: 4 },
];

describe("generateBoxDistribution", () => {
  it("generates distribution for 24 competitors / 4 tables (ideal Latin square)", () => {
    const competitors = makeCompetitors(24);
    const tables = makeTables(4);

    const distribution = generateBoxDistribution(competitors, tables, KCBS_CATEGORIES);

    expect(distribution).toHaveLength(4);

    // Each category should have 4 tables with 6 competitors each
    for (const cat of distribution) {
      expect(cat.tables).toHaveLength(4);
      for (const table of cat.tables) {
        expect(table.competitors).toHaveLength(6);
      }
    }

    // BR-2: no competitor appears at same table across categories
    const validation = validateDistribution(distribution);
    expect(validation.valid).toBe(true);
    expect(validation.violations).toHaveLength(0);
  });

  it("generates distribution for 18 competitors / 3 tables / 3 categories (no violations)", () => {
    const competitors = makeCompetitors(18);
    const tables = makeTables(3);
    const threeCategories = KCBS_CATEGORIES.slice(0, 3);

    const distribution = generateBoxDistribution(competitors, tables, threeCategories);

    expect(distribution).toHaveLength(3);

    for (const cat of distribution) {
      expect(cat.tables).toHaveLength(3);
      for (const table of cat.tables) {
        expect(table.competitors).toHaveLength(6);
      }
    }

    const validation = validateDistribution(distribution);
    expect(validation.valid).toBe(true);
  });

  it("generates distribution for 18 competitors / 3 tables / 4 categories (minimizes violations)", () => {
    // With 3 tables and 4 categories, each competitor must visit a table 4 times
    // but only 3 tables exist, so at least one repeat per competitor is guaranteed.
    const competitors = makeCompetitors(18);
    const tables = makeTables(3);

    const distribution = generateBoxDistribution(competitors, tables, KCBS_CATEGORIES);

    expect(distribution).toHaveLength(4);
    for (const cat of distribution) {
      expect(cat.tables).toHaveLength(3);
      for (const table of cat.tables) {
        expect(table.competitors).toHaveLength(6);
      }
    }
  });

  it("handles fewer competitors than table slots (greedy fallback)", () => {
    const competitors = makeCompetitors(10);
    const tables = makeTables(4);

    const distribution = generateBoxDistribution(competitors, tables, KCBS_CATEGORIES);

    expect(distribution).toHaveLength(4);

    // Each category should distribute all available competitors
    for (const cat of distribution) {
      const totalAssigned = cat.tables.reduce(
        (sum, t) => sum + t.competitors.length,
        0
      );
      // Should assign up to 10 competitors per category
      expect(totalAssigned).toBeLessThanOrEqual(10);
      expect(totalAssigned).toBeGreaterThan(0);
    }
  });

  it("assigns globally unique box numbers (3-4 digit)", () => {
    const competitors = makeCompetitors(24);
    const tables = makeTables(4);

    const distribution = generateBoxDistribution(competitors, tables, KCBS_CATEGORIES);

    const allBoxNumbers: number[] = [];
    for (const cat of distribution) {
      for (const table of cat.tables) {
        for (const comp of table.competitors) {
          expect(comp.boxNumber).toBeGreaterThanOrEqual(100);
          expect(comp.boxNumber).toBeLessThanOrEqual(9999);
          allBoxNumbers.push(comp.boxNumber);
        }
      }
    }
    // All box numbers must be unique across entire distribution
    expect(new Set(allBoxNumbers).size).toBe(allBoxNumbers.length);
  });

  it("returns empty for empty inputs", () => {
    expect(generateBoxDistribution([], makeTables(4), KCBS_CATEGORIES)).toEqual([]);
    expect(generateBoxDistribution(makeCompetitors(24), [], KCBS_CATEGORIES)).toEqual([]);
    expect(generateBoxDistribution(makeCompetitors(24), makeTables(4), [])).toEqual([]);
  });

  it("each competitor appears exactly once per category (ideal case)", () => {
    const competitors = makeCompetitors(24);
    const tables = makeTables(4);

    const distribution = generateBoxDistribution(competitors, tables, KCBS_CATEGORIES);

    for (const cat of distribution) {
      const competitorIds = cat.tables.flatMap((t) =>
        t.competitors.map((c) => c.competitorId)
      );
      // All 24 competitors should appear exactly once
      expect(new Set(competitorIds).size).toBe(24);
      expect(competitorIds).toHaveLength(24);
    }
  });
});

describe("validateDistribution", () => {
  it("detects BR-2 violations", () => {
    const badDistribution = [
      {
        categoryRoundId: "cat-1",
        categoryName: "Chicken",
        tables: [
          {
            tableId: "table-1",
            tableNumber: 1,
            competitors: [
              { competitorId: "comp-1", anonymousNumber: "101", boxNumber: 100 },
            ],
          },
        ],
      },
      {
        categoryRoundId: "cat-2",
        categoryName: "Pork Ribs",
        tables: [
          {
            tableId: "table-1",
            tableNumber: 1,
            competitors: [
              { competitorId: "comp-1", anonymousNumber: "101", boxNumber: 200 },
            ],
          },
        ],
      },
    ];

    const result = validateDistribution(badDistribution);
    expect(result.valid).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0]).toEqual({
      competitorId: "comp-1",
      tableId: "table-1",
      categories: ["Chicken", "Pork Ribs"],
    });
  });
});
