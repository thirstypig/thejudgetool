"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  competitionSchema,
  type CompetitionSchemaType,
} from "../schemas";
import { createCompetition } from "../actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CompetitionForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompetitionSchemaType>({
    resolver: zodResolver(competitionSchema),
  });

  async function onSubmit(data: CompetitionSchemaType) {
    try {
      setServerError(null);
      const competition = await createCompetition(data);
      router.push(`/organizer/${competition.id}/setup`);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Failed to create competition"
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Competition Name</Label>
        <Input id="name" placeholder="e.g. State BBQ Championship" {...register("name")} />
        {errors.name && (
          <p role="alert" className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input id="date" type="datetime-local" {...register("date")} />
        {errors.date && (
          <p role="alert" className="text-sm text-destructive">{errors.date.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input id="location" placeholder="City, State" {...register("location")} />
        {errors.location && (
          <p role="alert" className="text-sm text-destructive">{errors.location.message}</p>
        )}
      </div>

      {serverError && (
        <p role="alert" className="text-sm text-destructive">{serverError}</p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Competition"}
      </Button>
    </form>
  );
}
