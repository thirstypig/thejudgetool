// Public API — only these are available to other features
export { CompetitionCard } from "./components/CompetitionCard";
export { CompetitionStatusStepper } from "./components/CompetitionStatusStepper";
export {
  CompetitionProvider,
  useCompetition,
} from "./components/CompetitionProvider";
export { JudgeManagementTabs } from "./components/JudgeManagementTabs";
export { RosterTab } from "./components/RosterTab";
export { CheckInTab } from "./components/CheckInTab";
export { CreateCompetitionSection } from "./components/CreateCompetitionSection";
export {
  CompetitorListRoot,
  CompetitorListTable,
  CompetitorListAddForm,
} from "./components/CompetitorList";
export {
  TableSetupPanelRoot,
  TableSetupPanelTableCard,
  TableSetupPanelAssignForm,
} from "./components/TableSetupPanel";
export { CommentCardToggle } from "./components/CommentCardToggle";
export { BoxDistributionPanel } from "./components/BoxDistributionPanel";
export {
  getCompetitions,
  getCompetitionById,
  getCompetitionRoster,
  advanceCategoryRound,
  toggleCommentCards,
  generateDistribution,
  approveDistribution,
  checkInTeam,
  uncheckInTeam,
  addCompetitorsBulk,
  getExistingDistribution,
  resetDistribution,
  markCategoryRoundSubmittedIfReady,
} from "./actions";
export type {
  CompetitionWithRelations,
  CompetitionFormValues,
  CompetitorFormValues,
  CompetitionJudgeWithUser,
} from "./types";
