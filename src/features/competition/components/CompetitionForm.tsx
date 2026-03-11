"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import { Plus, X } from "lucide-react";
import {
  competitionSchema,
  type CompetitionSchemaType,
} from "../schemas";
import { createCompetition } from "../actions";
import { KCBS_MANDATORY_CATEGORIES, KCBS_OPTIONAL_CATEGORY_SUGGESTIONS } from "@/shared/constants/kcbs";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CompetitionForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [optionalCategories, setOptionalCategories] = useState<string[]>([]);
  const [customCategoryInput, setCustomCategoryInput] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CompetitionSchemaType>({
    resolver: zodResolver(competitionSchema),
    defaultValues: {
      optionalCategories: [],
    },
  });

  function addOptionalCategory(name: string) {
    const trimmed = name.trim();
    if (!trimmed || optionalCategories.length >= 3) return;
    if (optionalCategories.includes(trimmed)) return;
    // Don't allow duplicates with mandatory categories
    if (KCBS_MANDATORY_CATEGORIES.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) return;
    const updated = [...optionalCategories, trimmed];
    setOptionalCategories(updated);
    setValue("optionalCategories", updated);
    setCustomCategoryInput("");
  }

  function removeOptionalCategory(name: string) {
    const updated = optionalCategories.filter((c) => c !== name);
    setOptionalCategories(updated);
    setValue("optionalCategories", updated);
  }

  async function onSubmit(data: CompetitionSchemaType) {
    try {
      setServerError(null);
      const competition = await createCompetition({
        ...data,
        optionalCategories,
      });
      router.push(`/organizer/${competition.id}/teams`);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Failed to create competition"
      );
    }
  }

  const availableSuggestions = KCBS_OPTIONAL_CATEGORY_SUGGESTIONS.filter(
    (s) => !optionalCategories.includes(s)
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Competition Name</Label>
        <Input id="name" placeholder="e.g. State BBQ Championship" {...register("name")} />
        {errors.name && (
          <p role="alert" className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input id="date" type="date" {...register("date")} />
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

      <div className="space-y-2">
        <Label htmlFor="organizerName">Competition Organizer</Label>
        <Input id="organizerName" placeholder="e.g. John Smith" {...register("organizerName")} />
        {errors.organizerName && (
          <p role="alert" className="text-sm text-destructive">{errors.organizerName.message}</p>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <Label>Judging Categories</Label>

        {/* Mandatory categories */}
        <div>
          <p className="mb-2 text-xs text-muted-foreground">Mandatory KCBS Categories</p>
          <div className="flex flex-wrap gap-2">
            {KCBS_MANDATORY_CATEGORIES.map((cat) => (
              <Badge key={cat.name} variant="default">
                {cat.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Optional categories */}
        <div>
          <p className="mb-2 text-xs text-muted-foreground">
            Optional Categories ({optionalCategories.length}/3)
          </p>
          {optionalCategories.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {optionalCategories.map((cat) => (
                <Badge key={cat} variant="secondary" className="gap-1 pr-1">
                  {cat}
                  <button
                    type="button"
                    onClick={() => removeOptionalCategory(cat)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {optionalCategories.length < 3 && (
            <>
              {/* Suggestion chips */}
              <div className="mb-2 flex flex-wrap gap-1.5">
                {availableSuggestions.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => addOptionalCategory(name)}
                    className="rounded-full border border-dashed px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <Plus className="mr-0.5 inline h-3 w-3" />
                    {name}
                  </button>
                ))}
              </div>

              {/* Custom category input */}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Custom category name"
                  className="h-8 text-sm"
                  value={customCategoryInput}
                  onChange={(e) => setCustomCategoryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addOptionalCategory(customCategoryInput);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => addOptionalCategory(customCategoryInput)}
                  disabled={!customCategoryInput.trim()}
                >
                  Add
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {serverError && (
        <p role="alert" className="text-sm text-destructive">{serverError}</p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Creating..." : "Create Competition"}
      </Button>
    </form>
  );
}
