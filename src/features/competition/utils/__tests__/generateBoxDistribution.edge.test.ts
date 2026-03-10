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

// ============================================================
// Edge cases — boundary conditions
// ============================================================
describe("generateBoxDistribution — edge cases", () => {
  it("single table, 6 competitors, 4 categories", () => {
    const distribution = generateBoxDistribution(
      makeCompetitors(6),
      makeTables(1),
      KCBS_CATEGORIES
    );

    expect(distribution).toHaveLength(4);
    for (const cat of distribution) {
      expect(cat.tables).toHaveLength(1);
      expect(cat.tables[0].competitors).toHaveLength(6);
    }
  });

  it("single table, single category", () => {
    const distribution = generateBoxDistribution(
      makeCompetitors(6),
      makeTables(1),
      [KCBS_CATEGORIES[0]]
    );

    expect(distribution).toHaveLength(1);
    expect(distribution[0].tables[0].competitors).toHaveLength(6);
  });

  it("1 competitor, 1 table, 4 categories", () => {
    const distribution = generateBoxDistribution(
      makeCompetitors(1),
      makeTables(1),
      KCBS_CATEGORIES
    );

    expect(distribution).toHaveLength(4);
    for (const cat of distribution) {
      expect(cat.tables[0].competitors).toHaveLength(1);
    }
  });

  it("competitors exactly equal to slots (24 = 4 tables * 6 slots)", () => {
    const distribution = generateBoxDistribution(
      makeCompetitors(24),
      makeTables(4),
      KCBS_CATEGORIES
    );

    const validation = validateDistribution(distribution);
    expect(validation.valid).toBe(true);

    // Every competitor appears exactly once per category
    for (const cat of distribution) {
      const ids = cat.tables.flatMap((t) => t.competitors.map((c) => c.competitorId));
      expect(new Set(ids).size).toBe(24);
    }
  });

  it("many more competitors than slots (48 competitors, 4 tables)", () => {
    const distribution = generateBoxDistribution(
      makeCompetitors(48),
      makeTables(4),
      KCBS_CATEGORIES
    );

    expect(distribution).toHaveLength(4);
    // Each table should still have exactly 6 slots
    for (const cat of distribution) {
      for (const table of cat.tables) {
        expect(table.competitors).toHaveLength(6);
      }
    }
  });

  it("fewer competitors than slots (4 competitors, 4 tables)", () => {
    const distribution = generateBoxDistribution(
      makeCompetitors(4),
      makeTables(4),
      KCBS_CATEGORIES
    );

    expect(distribution).toHaveLength(4);
    // Total competitors per category should be 4 (spread across tables)
    for (const cat of distribution) {
      const total = cat.tables.reduce((s, t) => s + t.competitors.length, 0);
      expect(total).toBeLessThanOrEqual(4);
      expect(total).toBeGreaterThan(0);
    }
  });

  it("categories arrive out of order — sorted by order field", () => {
    const shuffled: CategoryRoundInput[] = [
      { id: "cat-4", categoryName: "Brisket", order: 4 },
      { id: "cat-1", categoryName: "Chicken", order: 1 },
      { id: "cat-3", categoryName: "Pork", order: 3 },
      { id: "cat-2", categoryName: "Pork Ribs", order: 2 },
    ];

    const distribution = generateBoxDistribution(
      makeCompetitors(24),
      makeTables(4),
      shuffled
    );

    // First category in output should be Chicken (order 1)
    expect(distribution[0].categoryName).toBe("Chicken");
    expect(distribution[3].categoryName).toBe("Brisket");
  });

  it("tables arrive out of order — sorted by tableNumber", () => {
    const shuffledTables: TableInput[] = [
      { id: "table-3", tableNumber: 3 },
      { id: "table-1", tableNumber: 1 },
      { id: "table-2", tableNumber: 2 },
    ];

    const distribution = generateBoxDistribution(
      makeCompetitors(18),
      shuffledTables,
      KCBS_CATEGORIES.slice(0, 3)
    );

    for (const cat of distribution) {
      expect(cat.tables[0].tableNumber).toBe(1);
      expect(cat.tables[1].tableNumber).toBe(2);
      expect(cat.tables[2].tableNumber).toBe(3);
    }
  });
});

// ============================================================
// Box number uniqueness — stress tests
// ============================================================
describe("generateBoxDistribution — box number integrity", () => {
  it("box numbers are sequential starting at 100", () => {
    const distribution = generateBoxDistribution(
      makeCompetitors(24),
      makeTables(4),
      KCBS_CATEGORIES
    );

    const allBoxes: number[] = [];
    for (const cat of distribution) {
      for (const table of cat.tables) {
        for (const comp of table.competitors) {
          allBoxes.push(comp.boxNumber);
        }
      }
    }

    // Should be 100, 101, 102, ... 195 (96 total = 4 categories * 4 tables * 6)
    expect(allBoxes).toHaveLength(96);
    expect(Math.min(...allBoxes)).toBe(100);
    expect(Math.max(...allBoxes)).toBe(195);
    expect(new Set(allBoxes).size).toBe(96);
  });

  it("box numbers never collide even with greedy algorithm", () => {
    const distribution = generateBoxDistribution(
      makeCompetitors(10),
      makeTables(4),
      KCBS_CATEGORIES
    );

    const allBoxes: number[] = [];
    for (const cat of distribution) {
      for (const table of cat.tables) {
        for (const comp of table.competitors) {
          allBoxes.push(comp.boxNumber);
        }
      }
    }

    expect(new Set(allBoxes).size).toBe(allBoxes.length);
  });
});

// ============================================================
// validateDistribution — comprehensive
// ============================================================
describe("validateDistribution — edge cases", () => {
  it("valid with empty distribution", () => {
    const result = validateDistribution([]);
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("valid with single category (no cross-category conflict possible)", () => {
    const result = validateDistribution([
      {
        categoryRoundId: "cat-1",
        categoryName: "Chicken",
        tables: [
          {
            tableId: "table-1",
            tableNumber: 1,
            competitors: [
              { competitorId: "c1", anonymousNumber: "101", boxNumber: 100 },
              { competitorId: "c2", anonymousNumber: "102", boxNumber: 101 },
            ],
          },
        ],
      },
    ]);
    expect(result.valid).toBe(true);
  });

  it("detects duplicate box numbers", () => {
    const result = validateDistribution([
      {
        categoryRoundId: "cat-1",
        categoryName: "Chicken",
        tables: [
          {
            tableId: "table-1",
            tableNumber: 1,
            competitors: [
              { competitorId: "c1", anonymousNumber: "101", boxNumber: 100 },
              { competitorId: "c2", anonymousNumber: "102", boxNumber: 100 }, // duplicate!
            ],
          },
        ],
      },
    ]);
    expect(result.valid).toBe(false);
  });

  it("allows same competitor at different tables across categories", () => {
    const result = validateDistribution([
      {
        categoryRoundId: "cat-1",
        categoryName: "Chicken",
        tables: [
          {
            tableId: "table-1",
            tableNumber: 1,
            competitors: [
              { competitorId: "c1", anonymousNumber: "101", boxNumber: 100 },
            ],
          },
        ],
      },
      {
        categoryRoundId: "cat-2",
        categoryName: "Pork Ribs",
        tables: [
          {
            tableId: "table-2", // different table!
            tableNumber: 2,
            competitors: [
              { competitorId: "c1", anonymousNumber: "101", boxNumber: 200 },
            ],
          },
        ],
      },
    ]);
    expect(result.valid).toBe(true);
  });
});
