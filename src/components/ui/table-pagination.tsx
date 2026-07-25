import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function pageWindow(current: number, total: number): Array<number | "..."> {
  if (total <= 1) return [1];
  const pages: Array<number | "..."> = [1];
  const start = Math.max(2, current - 2);
  const end = Math.min(total - 1, current + 2);
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("...");
  if (total > 1) pages.push(total);
  return pages;
}

export interface TablePaginationProps {
  page: number;
  totalPages: number;
  total: number;
  /** Plural noun for the count label, e.g. "sessions". */
  itemLabel?: string;
  onPageChange: (page: number) => void;
  className?: string;
  /** When false, only Previous / Next (no numbered buttons). Default true. */
  showPageNumbers?: boolean;
}

/**
 * Standard TableCard footer pagination — use inside `footer={...}`.
 */
export function TablePagination({
  page,
  totalPages,
  total,
  itemLabel = "items",
  onPageChange,
  className,
  showPageNumbers = true,
}: TablePaginationProps) {
  const pages = Math.max(1, totalPages);
  const current = Math.min(Math.max(1, page), pages);

  return (
    <div
      className={cn(
        "flex w-full flex-wrap items-center justify-between gap-2",
        className
      )}
    >
      <p className="text-xs text-rs-text-muted">
        {total === 0
          ? `No ${itemLabel}`
          : `${total} ${itemLabel} · Page ${current} of ${pages}`}
      </p>
      <div className="flex flex-wrap items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(current - 1)}
          disabled={current <= 1 || total === 0}
        >
          Previous
        </Button>
        {showPageNumbers
          ? pageWindow(current, pages).map((pageNum, index) =>
              pageNum === "..." ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 text-sm text-rs-text-muted"
                >
                  …
                </span>
              ) : (
                <Button
                  key={pageNum}
                  type="button"
                  variant={pageNum === current ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              )
            )
          : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(current + 1)}
          disabled={current >= pages || total === 0}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
