import type {
  User,
  ScoreCard,
  CommentCard,
  CorrectionRequest,
  Competitor,
  CategoryRound,
} from "@prisma/client";

export type JudgeScoringStatus = {
  judge: Pick<User, "id" | "name" | "cbjNumber">;
  seatNumber: number | null;
  submittedCount: number;
  totalCount: number;
  allSubmitted: boolean;
};

export type TableScoringStatus = {
  tableId: string;
  tableNumber: number;
  categoryRoundId: string;
  categoryName: string;
  judges: JudgeScoringStatus[];
  allJudgesDone: boolean;
  totalScoreCards: number;
  submittedScoreCards: number;
};

export type ScoreCardWithJudge = ScoreCard & {
  judge: Pick<User, "id" | "name" | "cbjNumber">;
  submission: {
    id: string;
    boxNumber: number;
    boxCode: string;
    competitor: Pick<Competitor, "id" | "anonymousNumber"> | null;
    categoryRound: Pick<CategoryRound, "id" | "categoryName">;
  };
};

export type CommentCardWithJudge = CommentCard & {
  judge: Pick<User, "id" | "name" | "cbjNumber">;
  submission: {
    id: string;
    boxNumber: number;
    boxCode: string;
    competitor: Pick<Competitor, "id" | "anonymousNumber"> | null;
  };
};

export type CorrectionRequestWithDetails = CorrectionRequest & {
  judge: Pick<User, "id" | "name" | "cbjNumber">;
  scoreCard: ScoreCard & {
    submission: {
      id: string;
      boxNumber: number;
      boxCode: string;
      competitor: Pick<Competitor, "id" | "anonymousNumber"> | null;
    };
  };
};
