"use client";

import { useState } from "react";
import { Flame } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { claimSeat } from "../actions";

interface SeatSelectionScreenProps {
  judgeName: string;
  assignmentId: string;
  tableNumber: number;
  competitionName: string;
  takenSeats: Array<{ seatNumber: number; judgeName: string }>;
}

export function SeatSelectionScreen({
  judgeName,
  assignmentId,
  tableNumber,
  competitionName,
  takenSeats,
}: SeatSelectionScreenProps) {
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const takenMap = new Map(
    takenSeats.map((s) => [s.seatNumber, s.judgeName])
  );

  async function handleSubmit() {
    if (!selectedSeat) return;
    setError(null);
    setLoading(true);
    try {
      await claimSeat(assignmentId, selectedSeat);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to claim seat");
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
          <p className="text-lg font-semibold">
            You&apos;re at Table {tableNumber}
          </p>
          <p className="text-sm text-muted-foreground">Pick your seat</p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((seat) => {
              const taken = takenMap.get(seat);
              return (
                <button
                  key={seat}
                  type="button"
                  disabled={!!taken}
                  onClick={() => setSelectedSeat(seat)}
                  className={cn(
                    "flex h-20 flex-col items-center justify-center rounded-lg border-2 text-xl font-bold transition-all",
                    taken
                      ? "cursor-not-allowed border-muted bg-muted/50 text-muted-foreground"
                      : selectedSeat === seat
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:border-primary/50 hover:bg-accent active:scale-95"
                  )}
                >
                  <span>{seat}</span>
                  {taken && (
                    <span className="mt-0.5 text-[10px] font-normal leading-tight">
                      {taken.split(" ")[0]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

          <Button
            onClick={handleSubmit}
            disabled={!selectedSeat || loading}
            className="h-14 w-full text-lg"
          >
            {loading ? "Claiming..." : "Claim Seat"}
          </Button>
        </div>
      </div>
    </div>
  );
}
