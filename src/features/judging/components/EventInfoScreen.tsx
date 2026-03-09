"use client";

import { MapPin, Calendar, User, Shield } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/shared/components/ui/button";

interface EventInfoScreenProps {
  competitionName: string;
  date: string;
  city: string | null;
  state: string | null;
  location: string;
  organizerName: string | null;
  kcbsRepName: string | null;
  tableNumber: number;
  seatNumber: number;
  judgeName: string;
  cbjNumber: string;
  competitionStatus: string;
  onStart: () => void;
}

export function EventInfoScreen({
  competitionName,
  date,
  city,
  state,
  location,
  organizerName,
  kcbsRepName,
  tableNumber,
  seatNumber,
  judgeName,
  cbjNumber,
  competitionStatus,
  onStart,
}: EventInfoScreenProps) {
  const isActive = competitionStatus === "ACTIVE";
  const displayLocation = city && state ? `${city}, ${state}` : location;

  return (
    <div className="mx-auto flex max-w-sm flex-col px-4 py-6" style={{ minHeight: "70vh" }}>
      <div className="flex-1 space-y-6">
        {/* Event Title */}
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">{competitionName}</h1>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(date), "MMM d, yyyy")}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {displayLocation}
            </span>
          </div>
        </div>

        {/* Event Officials */}
        {(organizerName || kcbsRepName) && (
          <div className="rounded-lg border p-4 space-y-3">
            {organizerName && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Organizer:</span>
                <span className="font-medium">{organizerName}</span>
              </div>
            )}
            {kcbsRepName && (
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">KCBS Rep:</span>
                <span className="font-medium">{kcbsRepName}</span>
              </div>
            )}
          </div>
        )}

        {/* Judge Assignment */}
        <div className="rounded-lg border p-4 space-y-2">
          <p className="text-sm font-medium">{judgeName}</p>
          <p className="text-sm text-muted-foreground">CBJ #{cbjNumber}</p>
          <div className="flex gap-4 text-sm">
            <span>Table <span className="font-semibold">{tableNumber}</span></span>
            <span>Seat <span className="font-semibold">{seatNumber}</span></span>
          </div>
        </div>

        {/* Status */}
        {!isActive && (
          <div className="rounded-lg border border-dashed p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Waiting for organizer to activate the event...
            </p>
          </div>
        )}
      </div>

      {/* Start Button */}
      <div className="mt-8">
        <Button
          onClick={onStart}
          disabled={!isActive}
          className="h-14 w-full text-lg"
        >
          {isActive ? "Start Judging" : "Waiting to Start..."}
        </Button>
      </div>
    </div>
  );
}
