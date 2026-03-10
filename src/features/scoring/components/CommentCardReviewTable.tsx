"use client";

import { CheckCircle2, MessageSquare } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { EmptyState } from "@/shared/components/common/EmptyState";
import type { CommentCardWithJudge } from "../types";

interface CommentCardReviewTableProps {
  commentCards: CommentCardWithJudge[];
  reviewed?: boolean;
  onMarkReviewed?: () => void;
}

export function CommentCardReviewTable({
  commentCards,
  reviewed,
  onMarkReviewed,
}: CommentCardReviewTableProps) {
  if (commentCards.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No comment cards yet"
        description="Judges have not submitted any comment cards for this round."
      />
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Box</TableHead>
              <TableHead>Judge</TableHead>
              <TableHead>Appearance</TableHead>
              <TableHead>Taste</TableHead>
              <TableHead>Tenderness</TableHead>
              <TableHead>Other</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commentCards.map((cc) => (
              <TableRow key={cc.id}>
                <TableCell className="font-mono text-sm">
                  {cc.submission.boxNumber}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm">{cc.judge.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {cc.judge.cbjNumber}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm">{cc.appearanceText || "—"}</p>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(cc.tasteChecks) && cc.tasteChecks.length > 0
                      ? (cc.tasteChecks as string[]).map((check) => (
                          <Badge
                            key={check}
                            variant="secondary"
                            className="text-xs"
                          >
                            {check}
                          </Badge>
                        ))
                      : "—"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(cc.tendernessChecks) && cc.tendernessChecks.length > 0
                      ? (cc.tendernessChecks as string[]).map((check) => (
                          <Badge
                            key={check}
                            variant="secondary"
                            className="text-xs"
                          >
                            {check}
                          </Badge>
                        ))
                      : "—"}
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm">{cc.otherComments || "—"}</p>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {onMarkReviewed && (
        <div className="border-t px-4 py-3">
          {reviewed ? (
            <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              Comments Reviewed
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={onMarkReviewed}
              className="w-full"
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              I have reviewed all comment cards
            </Button>
          )}
        </div>
      )}
    </>
  );
}
