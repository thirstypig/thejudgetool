"use client";

import { useState } from "react";
import { Flame } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/lib/utils";
import { registerJudgeAtTable } from "../actions";

interface TableSetupScreenProps {
  judgeName: string;
  competitionId: string;
  competitionName: string;
}

export function TableSetupScreen({
  judgeName,
  competitionId,
  competitionName,
}: TableSetupScreenProps) {
  const [tableNumber, setTableNumber] = useState("");
  const [seatNumber, setSeatNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!tableNumber || !seatNumber) return;
    setError(null);
    setLoading(true);
    try {
      await registerJudgeAtTable(
        competitionId,
        parseInt(tableNumber),
        seatNumber
      );
      // Page will re-render from server after revalidation
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join table");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Flame className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Welcome, {judgeName}</h1>
          <p className="text-muted-foreground">{competitionName}</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="tableNumber" className="text-base font-semibold">
              Table Number
            </Label>
            <Input
              id="tableNumber"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Enter your table number"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="h-14 text-center text-2xl font-bold"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold">Seat Number</Label>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((seat) => (
                <button
                  key={seat}
                  type="button"
                  onClick={() => setSeatNumber(seat)}
                  className={cn(
                    "flex h-16 items-center justify-center rounded-lg border-2 text-xl font-bold transition-all active:scale-95",
                    seatNumber === seat
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:border-primary/50 hover:bg-accent"
                  )}
                >
                  {seat}
                </button>
              ))}
            </div>
          </div>

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

          <Button
            onClick={handleSubmit}
            disabled={!tableNumber || !seatNumber || loading}
            className="h-14 w-full text-lg"
          >
            {loading ? "Joining..." : "Join Table"}
          </Button>
        </div>
      </div>
    </div>
  );
}
