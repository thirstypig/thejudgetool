import type {
  User,
  Table,
  CategoryRound,
  Submission,
  ScoreCard,
  Competitor,
} from "@prisma/client";

export type ScoringDimension = "appearance" | "taste" | "texture";

export type ScoreEntry = {
  dimension: ScoringDimension;
  value: number | null;
};

export type SubmissionStatus = "pending" | "in_progress" | "submitted";

export type SubmissionWithDetails = Submission & {
  competitor: Pick<Competitor, "id" | "anonymousNumber"> | null;
  scoreCards: ScoreCard[];
  categoryRound: Pick<CategoryRound, "id" | "categoryName" | "status">;
  table: Pick<Table, "id" | "tableNumber">;
};

export type JudgeSession = {
  judge: Pick<User, "id" | "name" | "cbjNumber">;
  table: Pick<Table, "id" | "tableNumber"> & { competitionId: string };
  seatNumber: number;
  activeCategory: Pick<
    CategoryRound,
    "id" | "categoryName" | "status" | "order"
  > | null;
  assignedSubmissions: SubmissionWithDetails[];
  competitionStatus: string;
  commentCardsEnabled: boolean;
  organizerName: string | null;
  kcbsRepName: string | null;
  city: string | null;
  state: string | null;
};

/** Phase the judge is currently in */
export type JudgePhase =
  | "no-table"        // needs to self-register at a table
  | "event-info"      // pre-judging event info screen
  | "waiting"         // no active category
  | "box-entry"       // active category, no boxes for this table/round
  | "appearance"      // boxes exist, appearance not done
  | "taste-texture"   // appearance done, taste/texture not done
  | "comment-cards"   // all scores submitted, comment cards pending
  | "done";           // all scores submitted

export type BoxEntry = {
  id: string;
  boxCode: string;
  boxNumber: number;
};

/** Setup state for judges before they can start scoring */
export type JudgeSetupState =
  | { phase: "not-registered" }
  | { phase: "awaiting-table"; competitionName: string }
  | {
      phase: "pick-seat";
      assignmentId: string;
      tableNumber: number;
      competitionName: string;
      takenSeats: Array<{ seatNumber: number; judgeName: string }>;
    }
  | { phase: "ready" };
