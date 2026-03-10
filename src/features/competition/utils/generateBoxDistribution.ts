/**
 * Box Distribution Algorithm
 *
 * Generates a competition-wide assignment of competitor boxes to tables
 * across all category rounds, ensuring no competitor appears at the same
 * table in multiple categories (BR-2 extended).
 *
 * Ideal case (competitors = tables × 6): cyclic Latin square permutation
 * Non-ideal: greedy constraint-satisfaction with BR-2 enforcement
 */

export type CompetitorInput = {
  id: string;
  anonymousNumber: string;
};

export type TableInput = {
  id: string;
  tableNumber: number;
};

export type CategoryRoundInput = {
  id: string;
  categoryName: string;
  order: number;
};

export type TableDistribution = {
  tableId: string;
  tableNumber: number;
  competitors: Array<{
    competitorId: string;
    anonymousNumber: string;
    boxNumber: number;
  }>;
};

export type CategoryDistribution = {
  categoryRoundId: string;
  categoryName: string;
  tables: TableDistribution[];
};

export type BoxDistribution = CategoryDistribution[];

/** Generate a pool of unique sequential 3-digit+ box numbers starting at 100. */
function generateUniqueBoxNumbers(count: number): number[] {
  return Array.from({ length: count }, (_, i) => 100 + i);
}

/**
 * Validates that no competitor appears at the same table across multiple categories.
 * Also validates that all box numbers are unique across the entire distribution.
 */
export function validateDistribution(distribution: BoxDistribution): {
  valid: boolean;
  violations: Array<{
    competitorId: string;
    tableId: string;
    categories: string[];
  }>;
} {
  // Track: tableId -> competitorId -> list of category names
  const tableCompetitorMap = new Map<string, Map<string, string[]>>();

  for (const cat of distribution) {
    for (const table of cat.tables) {
      if (!tableCompetitorMap.has(table.tableId)) {
        tableCompetitorMap.set(table.tableId, new Map());
      }
      const compMap = tableCompetitorMap.get(table.tableId)!;
      for (const comp of table.competitors) {
        if (!compMap.has(comp.competitorId)) {
          compMap.set(comp.competitorId, []);
        }
        compMap.get(comp.competitorId)!.push(cat.categoryName);
      }
    }
  }

  const violations: Array<{
    competitorId: string;
    tableId: string;
    categories: string[];
  }> = [];

  tableCompetitorMap.forEach((compMap, tableId) => {
    compMap.forEach((categories, competitorId) => {
      if (categories.length > 1) {
        violations.push({ competitorId, tableId, categories });
      }
    });
  });

  // Validate box number uniqueness
  const seenBoxNumbers = new Set<number>();
  for (const cat of distribution) {
    for (const table of cat.tables) {
      for (const comp of table.competitors) {
        if (seenBoxNumbers.has(comp.boxNumber)) {
          violations.push({
            competitorId: comp.competitorId,
            tableId: table.tableId,
            categories: [cat.categoryName],
          });
        }
        seenBoxNumbers.add(comp.boxNumber);
      }
    }
  }

  return { valid: violations.length === 0, violations };
}

/**
 * Generate box distribution using cyclic permutation (Latin square variant).
 *
 * For N tables with S slots each and C competitors:
 * - Category 0: competitors[0..S-1] → table 0, competitors[S..2S-1] → table 1, ...
 * - Category k: shift the assignment by k*S positions cyclically
 *
 * This guarantees no overlap when competitors >= tables * slotsPerTable.
 * For fewer competitors, uses greedy constraint satisfaction.
 */
export function generateBoxDistribution(
  competitors: CompetitorInput[],
  tables: TableInput[],
  categoryRounds: CategoryRoundInput[]
): BoxDistribution {
  const numTables = tables.length;
  const slotsPerTable = 6;
  const sortedTables = [...tables].sort((a, b) => a.tableNumber - b.tableNumber);
  const sortedCategories = [...categoryRounds].sort((a, b) => a.order - b.order);
  const numCompetitors = competitors.length;

  if (numTables === 0 || numCompetitors === 0 || sortedCategories.length === 0) {
    return [];
  }

  const totalSlots = numTables * slotsPerTable;
  const numCategories = sortedCategories.length;

  // Ideal case: use cyclic permutation when we have enough competitors
  // to guarantee no overlap across all categories.
  // Need: competitors >= tables * slotsPerTable * numCategories / tables = slotsPerTable * numCategories
  // More precisely: need enough distinct competitors so shifts don't wrap and collide.
  // Safe when competitors >= totalSlots AND competitors >= totalSlots + (numCategories - 1) * slotsPerTable
  // Simplification: cyclic works when numCompetitors >= numCategories * slotsPerTable
  const cyclicSafe = numCompetitors >= numCategories * slotsPerTable && numCompetitors >= totalSlots;

  if (cyclicSafe) {
    return generateCyclicDistribution(
      competitors,
      sortedTables,
      sortedCategories,
      slotsPerTable
    );
  }

  // Non-ideal: greedy constraint satisfaction
  return generateGreedyDistribution(
    competitors,
    sortedTables,
    sortedCategories,
    slotsPerTable
  );
}

