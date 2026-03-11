// Public API — only these are available to other features
export { TableStatusBoard } from "./components/TableStatusBoard";
export { ScoreReviewTable } from "./components/ScoreReviewTable";
export { CommentCardReviewTable } from "./components/CommentCardReviewTable";
export { CorrectionRequestPanel } from "./components/CorrectionRequestPanel";
export { SubmitCategoryDialog } from "./components/SubmitCategoryDialog";
export { CategorySubmittedScreen } from "./components/CategorySubmittedScreen";
export {
  getCaptainDashboardData,
  getTableScoringStatus,
  getTableScoreCards,
  getTableCommentCards,
  getPendingCorrectionRequests,
  isCategorySubmittedByTable,
  submitCategoryToOrganizer,
} from "./actions";
export type {
  TableScoringStatus,
  JudgeScoringStatus,
  ScoreCardWithJudge,
  CommentCardWithJudge,
  CorrectionRequestWithDetails,
} from "./types";
