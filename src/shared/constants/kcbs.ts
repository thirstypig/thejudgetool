// --- Categories ---

export const KCBS_MANDATORY_CATEGORIES = [
  { name: "Chicken", order: 1, type: "MANDATORY" },
  { name: "Pork Ribs", order: 2, type: "MANDATORY" },
  { name: "Pork", order: 3, type: "MANDATORY" },
  { name: "Brisket", order: 4, type: "MANDATORY" },
] as const;

export const KCBS_OPTIONAL_CATEGORIES = [
  { name: "Sausage", order: 5, type: "OPTIONAL" },
  { name: "Dessert", order: 6, type: "OPTIONAL" },
] as const;

export const KCBS_ALL_CATEGORIES = [
  ...KCBS_MANDATORY_CATEGORIES,
  ...KCBS_OPTIONAL_CATEGORIES,
] as const;

export type KCBSCategoryName =
  | (typeof KCBS_MANDATORY_CATEGORIES)[number]["name"]
  | (typeof KCBS_OPTIONAL_CATEGORIES)[number]["name"];

// --- Scoring ---

/** Valid KCBS scores — 3 and 4 are not used, 0 is not valid */
export const VALID_SCORES = [1, 2, 5, 6, 7, 8, 9] as const;
export type ValidScore = (typeof VALID_SCORES)[number];

export const SCORE_MIN = 1;
export const SCORE_MAX = 9;

export const SCORE_LABELS: Record<number, string> = {
  1: "DQ / Penalty",
  2: "Inedible",
  5: "Poor",
  6: "Fair",
  7: "Good",
  8: "Very Good",
  9: "Excellent",
};

/** Scores that are NOT valid for selection (3, 4 not used in KCBS) */
export const INVALID_SCORES = new Set([0, 3, 4]);

/** KCBS dimension weights — max weighted total per judge = 36 */
export const SCORE_WEIGHTS = {
  appearance: 0.56,
  taste: 2.2972,
  texture: 1.1428,
} as const;

/** Maximum weighted score a single judge can award (9 * 0.56 + 9 * 2.2972 + 9 * 1.1428 = 36) */
export const MAX_WEIGHTED_SCORE = 36;

/** Number of judges per table */
export const JUDGES_PER_TABLE = 6;

/** Number of top judge scores that count (lowest is dropped) */
export const COUNTING_JUDGES = 5;

/** Perfect score: 5 counting judges × 36 = 180 */
export const PERFECT_SCORE = COUNTING_JUDGES * MAX_WEIGHTED_SCORE;

/** Score of 1 in any dimension = DQ/penalty */
export const DQ_SCORE = 1;

export const SCORE_DIMENSIONS = ["appearance", "taste", "texture"] as const;
export type ScoreDimension = (typeof SCORE_DIMENSIONS)[number];

// --- Tables ---

export const TABLE_SEAT_MAX = 6;
export const SEATS = [1, 2, 3, 4, 5, 6] as const;

// --- Anonymous Numbers ---

export const ANONYMOUS_NUMBER_LENGTH = 3;

// --- Enums ---

export const ROLES = {
  JUDGE: "JUDGE",
  TABLE_CAPTAIN: "TABLE_CAPTAIN",
  ORGANIZER: "ORGANIZER",
} as const;
export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const COMPETITION_STATUS = {
  SETUP: "SETUP",
  ACTIVE: "ACTIVE",
  CLOSED: "CLOSED",
} as const;
export type CompetitionStatus =
  (typeof COMPETITION_STATUS)[keyof typeof COMPETITION_STATUS];

export const CATEGORY_STATUS = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  SUBMITTED: "SUBMITTED",
} as const;
export type CategoryRoundStatus =
  (typeof CATEGORY_STATUS)[keyof typeof CATEGORY_STATUS];

export const CORRECTION_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  DENIED: "DENIED",
} as const;
export type CorrectionStatus =
  (typeof CORRECTION_STATUS)[keyof typeof CORRECTION_STATUS];

// --- Comment Card Options ---

export const TASTE_COMMENT_OPTIONS = [
  "Too salty",
  "Too peppery",
  "Too sour",
  "Too sweet",
  "Bitter",
  "Too smoky",
  "Too spicy",
  "Hot",
  "Too much sauce",
  "Bland/no flavor",
  "Burnt",
  "Greasy",
  "Dislike unknown flavor",
  "Pleasant",
  "Satisfying",
  "Enjoyable",
  "Savory",
] as const;

export const TENDERNESS_COMMENT_OPTIONS = [
  "Meets KCBS standard tenderness test",
  "Too tender",
  "Too tough",
  "Undercooked",
  "Overcooked",
  "Chewy",
  "Dry",
  "Crunchy",
  "Mushy",
  "Fatty",
  "Rubbery",
  "Grainy/Gristle",
  "Pleasant",
  "Satisfying",
  "Enjoyable",
] as const;

export const CATEGORY_TYPES = {
  MANDATORY: "MANDATORY",
  OPTIONAL: "OPTIONAL",
} as const;
export type CategoryType =
  (typeof CATEGORY_TYPES)[keyof typeof CATEGORY_TYPES];
