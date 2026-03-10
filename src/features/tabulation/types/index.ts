import type { AuditLog, User } from "@prisma/client";

export interface CategoryProgress {
  categoryRoundId: string;
  categoryName: string;
  order: number;
  status: string;
  tablesSubmitted: number;
  totalTables: number;
  captainSubmissions: number;
}

export interface CompetitionProgress {
  competitionId: string;
  categories: CategoryProgress[];
}

export interface JudgeScoreBreakdown {
  judgeId: string;
  judgeName: string;
  cbjNumber: string;
  appearance: number;
  taste: number;
  texture: number;
  /** Weighted total: app*0.56 + taste*2.2972 + texture*1.1428 (max 36) */
  weightedTotal: number;
  /** Raw sum (appearance + taste + texture) — kept for reference */
  total: number;
  isDQ: boolean;
  isOutlier: boolean;
  /** True if this is the dropped low score */
  isDropped: boolean;
}

export interface CategoryResult {
  rank: number;
  competitorId: string;
  anonymousNumber: string;
  teamName?: string;
  /** Weighted total from top 5 counting judges (max 180) */
  totalPoints: number;
  /** Average weighted score per counting judge */
  averageScore: number;
  judgeCount: number;
  isDQ: boolean;
  breakdown: JudgeScoreBreakdown[];
  winnerDeclared: boolean;
  /** Dropped judge's weighted total (used for tiebreaking) */
  droppedScore: number | null;
}

export type AllCategoryResults = Record<string, CategoryResult[]>;

export interface AuditLogEntry extends AuditLog {
  actor: Pick<User, "id" | "name" | "cbjNumber">;
}

export interface DetailedJudgeScore {
  judgeId: string;
  judgeName: string;
  cbjNumber: string;
  appearance: number;
  taste: number;
  texture: number;
  weightedAppearance: number;
  weightedTaste: number;
  weightedTexture: number;
  weightedTotal: number;
  isDropped: boolean;
  isDQ: boolean;
}

export interface DetailedCompetitorResult {
  competitorId: string;
  anonymousNumber: string;
  teamName: string;
  boxNumber: number;
  judges: DetailedJudgeScore[];
  top5Total: number;
  droppedJudgeId: string | null;
}

export interface DetailedTableResult {
  tableId: string;
  tableNumber: number;
  competitors: DetailedCompetitorResult[];
}

export interface DetailedCategoryResult {
  categoryRoundId: string;
  categoryName: string;
  tables: DetailedTableResult[];
}
