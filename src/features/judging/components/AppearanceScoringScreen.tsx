"use client";

import { useState, useRef } from "react";
import { Check } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { ScorePicker } from "./ScorePicker";
import { submitAppearanceScores } from "../actions";
import type { SubmissionWithDetails } from "../types";

interface AppearanceScoringScreenProps {
  categoryName: string;
  submissions: SubmissionWithDetails[];
  judgeId: string;
  onDone: () => void;
}

export function AppearanceScoringScreen({
  categoryName,
  submissions,
  judgeId,
  onDone,
}: AppearanceScoringScreenProps) {
  // Initialize from existing scorecards (if resuming)
  const initialScores: Record<string, number | null> = {};
  for (const sub of submissions) {
    const sc = sub.scoreCards.find((s) => s.judgeId === judgeId);
    initialScores[sub.id] = sc?.appearanceSubmittedAt ? sc.appearance : null;
  }

  const [scores, setScores] = useState<Record<string, number | null>>(initialScores);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scoredCount = Object.values(scores).filter((v) => v !== null).length;
  const allScored = scoredCount === submissions.length;

  // Auto-scroll to next unscored box after scoring
  function handleScore(submissionId: string, score: number) {
    setScores((prev) => {
      const next = { ...prev, [submissionId]: score };
      // Find next unscored
      const nextUnscored = submissions.find(
        (s) => s.id !== submissionId && next[s.id] === null
      );
      if (nextUnscored && rowRefs.current[nextUnscored.id]) {
        setTimeout(() => {
          rowRefs.current[nextUnscored.id]?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 150);
      }
      return next;
    });
  }

  async function handleSubmit() {
    if (!allScored) return;
    setError(null);
    setLoading(true);
    try {
      const scoreData = submissions.map((sub) => ({
        submissionId: sub.id,
        appearance: scores[sub.id]!,
      }));
      await submitAppearanceScores(scoreData);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Appearance</h2>
          <p className="text-sm text-muted-foreground">{categoryName}</p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium">
          {scoredCount}/{submissions.length}
        </span>
      </div>

      <div className="space-y-3">
        {submissions.map((sub) => {
          const scored = scores[sub.id] !== null;
          return (
            <div
              key={sub.id}
              ref={(el) => { rowRefs.current[sub.id] = el; }}
              className="rounded-lg border bg-card p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">
                  Box {sub.boxCode || sub.competitor?.anonymousNumber || sub.boxNumber}
                </span>
                {scored && (
                  <Check className="h-5 w-5 text-green-500" />
                )}
              </div>
              <ScorePicker
                value={scores[sub.id] ?? null}
                onChange={(score) => handleScore(sub.id, score)}
                size="lg"
              />
            </div>
          );
        })}
      </div>

      {scores && Object.values(scores).some((v) => v === 1) && (
        <p className="text-sm font-medium text-destructive">
          A score of 1 means disqualification (DQ)
        </p>
      )}

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <p className="text-xs text-muted-foreground text-center">
        Scores are final once submitted. You cannot change your answers.
      </p>

      <Button
        onClick={handleSubmit}
        disabled={!allScored || loading}
        className="h-14 w-full text-lg"
      >
        {loading ? "Submitting..." : "Submit Appearance Scores"}
      </Button>
    </div>
  );
}
