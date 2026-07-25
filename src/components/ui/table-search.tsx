import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface TableCardSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  "aria-label"?: string;
  className?: string;
}

/**
 * Compact search field for `TableCard` `actions` — matches Sessions/Listeners.
 */
export function TableCardSearch({
  value,
  onChange,
  placeholder = "Search…",
  "aria-label": ariaLabel = "Search",
  className,
}: TableCardSearchProps) {
  return (
    <div className={cn("relative w-full sm:w-52", className)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-rs-text-muted" />
      <Input
        type="search"
        className="h-8 pl-8 text-xs"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
      />
    </div>
  );
}

/** Shared native select styling for TableCard toolbars / actions. */
export const tableControlClassName =
  "h-8 rounded-md border border-rs-border bg-rs-surface px-2.5 text-xs text-rs-text";
