-- CreateIndex
CREATE INDEX "CompetitionJudge_userId_idx" ON "CompetitionJudge"("userId");

-- CreateIndex
CREATE INDEX "CorrectionRequest_scoreCardId_idx" ON "CorrectionRequest"("scoreCardId");

-- CreateIndex
CREATE INDEX "CorrectionRequest_status_idx" ON "CorrectionRequest"("status");

-- CreateIndex
CREATE INDEX "ScoreCard_judgeId_idx" ON "ScoreCard"("judgeId");

-- CreateIndex
CREATE INDEX "Submission_tableId_idx" ON "Submission"("tableId");

-- CreateIndex
CREATE INDEX "Submission_categoryRoundId_idx" ON "Submission"("categoryRoundId");

-- CreateIndex
CREATE INDEX "TableAssignment_userId_idx" ON "TableAssignment"("userId");
