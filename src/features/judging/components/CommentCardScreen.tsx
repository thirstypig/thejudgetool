"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { ScoreDisplay } from "@/shared/components/common/ScoreDisplay";
import {
  TASTE_COMMENT_OPTIONS,
  TENDERNESS_COMMENT_OPTIONS,
} from "@/shared/constants/kcbs";
import { submitCommentCard } from "../actions";
import type { SubmissionWithDetails } from "../types";

interface CommentCardScreenProps {
  categoryName: string;
  categoryRoundId: string;
  submissions: SubmissionWithDetails[];
  judgeId: string;
  cbjNumber: string;
  onDone: () => void;
}

type CardData = {
  otherLine: string;
  appearanceText: string;
  tasteChecks: string[];
  tendernessChecks: string[];
  otherComments: string;
};

function emptyCard(): CardData {
  return {
    otherLine: "",
    appearanceText: "",
    tasteChecks: [],
    tendernessChecks: [],
    otherComments: "",
  };
}

export function CommentCardScreen({
  categoryName,
  categoryRoundId,
  submissions,
  judgeId,
  cbjNumber,
  onDone,
}: CommentCardScreenProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [cards, setCards] = useState<Record<string, CardData>>(() => {
    const init: Record<string, CardData> = {};
    for (const sub of submissions) {
      init[sub.id] = emptyCard();
    }
    return init;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentSub = submissions[currentIdx];
  const currentCard = cards[currentSub?.id] ?? emptyCard();
  const isLast = currentIdx === submissions.length - 1;

  const scoreCard = currentSub?.scoreCards.find((sc) => sc.judgeId === judgeId);
  const boxLabel = currentSub?.boxCode || currentSub?.competitor?.anonymousNumber || String(currentSub?.boxNumber);

  function updateCard(updates: Partial<CardData>) {
    setCards((prev) => ({
      ...prev,
      [currentSub.id]: { ...prev[currentSub.id], ...updates },
    }));
  }

  function toggleCheck(field: "tasteChecks" | "tendernessChecks", value: string) {
    const current = currentCard[field];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateCard({ [field]: next });
  }

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      await submitCommentCard(currentSub.id, judgeId, categoryRoundId, currentCard);
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

  function handleSkip() {
    if (isLast) {
      onDone();
    } else {
      setCurrentIdx((prev) => prev + 1);
    }
  }

  if (!currentSub) return null;

  return (
    <div className="mx-auto max-w-md px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Comment Card</h2>
          <p className="text-sm text-muted-foreground">{categoryName} — Box {boxLabel}</p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium">
          {currentIdx + 1}/{submissions.length}
        </span>
      </div>

      {/* CBJ + Scores (read-only) */}
      <div className="mt-4 rounded-lg border p-3 space-y-2">
        <p className="text-sm text-muted-foreground">CBJ #{cbjNumber}</p>
        {scoreCard && (
          <div className="flex gap-3">
            <div className="space-y-1 text-center">
              <p className="text-xs text-muted-foreground">App</p>
              <ScoreDisplay score={scoreCard.appearance} size="sm" />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-xs text-muted-foreground">Taste</p>
              <ScoreDisplay score={scoreCard.taste} size="sm" />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-xs text-muted-foreground">Text</p>
              <ScoreDisplay score={scoreCard.texture} size="sm" />
            </div>
          </div>
        )}
      </div>

      {/* Comment Fields */}
      <div className="mt-4 space-y-5">
        {/* Other line */}
        <div className="space-y-1">
          <Label className="text-sm font-medium">Other (meat type)</Label>
          <Input
            value={currentCard.otherLine}
            onChange={(e) => updateCard({ otherLine: e.target.value })}
            placeholder="e.g., Turkey, Sausage..."
          />
        </div>

        {/* Appearance */}
        <div className="space-y-1">
          <Label className="text-sm font-medium">Appearance Comments</Label>
          <textarea
            className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            rows={2}
            value={currentCard.appearanceText}
            onChange={(e) => updateCard({ appearanceText: e.target.value })}
            placeholder="Comments on appearance..."
          />
        </div>

        {/* Taste Checks */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Taste</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {TASTE_COMMENT_OPTIONS.map((opt) => (
              <label
                key={opt}
                className={`flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                  currentCard.tasteChecks.includes(opt)
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:bg-muted"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={currentCard.tasteChecks.includes(opt)}
                  onChange={() => toggleCheck("tasteChecks", opt)}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>

        {/* Tenderness Checks */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Tenderness / Texture</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {TENDERNESS_COMMENT_OPTIONS.map((opt) => (
              <label
                key={opt}
                className={`flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                  currentCard.tendernessChecks.includes(opt)
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:bg-muted"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={currentCard.tendernessChecks.includes(opt)}
                  onChange={() => toggleCheck("tendernessChecks", opt)}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>

        {/* Other comments */}
        <div className="space-y-1">
          <Label className="text-sm font-medium">Other Comments</Label>
          <textarea
            className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            rows={2}
            value={currentCard.otherComments}
            onChange={(e) => updateCard({ otherComments: e.target.value })}
            placeholder="Any other comments..."
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex gap-3">
        {currentIdx > 0 && (
          <Button
            variant="outline"
            onClick={() => setCurrentIdx((prev) => prev - 1)}
            disabled={loading}
            className="h-12 flex-1"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={handleSkip}
          disabled={loading}
          className="h-12 flex-1"
        >
          {isLast ? "Skip All" : "Skip"}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="h-12 flex-1"
        >
          {loading
            ? "Saving..."
            : isLast
              ? "Submit & Finish"
              : "Submit & Next"}
          {!isLast && <ChevronRight className="ml-1 h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
