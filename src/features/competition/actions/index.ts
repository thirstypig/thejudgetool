// Barrel re-exports — split from a 1050-line monolith into domain sub-modules

export { createCompetition, getCompetitions, getCompetitionById } from "./competitions";
export { addCompetitor, addCompetitorsBulk, checkInTeam, uncheckInTeam } from "./competitors";
export { generateJudgePin, togglePinLock, registerJudgeForCompetition, registerJudgesBulkForCompetition, getCompetitionRoster, checkInJudge, uncheckInJudge, unregisterJudgeFromCompetition } from "./judges";
export { assignJudgeToTable, toggleCaptainJudging, assignJudgeToTableOnly, randomAssignTables } from "./tables";
export { generateDistribution, approveDistribution, getExistingDistribution, resetDistribution } from "./distribution";
export { advanceCategoryRound, markCategoryRoundSubmittedIfReady, toggleCommentCards } from "./category-rounds";
