"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle } from "lucide-react";
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [cards, setCards] = useState<Record<string, CardData>>(() => {
    const init: Record<string, CardData> = {};
    for (const sub of submissions) {
      init[sub.id] = emptyCard();
    }
    return init;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSub = submissions.find((s) => s.id === selectedId);
  const currentCard = selectedSub ? (cards[selectedSub.id] ?? emptyCard()) : null;
  const scoreCard = selectedSub?.scoreCards.find((sc) => sc.judgeId === judgeId);

  function updateCard(updates: Partial<CardData>) {
    if (!selectedId) return;
    setCards((prev) => ({
      ...prev,
      [selectedId]: { ...prev[selectedId], ...updates },
    }));
  }

  function toggleCheck(field: "tasteChecks" | "tendernessChecks", value: string) {
    if (!currentCard) return;
    const current = currentCard[field];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateCard({ [field]: next });
  }

  async function handleSubmit() {
    if (!selectedId || !currentCard) return;
    setError(null);
    setLoading(true);
    try {
      await submitCommentCard(selectedId, categoryRoundId, currentCard);
      setCompletedIds((prev) => new Set(Array.from(prev).concat(selectedId)));
      setSelectedId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  // --- Box Selection Grid ---
  if (!selectedSub) {
    const doneLabel =
      completedIds.size === 0
        ? "Skip All"
        : `Done (${completedIds.size}/${submissions.length})`;

    return (
      <div className="mx-auto max-w-md px-4 py-4">
        <h2 className="text-2xl font-bold">Comment Cards</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {categoryName} — Tap a box to add comments
        </p>

        <div className="grid grid-cols-2 gap-3">
          {submissions.map((sub) => {
            const sc = sub.scoreCards.find((s) => s.judgeId === judgeId);
            const boxLabel =
              sub.boxCode || sub.competitor?.anonymousNumber || String(sub.boxNumber);
            const done = completedIds.has(sub.id);

            return (
              <button
                key={sub.id}
                onClick={() => setSelectedId(sub.id)}
                className={`relative rounded-lg border p-3 text-left transition-colors ${
                  done
                    ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                    : "hover:border-primary hover:bg-accent"
                }`}
              >
                {done && (
                  <CheckCircle className="absolute right-2 top-2 h-4 w-4 text-green-500" />
                )}
                <p className="text-lg font-bold font-mono">Box {boxLabel}</p>
                {sc && (
                  <div className="mt-2 flex gap-2">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">A</p>
                      <ScoreDisplay score={sc.appearance} size="sm" />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">T</p>
                      <ScoreDisplay score={sc.taste} size="sm" />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">X</p>
                      <ScoreDisplay score={sc.texture} size="sm" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <Button onClick={onDone} className="mt-6 h-12 w-full">
          {doneLabel}
        </Button>
      </div>
    );
  }

  // --- Comment Form ---
  const boxLabel =
    selectedSub.boxCode ||
    selectedSub.competitor?.anonymousNumber ||
    String(selectedSub.boxNumber);

  return (
    <div className="mx-auto max-w-md px-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedId(null)}
          disabled={loading}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <div>
          <h2 className="text-xl font-bold">Comment Card</h2>
          <p className="text-sm text-muted-foreground">
            {categoryName} — Box {boxLabel}
          </p>
        </div>
      </div>

      {/* Scores (read-only) */}
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
        <div className="space-y-1">
          <Label className="text-sm font-medium">Other (meat type)</Label>
          <Input
            value={currentCard?.otherLine ?? ""}
            onChange={(e) => updateCard({ otherLine: e.target.value })}
            placeholder="e.g., Turkey, Sausage..."
          />
        </div>

        <div className="space-y-1">
          <Label className="text-sm font-medium">Appearance Comments</Label>
          <textarea
            className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            rows={2}
            value={currentCard?.appearanceText ?? ""}
            onChange={(e) => updateCard({ appearanceText: e.target.value })}
            placeholder="Comments on appearance..."
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Taste</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {TASTE_COMMENT_OPTIONS.map((opt) => (
              <label
                key={opt}
                className={`flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                  currentCard?.tasteChecks.includes(opt)
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:bg-muted"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={currentCard?.tasteChecks.includes(opt) ?? false}
                  onChange={() => toggleCheck("tasteChecks", opt)}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Tenderness / Texture</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {TENDERNESS_COMMENT_OPTIONS.map((opt) => (
              <label
                key={opt}
                className={`flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                  currentCard?.tendernessChecks.includes(opt)
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:bg-muted"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={currentCard?.tendernessChecks.includes(opt) ?? false}
                  onChange={() => toggleCheck("tendernessChecks", opt)}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-sm font-medium">Other Comments</Label>
          <textarea
            className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            rows={2}
            value={currentCard?.otherComments ?? ""}
            onChange={(e) => updateCard({ otherComments: e.target.value })}
            placeholder="Any other comments..."
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-3">
        <Button
          variant="outline"
          onClick={() => setSelectedId(null)}
          disabled={loading}
          className="h-12 flex-1"
        >
          Back to List
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="h-12 flex-1"
        >
          {loading ? "Saving..." : "Submit"}
        </Button>
      </div>
    </div>
  );
}
