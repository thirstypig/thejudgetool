# How to Run Tests

## Quick Start

```bash
npm test              # Single run
npm run test:watch    # Watch mode (re-runs on file changes)
```

## Test Framework

Tests use **Vitest** (configured in `vitest.config.ts` at project root). Tests live alongside source code in `__tests__/` directories.

## Current Test Coverage

| Module | File | Tests | What it covers |
|--------|------|-------|----------------|
| competition | `utils/__tests__/validateNoRepeatCompetitor.test.ts` | 5 | BR-2 repeat competitor validation |
| competition | `utils/__tests__/generateBoxDistribution.test.ts` | 8 | Box distribution algorithm (cyclic + greedy) |
| competition | `utils/__tests__/generateBoxDistribution.edge.test.ts` | 14 | Edge cases: boundaries, sorting, box number integrity |
| tabulation | `utils/__tests__/tabulateCategory.test.ts` | 13 | Average calc, ranking, DQ flagging, outlier detection |
| tabulation | `utils/__tests__/tabulateCategory.edge.test.ts` | 22 | DQ ordering, drop lowest, tiebreakers, misuse |
| judging | `schemas/__tests__/scorecardSchema.test.ts` | 17 | Score range validation, integer enforcement, DQ detection |
| judging | `schemas/__tests__/allSchemas.test.ts` | 34 | All schemas: scorecard, correction, tableSetup, boxCode |

**Total: 7 test files, 113 tests**

## Writing New Tests

1. Create a `__tests__/` directory next to the code you're testing
2. Name test files `*.test.ts`
3. Extract pure functions into `utils/` for easy testing (no database/auth dependencies)

```typescript
import { describe, it, expect } from "vitest";
import { myFunction } from "../myFunction";

describe("myFunction", () => {
  it("handles normal input", () => {
    expect(myFunction("input")).toBe("expected");
  });

  it("handles edge case", () => {
    expect(() => myFunction("")).toThrow();
  });
});
```

## Testing Strategy

The project tests **pure utility functions** that can run without a database or auth:

- `features/competition/utils/` — `validateNoRepeatCompetitor()`, `generateBoxDistribution()`
- `features/tabulation/utils/` — `tabulateCategory()`, `calcWeightedTotal()`

Server actions and components are verified via the [manual smoke test checklist](../../TESTING.md).

## E2E Competition Simulation

For a full end-to-end competition test with automated scoring and validation:

```bash
npx tsx scripts/simulate-competition.ts
```

This seeds fresh data, runs box distribution, scores all 4 categories with 24 judges, and validates 2000+ assertions. A formatted markdown report is written to `reports/simulation-report.md`. Run `npm run db:reset` afterward to restore dev seed data.

## Debugging Failing Tests

```bash
# Run a specific test file
npx vitest run src/features/tabulation/utils/__tests__/tabulateCategory.test.ts

# Run tests matching a pattern
npx vitest run -t "tiebreaker"

# Verbose output
npx vitest run --reporter=verbose
```
