"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { ScorePicker } from "./ScorePicker";
import { submitTasteTextureScores } from "../actions";
import type { SubmissionWithDetails } from "../types";

interface TasteTextureScoringScreenProps {
  categoryName: string;
  submissions: SubmissionWithDetails[];
  judgeId: string;
  onDone: () => void;
}

type BoxScores = {
  taste: number | null;
  texture: number | null;
};

export function TasteTextureScoringScreen({
  categoryName,
  submissions,
  judgeId,
  onDone,
}: TasteTextureScoringScreenProps) {
  // Filter to only unfinished submissions (appearance done but not locked)
  const unscoredSubs = submissions.filter((sub) => {
    const sc = sub.scoreCards.find((s) => s.judgeId === judgeId);
    return sc && sc.appearanceSubmittedAt && !sc.locked;
  });

  // If all are done, include all so we can show final submit
  const displaySubs = unscoredSubs.length > 0 ? unscoredSubs : submissions;

  // Initialize scores from existing data
  const initScores: Record<string, BoxScores> = {};
  for (const sub of displaySubs) {
    const sc = sub.scoreCards.find((s) => s.judgeId === judgeId);
    initScores[sub.id] = {
      taste: sc?.locked ? sc.taste : null,
      texture: sc?.locked ? sc.texture : null,
    };
  }

  const [scores, setScores] = useState<Record<string, BoxScores>>(initScores);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentSub = displaySubs[currentIdx];
  const currentScores = scores[currentSub?.id] ?? { taste: null, texture: null };
  const isLast = currentIdx === displaySubs.length - 1;
  const bothScored = currentScores.taste !== null && currentScores.texture !== null;
  const hasDQ = currentScores.taste === 1 || currentScores.texture === 1;

  // Check appearance DQ too
  const currentSc = currentSub?.scoreCards.find((s) => s.judgeId === judgeId);
  const appearanceDQ = currentSc?.appearance === 1;

  function setScore(dimension: "taste" | "texture", value: number) {
    setScores((prev) => ({
      ...prev,
      [currentSub.id]: {
        ...prev[currentSub.id],
        [dimension]: value,
      },
    }));
  }

  async function handleNext() {
    if (!bothScored) return;
    setError(null);
    setLoading(true);
    try {
      await submitTasteTextureScores(currentSub.id, {
        taste: currentScores.taste!,
        texture: currentScores.texture!,
      });

      if (isLast) {
        onDone();
      } else {
        setCurrentIdx((prev) => prev + 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  function handlePrev() {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  }

  if (!currentSub) return null;

  const boxLabel = currentSub.boxCode || currentSub.competitor?.anonymousNumber || String(currentSub.boxNumber);

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-4" style={{ minHeight: "70vh" }}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Box {boxLabel}</h2>
          <p className="text-sm text-muted-foreground">{categoryName}</p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium">
          {currentIdx + 1}/{displaySubs.length}
        </span>
      </div>

      <div className="mt-8 flex-1 space-y-8">
        <div className="space-y-3">
          <Label className="text-lg font-semibold">Taste</Label>
          <ScorePicker
            value={currentScores.taste}
            onChange={(v) => setScore("taste", v)}
            size="lg"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-lg font-semibold">Texture</Label>
          <ScorePicker
            value={currentScores.texture}
            onChange={(v) => setScore("texture", v)}
            size="lg"
          />
        </div>

        {(hasDQ || appearanceDQ) && (
          <p className="text-sm font-medium text-destructive">
            A score of 1 means disqualification (DQ)
          </p>
        )}

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

        <p className="text-xs text-muted-foreground text-center">
          Scores are final once submitted. You cannot change your answers.
        </p>
      </div>

      <div className="mt-6 flex gap-3">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentIdx === 0 || loading}
          className="h-14 flex-1 text-lg"
        >
          <ChevronLeft className="mr-1 h-5 w-5" />
          Previous
        </Button>
        <Button
          onClick={handleNext}
          disabled={!bothScored || loading}
          className="h-14 flex-1 text-lg"
        >
          {loading
            ? "Saving..."
            : isLast
              ? "Submit All"
              : "Submit & Next"}
          {!isLast && <ChevronRight className="ml-1 h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
}
