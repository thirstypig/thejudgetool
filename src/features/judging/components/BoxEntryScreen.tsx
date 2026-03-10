"use client";

import { useState, useRef, useCallback } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { addBoxToTable, removeBoxFromTable } from "../actions";
import type { BoxEntry } from "../types";

interface BoxEntryScreenProps {
  tableId: string;
  categoryRoundId: string;
  categoryName: string;
  initialBoxes: BoxEntry[];
  onDone: () => void;
}

export function BoxEntryScreen({
  tableId,
  categoryRoundId,
  categoryName,
  initialBoxes,
  onDone,
}: BoxEntryScreenProps) {
  const [boxes, setBoxes] = useState<BoxEntry[]>(initialBoxes);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addBox = useCallback(async (boxCode: string) => {
    if (boxCode.length !== 3) return;
    setError(null);
    setLoading(true);
    try {
      const entry = await addBoxToTable(tableId, categoryRoundId, boxCode);
      setBoxes((prev) => [...prev, entry]);
      setCode("");
      inputRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add box");
    } finally {
      setLoading(false);
    }
  }, [tableId, categoryRoundId]);

  async function handleRemove(submissionId: string) {
    setError(null);
    try {
      await removeBoxFromTable(submissionId);
      setBoxes((prev) => prev.filter((b) => b.id !== submissionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove box");
    }
  }

  function handleCodeChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 3);
    setCode(digits);
    // Auto-add when 3 digits entered
    if (digits.length === 3) {
      addBox(digits);
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-6 px-4 py-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">{categoryName}</h2>
        <p className="mt-1 text-muted-foreground">Enter box codes as they arrive</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="boxCode" className="text-base font-semibold">
          Box Code
        </Label>
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            id="boxCode"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={3}
            placeholder="3-digit code"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            className="h-14 flex-1 text-center text-2xl font-bold"
            autoFocus
            disabled={loading}
          />
          <Button
            onClick={() => addBox(code)}
            disabled={code.length !== 3 || loading}
            className="h-14 w-14"
            variant="outline"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          {boxes.length} of 6 boxes entered
        </p>
        {boxes.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No boxes entered yet
          </p>
        ) : (
          <div className="space-y-2">
            {boxes.map((box) => (
              <div
                key={box.id}
                className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
              >
                <span className="text-lg font-bold">Box {box.boxCode}</span>
                <button
                  onClick={() => handleRemove(box.id)}
                  className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive active:scale-95"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button
        onClick={onDone}
        disabled={boxes.length < 2}
        className="h-14 w-full text-lg"
      >
        Done — Start Scoring
      </Button>
    </div>
  );
}
