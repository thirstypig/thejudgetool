import type { Prisma, CompetitionJudge, User } from "@prisma/client";

/** The include shape used by getCompetitionById — keep in sync with the query */
export const competitionByIdInclude = {
  competitors: { orderBy: { anonymousNumber: "asc" as const } },
  tables: {
    orderBy: { tableNumber: "asc" as const },
    include: {
      captain: { select: { id: true, name: true, cbjNumber: true } },
      assignments: {
        orderBy: { seatNumber: "asc" as const },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              cbjNumber: true,
              role: true,
            },
          },
        },
      },
    },
  },
  categoryRounds: { orderBy: { order: "asc" as const } },
  _count: { select: { competitors: true, tables: true } },
} satisfies Prisma.CompetitionInclude;

/** Derived from the actual Prisma query shape — no manual drift */
export type CompetitionWithRelations = Prisma.CompetitionGetPayload<{
  include: typeof competitionByIdInclude;
}>;

export type CompetitionJudgeWithUser = CompetitionJudge & {
  user: Pick<User, "id" | "name" | "cbjNumber" | "email" | "role">;
  tableAssignment?: {
    tableNumber: number;
    seatNumber: number | null;
  } | null;
};

export type CompetitionFormValues = {
  name: string;
  date: string;
  location: string;
};

export type CompetitorFormValues = {
  teamName: string;
  anonymousNumber: string;
};

export type TableSetupValues = {
  tableNumber: number;
  captainCbjNumber: string;
};

export type JudgeAssignmentValues = {
  cbjNumber: string;
  seatNumber: number;
  isCaptain: boolean;
};
