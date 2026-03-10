"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, Upload } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs";
import { importJudgeSchema, type ImportJudgeSchemaType } from "../schemas";
import { importSingleJudge, importJudgesBulk } from "../actions";
import type { ImportResult } from "../types";

interface JudgeImportFormProps {
  onImported?: (userIds: string[]) => void;
}

export function JudgeImportForm({ onImported }: JudgeImportFormProps) {
  const [singleResult, setSingleResult] = useState<string | null>(null);
  const [bulkResult, setBulkResult] = useState<ImportResult | null>(null);
  const [bulkText, setBulkText] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [singleError, setSingleError] = useState<string | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ImportJudgeSchemaType>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(importJudgeSchema) as any,
  });

  async function onSingleSubmit(data: ImportJudgeSchemaType) {
    setSingleError(null);
    setSingleResult(null);
    try {
      const user = await importSingleJudge(data);
      setSingleResult(`Added ${user.name} (${user.cbjNumber})`);
      onImported?.([user.id]);
      reset();
    } catch (err) {
      setSingleError(err instanceof Error ? err.message : "Failed to import");
    }
  }

  async function onBulkSubmit() {
    setBulkError(null);
    setBulkResult(null);
    setBulkLoading(true);
    try {
      const result = await importJudgesBulk(bulkText);
      setBulkResult(result);
      if (result.userIds.length > 0) {
        onImported?.(result.userIds);
      }
      if (result.created > 0) {
        setBulkText("");
      }
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "Failed to import");
    } finally {
      setBulkLoading(false);
    }
  }

  return (
    <Tabs defaultValue="single">
      <TabsList>
        <TabsTrigger value="single">Single</TabsTrigger>
        <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
      </TabsList>

      <TabsContent value="single">
        <form onSubmit={handleSubmit(onSingleSubmit)} className="space-y-3">
          <div className="flex items-end gap-3">
            <div className="space-y-1">
              <Label>CBJ #</Label>
              <Input
                placeholder="100001"
                className="w-28 font-mono"
                {...register("cbjNumber")}
              />
              {errors.cbjNumber && (
                <p className="text-xs text-destructive">{errors.cbjNumber.message}</p>
              )}
            </div>
            <div className="flex-1 space-y-1">
              <Label>Name</Label>
              <Input placeholder="Judge name" {...register("name")} />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              <UserPlus className="mr-1 h-4 w-4" />
              {isSubmitting ? "Adding..." : "Add Judge"}
            </Button>
          </div>
          {singleResult && (
            <p className="text-sm text-green-600 dark:text-green-400">{singleResult}</p>
          )}
          {singleError && (
            <p role="alert" className="text-sm text-destructive">{singleError}</p>
          )}
        </form>
      </TabsContent>

      <TabsContent value="bulk">
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Paste judge list (one per line: CBJ#, Name)</Label>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={"100001, Marcus Johnson\n100002, Lisa Chen\n100003, David Williams"}
              rows={6}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <Button
            onClick={onBulkSubmit}
            size="sm"
            disabled={bulkLoading || !bulkText.trim()}
          >
            <Upload className="mr-1 h-4 w-4" />
            {bulkLoading ? "Importing..." : "Import All"}
          </Button>
          {bulkResult && (
            <div className="space-y-1 text-sm">
              {bulkResult.created > 0 && (
                <p className="text-green-600 dark:text-green-400">
                  Created {bulkResult.created} judge{bulkResult.created !== 1 ? "s" : ""}
                </p>
              )}
              {bulkResult.existing > 0 && (
                <p className="text-muted-foreground">
                  {bulkResult.existing} already existed
                </p>
              )}
              {bulkResult.errors.length > 0 && (
                <div className="text-destructive">
                  {bulkResult.errors.map((e, i) => (
                    <p key={i}>{e.cbjNumber}: {e.error}</p>
                  ))}
                </div>
              )}
            </div>
          )}
          {bulkError && (
            <p role="alert" className="text-sm text-destructive">{bulkError}</p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
