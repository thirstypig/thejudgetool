// Public API — only these are available to other features
export { ActiveCategoryBanner } from "./components/ActiveCategoryBanner";
export { ScoreCard } from "./components/ScoreCard";
export { TableSetupScreen } from "./components/TableSetupScreen";
export { SeatSelectionScreen } from "./components/SeatSelectionScreen";
export { BoxEntryScreen } from "./components/BoxEntryScreen";
export { EventInfoScreen } from "./components/EventInfoScreen";
export { CommentCardScreen } from "./components/CommentCardScreen";
export { AppearanceScoringScreen } from "./components/AppearanceScoringScreen";
export { TasteTextureScoringScreen } from "./components/TasteTextureScoringScreen";
export { FontSizeControl } from "./components/FontSizeControl";
export { useFontSize } from "./hooks/useFontSize";
export {
  getJudgeSetupState,
  getJudgeSession,
  getActiveCompetitionForJudge,
  submitCommentCard,
  getCommentCardsForJudge,
} from "./actions";
export type {
  JudgeSession,
  JudgePhase,
  JudgeSetupState,
  ScoringDimension,
  ScoreEntry,
  SubmissionStatus,
  SubmissionWithDetails,
  BoxEntry,
} from "./types";
