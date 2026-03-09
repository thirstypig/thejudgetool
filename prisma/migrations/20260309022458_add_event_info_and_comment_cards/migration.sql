-- AlterTable
ALTER TABLE "Competition" ADD COLUMN     "city" TEXT,
ADD COLUMN     "commentCardsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "kcbsRepName" TEXT,
ADD COLUMN     "organizerName" TEXT,
ADD COLUMN     "state" TEXT;

-- CreateTable
CREATE TABLE "CommentCard" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "judgeId" TEXT NOT NULL,
    "categoryRoundId" TEXT NOT NULL,
    "appearanceScore" INTEGER NOT NULL,
    "tasteScore" INTEGER NOT NULL,
    "textureScore" INTEGER NOT NULL,
    "otherLine" TEXT,
    "appearanceText" TEXT,
    "tasteChecks" TEXT[],
    "tendernessChecks" TEXT[],
    "otherComments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommentCard_submissionId_judgeId_key" ON "CommentCard"("submissionId", "judgeId");

-- AddForeignKey
ALTER TABLE "CommentCard" ADD CONSTRAINT "CommentCard_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentCard" ADD CONSTRAINT "CommentCard_judgeId_fkey" FOREIGN KEY ("judgeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentCard" ADD CONSTRAINT "CommentCard_categoryRoundId_fkey" FOREIGN KEY ("categoryRoundId") REFERENCES "CategoryRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;
