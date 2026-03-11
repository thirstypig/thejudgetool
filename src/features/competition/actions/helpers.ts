import { prisma } from "@/shared/lib/prisma";

export type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** Guard + cascade-delete all submissions and their children for a competition. */
export async function guardAndCascadeDeleteSubmissions(tx: TxClient, competitionId: string) {
  const hasLockedScores = await tx.scoreCard.findFirst({
    where: { submission: { categoryRound: { competitionId } }, locked: true },
    select: { id: true },
  });
  if (hasLockedScores) {
    throw new Error("Cannot modify distribution after scoring has begun");
  }

  await tx.commentCard.deleteMany({
    where: { submission: { categoryRound: { competitionId } } },
  });
  await tx.correctionRequest.deleteMany({
    where: { scoreCard: { submission: { categoryRound: { competitionId } } } },
  });
  await tx.scoreCard.deleteMany({
    where: { submission: { categoryRound: { competitionId } } },
  });
  await tx.submission.deleteMany({
    where: { categoryRound: { competitionId } },
  });
}
