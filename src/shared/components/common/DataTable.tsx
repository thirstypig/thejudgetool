"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { LoadingSpinner } from "@/shared/components/common/LoadingSpinner";
import { cn } from "@/shared/lib/utils";

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T & string;
  cell?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  emptyState?: React.ReactNode;
  loading?: boolean;
  striped?: boolean;
  className?: string;
  pageSize?: number;
  searchFn?: (item: T, query: string) => boolean;
  rowKey?: (row: T) => string | number;
}

const PAGE_SIZES = [10, 25, 50] as const;

export function DataTable<T>({
  columns,
  data,
  emptyState,
  loading = false,
  striped = false,
  className,
  pageSize: initialPageSize,
  searchFn,
  rowKey,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize ?? 10);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim() || !searchFn) return data;
    const q = searchQuery.trim().toLowerCase();
    return data.filter((item) => searchFn(item, q));
  }, [data, searchQuery, searchFn]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const enablePagination = filteredData.length > PAGE_SIZES[0];

  // Reset page when data changes
  useEffect(() => {
    setPage(0);
  }, [data]);

  function handleSearch(value: string) {
    setSearchQuery(value);
    setPage(0);
  }

  const pagedData = enablePagination
    ? filteredData.slice(page * pageSize, (page + 1) * pageSize)
    : filteredData;

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <LoadingSpinner label="Loading data..." />
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className="space-y-3">
      {/* Search bar — only show if searchFn is provided */}
      {searchFn && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* No search results */}
      {searchQuery && filteredData.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No results for &ldquo;{searchQuery}&rdquo;
        </p>
      ) : (
        <>
          <Table className={className}>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.header} className={col.className}>
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedData.map((row, i) => (
                <TableRow
                  key={rowKey ? rowKey(row) : i}
                  className={cn(striped && i % 2 === 1 && "bg-muted/30")}
                >
                  {columns.map((col) => (
                    <TableCell key={col.header} className={col.className}>
                      {col.cell
                        ? col.cell(row)
                        : col.accessorKey
                          ? String(row[col.accessorKey] ?? "")
                          : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination controls */}
          {enablePagination && (
            <div className="flex items-center justify-between border-t pt-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(0);
                  }}
                  className="rounded border bg-background px-2 py-1 text-sm"
                >
                  {PAGE_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
