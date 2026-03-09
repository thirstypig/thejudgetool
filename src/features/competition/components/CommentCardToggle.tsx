"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { toggleCommentCards } from "../actions";

interface CommentCardToggleProps {
  competitionId: string;
  enabled: boolean;
}

export function CommentCardToggle({ competitionId, enabled }: CommentCardToggleProps) {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      await toggleCommentCards(competitionId, !isEnabled);
      setIsEnabled(!isEnabled);
    } catch {
      // revert on error
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Comment Cards</p>
          <p className="text-xs text-muted-foreground">
            Judges fill out optional comment cards after scoring each category
          </p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isEnabled}
        disabled={loading}
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${
          isEnabled ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
            isEnabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
