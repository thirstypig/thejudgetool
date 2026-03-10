"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { ScoreDisplay } from "@/shared/components/common/ScoreDisplay";
import { correctionSchema, type CorrectionSchemaType } from "../schemas";
import { requestCorrection } from "../actions";
import type { ScoreCard } from "@prisma/client";

interface CorrectionRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scoreCard: ScoreCard;
}

export function CorrectionRequestForm({
  open,
  onOpenChange,
  scoreCard,
}: CorrectionRequestFormProps) {
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CorrectionSchemaType>({
    resolver: zodResolver(correctionSchema),
  });

  async function onSubmit(data: CorrectionSchemaType) {
    try {
      setServerError(null);
      await requestCorrection(scoreCard.id, data.reason);
      reset();
      onOpenChange(false);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Failed to submit correction request"
      );
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Request Score Correction</AlertDialogTitle>
          <AlertDialogDescription>
            Your score card is locked. Submit a correction request to your table
            captain for review.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Current locked scores */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Current Scores</p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">App:</span>
                <ScoreDisplay score={scoreCard.appearance} dimension="appearance" size="sm" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Taste:</span>
                <ScoreDisplay score={scoreCard.taste} dimension="taste" size="sm" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Text:</span>
                <ScoreDisplay score={scoreCard.texture} dimension="texture" size="sm" />
              </div>
            </div>
          </div>

          {/* Reason textarea */}
          <form id="correction-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Correction</Label>
              <textarea
                id="reason"
                rows={4}
                placeholder="Explain why a correction is needed (minimum 20 characters)..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register("reason")}
              />
              {errors.reason && (
                <p className="text-xs text-destructive">
                  {errors.reason.message}
                </p>
              )}
            </div>
          </form>

          {serverError && (
            <p role="alert" className="text-sm text-destructive">{serverError}</p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            type="submit"
            form="correction-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
