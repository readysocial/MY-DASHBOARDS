import React, { useEffect, useId, useRef, useState } from "react";
import { Filter, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface TableFilterMenuProps {
  /** Number of applied filters — shown as a badge on the trigger. */
  activeCount?: number;
  onApply: () => void;
  onClear: () => void;
  children: React.ReactNode;
  className?: string;
  label?: string;
}

/**
 * Compact filter dropdown for TableCard `actions`.
 * Keeps dense filter fields out of the table header row.
 */
export function TableFilterMenu({
  activeCount = 0,
  onApply,
  onClear,
  children,
  className,
  label = "Filters",
}: TableFilterMenuProps) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const close = () => {
    if (!open) return;
    setClosing(true);
    window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 150);
  };

  const toggle = () => {
    if (open) close();
    else setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
      >
        <ListFilter className="mr-1.5 h-3.5 w-3.5" />
        {label}
        {activeCount > 0 ? (
          <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rs-text px-1 text-[10px] font-medium text-rs-surface">
            {activeCount}
          </span>
        ) : null}
      </Button>

      {open || closing ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={label}
          data-origin="top-right"
          className={cn(
            "t-dropdown absolute right-0 z-30 mt-1.5 w-[min(100vw-2rem,20rem)]",
            "rounded-xl border border-rs-border bg-rs-surface p-3 shadow-sm",
            open && !closing && "is-open",
            closing && "is-closing"
          )}
        >
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              onApply();
              close();
            }}
          >
            <div className="flex items-center gap-2 text-xs font-medium text-rs-text">
              <Filter className="h-3.5 w-3.5 text-rs-text-muted" />
              {label}
            </div>

            <div className="space-y-2.5">{children}</div>

            <div className="flex items-center justify-end gap-2 border-t border-rs-border pt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onClear();
                  close();
                }}
              >
                Clear
              </Button>
              <Button type="submit" size="sm">
                Apply
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

export function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-medium text-rs-text-muted">{label}</span>
      {children}
    </label>
  );
}