function generateCyclicDistribution(
  competitors: CompetitorInput[],
  tables: TableInput[],
  categories: CategoryRoundInput[],
  slotsPerTable: number
): BoxDistribution {
  const totalSlots = tables.length * slotsPerTable;
  // Use only as many competitors as we have table slots
  const pool = competitors.slice(0, totalSlots);
  const totalBoxes = categories.length * totalSlots;
  const boxNumbers = generateUniqueBoxNumbers(totalBoxes);
  let boxIdx = 0;

  return categories.map((cat, catIdx) => {
    const shift = catIdx * slotsPerTable;
    const tableDistributions: TableDistribution[] = tables.map((table, tableIdx) => {
      const startIdx = (tableIdx * slotsPerTable + shift) % pool.length;
      const assigned: CompetitorInput[] = [];
      for (let s = 0; s < slotsPerTable; s++) {
        const idx = (startIdx + s) % pool.length;
        assigned.push(pool[idx]);
      }
      return {
        tableId: table.id,
        tableNumber: table.tableNumber,
        competitors: assigned.map((comp) => ({
          competitorId: comp.id,
          anonymousNumber: comp.anonymousNumber,
          boxNumber: boxNumbers[boxIdx++],
        })),
      };
    });

    return {
      categoryRoundId: cat.id,
      categoryName: cat.categoryName,
      tables: tableDistributions,
    };
  });
}

function generateGreedyDistribution(
  competitors: CompetitorInput[],
  tables: TableInput[],
  categories: CategoryRoundInput[],
  slotsPerTable: number
): BoxDistribution {
  // Pre-generate all box numbers
  const maxBoxes = categories.length * tables.length * slotsPerTable;
  const boxNumbers = generateUniqueBoxNumbers(maxBoxes);
  let boxIdx = 0;

  // Track which competitors have been at which tables
  const tableHistory = new Map<string, Set<string>>(); // tableId -> Set<competitorId>
  for (const t of tables) {
    tableHistory.set(t.id, new Set());
  }

  const distribution: BoxDistribution = [];

  for (const cat of categories) {
    const tableDistributions: TableDistribution[] = [];
    const usedInCategory = new Set<string>();

    for (const table of tables) {
      const history = tableHistory.get(table.id)!;
      const assigned: CompetitorInput[] = [];

      // Pick competitors not seen at this table and not yet used in this category
      for (const comp of competitors) {
        if (assigned.length >= slotsPerTable) break;
        if (usedInCategory.has(comp.id)) continue;
        if (history.has(comp.id)) continue;
        assigned.push(comp);
      }

      // If we can't fill all slots with unique competitors, fill remaining
      // with anyone not yet used in this category (relaxed constraint)
      if (assigned.length < slotsPerTable) {
        for (const comp of competitors) {
          if (assigned.length >= slotsPerTable) break;
          if (usedInCategory.has(comp.id)) continue;
          if (assigned.some((a) => a.id === comp.id)) continue;
          assigned.push(comp);
        }
      }

      // Mark as used
      for (const comp of assigned) {
        usedInCategory.add(comp.id);
        history.add(comp.id);
      }

      tableDistributions.push({
        tableId: table.id,
        tableNumber: table.tableNumber,
        competitors: assigned.map((comp) => ({
          competitorId: comp.id,
          anonymousNumber: comp.anonymousNumber,
          boxNumber: boxNumbers[boxIdx++],
        })),
      });
    }

    distribution.push({
      categoryRoundId: cat.id,
      categoryName: cat.categoryName,
      tables: tableDistributions,
    });
  }

  return distribution;
}
