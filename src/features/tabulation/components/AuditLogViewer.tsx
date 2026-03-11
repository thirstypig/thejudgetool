"use client";

import { useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { ScrollText, Download } from "lucide-react";
import { DataTable, type ColumnDef } from "@/shared/components/common/DataTable";
import { EmptyState } from "@/shared/components/common/EmptyState";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import type { AuditLogEntry } from "../types";

interface AuditLogViewerProps {
  logs: AuditLogEntry[];
  loading?: boolean;
}

/** Sanitize a CSV cell value to prevent formula injection */
function sanitizeCsvValue(val: string): string {
  const escaped = val.includes('"') ? val.replace(/"/g, '""') : val;
  const needsPrefix = /^[=+\-@\t\r\n|]/.test(escaped);
  const quoted = `"${needsPrefix ? "'" : ""}${escaped}"`;
  return quoted;
}

export function AuditLogViewer({ logs, loading }: AuditLogViewerProps) {
  const [actionFilter, setActionFilter] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (
        actionFilter &&
        !log.action.toLowerCase().includes(actionFilter.toLowerCase())
      ) {
        return false;
      }
      if (
        entityTypeFilter &&
        !log.entityType.toLowerCase().includes(entityTypeFilter.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [logs, actionFilter, entityTypeFilter]);

  const handleDownload = useCallback(
    (fmt: "csv" | "json") => {
      const data = filteredLogs;
      let content: string;
      let mimeType: string;
      let ext: string;

      if (fmt === "csv") {
        const header = "Time,Actor,CBJ Number,Action,Entity Type,Entity ID";
        const rows = data.map((log) =>
          [
            format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss"),
            log.actor.name,
            log.actor.cbjNumber,
            log.action,
            log.entityType,
            log.entityId,
          ]
            .map(sanitizeCsvValue)
            .join(",")
        );
        content = [header, ...rows].join("\n");
        mimeType = "text/csv";
        ext = "csv";
      } else {
        content = JSON.stringify(
          data.map((log) => ({
            timestamp: log.timestamp,
            actor: log.actor.name,
            cbjNumber: log.actor.cbjNumber,
            action: log.action,
            entityType: log.entityType,
            entityId: log.entityId,
          })),
          null,
          2
        );
        mimeType = "application/json";
        ext = "json";
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-log.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [filteredLogs]
  );

  const columns: ColumnDef<AuditLogEntry>[] = [
    {
      header: "Time",
      cell: (row) => (
        <span className="whitespace-nowrap text-sm tabular-nums">
          {format(new Date(row.timestamp), "MMM d, HH:mm:ss")}
        </span>
      ),
    },
    {
      header: "Actor",
      cell: (row) => (
        <span className="font-medium">
          {row.actor.name}{" "}
          <span className="text-muted-foreground">({row.actor.cbjNumber})</span>
        </span>
      ),
    },
    {
      header: "Action",
      accessorKey: "action",
    },
    {
      header: "Entity Type",
      accessorKey: "entityType",
    },
    {
      header: "Entity ID",
      cell: (row) => (
        <span className="max-w-[200px] truncate text-xs text-muted-foreground">
          {row.entityId}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          placeholder="Filter by action..."
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="max-w-[200px]"
        />
        <Input
          placeholder="Filter by entity type..."
          value={entityTypeFilter}
          onChange={(e) => setEntityTypeFilter(e.target.value)}
          className="max-w-[200px]"
        />
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload("csv")}
            disabled={filteredLogs.length === 0}
          >
            <Download className="mr-1 h-4 w-4" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload("json")}
            disabled={filteredLogs.length === 0}
          >
            <Download className="mr-1 h-4 w-4" />
            JSON
          </Button>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={filteredLogs}
        loading={loading}
        striped
        emptyState={
          <EmptyState
            icon={ScrollText}
            title="No Audit Logs"
            description="No activity has been recorded yet."
          />
        }
      />
    </div>
  );
}
