import * as React from "react"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const tableContainerVariants = cva("relative w-full overflow-hidden bg-rs-surface", {
  variants: {
    variant: {
      /** Soft-rounded bordered table (Cloudflare Members default). */
      standalone: "rounded-xl border border-rs-border",
      /** No chrome — nest inside CardContent / TableCard. */
      plain: "rounded-none border-0",
    },
  },
  defaultVariants: {
    variant: "standalone",
  },
})

export interface TableProps
  extends React.HTMLAttributes<HTMLTableElement>,
    VariantProps<typeof tableContainerVariants> {}

/**
 * Cloudflare Members-style table primitives.
 * Use `variant="standalone"` alone, or `variant="plain"` inside a TableCard.
 */
const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, variant, ...props }, ref) => (
    <div className={cn(tableContainerVariants({ variant }))}>
      <div className="w-full overflow-auto">
        <table
          ref={ref}
          className={cn("w-full caption-bottom text-sm", className)}
          {...props}
        />
      </div>
    </div>
  )
)
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "bg-rs-page [&_tr]:border-b [&_tr]:border-rs-border",
      className
    )}
    {...props}
  />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("bg-rs-surface [&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t border-rs-border bg-rs-page font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-rs-border rs-transition hover:bg-rs-page/70 data-[state=selected]:bg-rs-page",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-11 px-4 text-left align-middle text-xs font-medium text-rs-text [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

export interface SortableTableHeadProps
  extends Omit<React.ThHTMLAttributes<HTMLTableCellElement>, "onClick"> {
  column: string
  sortBy: string
  sortOrder: string
  onSort: (column: string) => void
  children: React.ReactNode
}

/**
 * Clickable column header with a quiet sort indicator.
 * Active column shows up/down; inactive shows a muted swap icon on hover.
 */
const SortableTableHead = React.forwardRef<
  HTMLTableCellElement,
  SortableTableHeadProps
>(
  (
    { className, column, sortBy, sortOrder, onSort, children, ...props },
    ref
  ) => {
    const active = sortBy === column
    const label = typeof children === "string" ? children : column

    return (
      <TableHead
        ref={ref}
        aria-sort={
          active
            ? sortOrder === "asc"
              ? "ascending"
              : "descending"
            : "none"
        }
        className={cn("p-0", className)}
        {...props}
      >
        <button
          type="button"
          onClick={() => onSort(column)}
          className={cn(
            "group inline-flex h-11 w-full items-center gap-1.5 px-4 text-left text-xs font-medium",
            "text-rs-text-muted rs-transition hover:text-rs-text",
            active && "text-rs-text"
          )}
          aria-label={`Sort by ${label}`}
        >
          <span>{children}</span>
          <span
            className={cn(
              "inline-flex shrink-0 text-rs-text-muted",
              active
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-60 group-focus-visible:opacity-60"
            )}
            aria-hidden
          >
            {active ? (
              sortOrder === "asc" ? (
                <ArrowUp className="h-3.5 w-3.5" strokeWidth={2} />
              ) : (
                <ArrowDown className="h-3.5 w-3.5" strokeWidth={2} />
              )
            ) : (
              <ArrowUpDown className="h-3.5 w-3.5" strokeWidth={1.75} />
            )}
          </span>
        </button>
      </TableHead>
    )
  }
)
SortableTableHead.displayName = "SortableTableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "px-4 py-3.5 align-middle text-sm text-rs-text-secondary [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    )}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-rs-text-muted", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

const TableEmpty = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & { colSpan: number }
>(({ className, colSpan, children, ...props }, ref) => (
  <tr>
    <td
      ref={ref}
      colSpan={colSpan}
      className={cn(
        "px-4 py-12 text-center text-sm text-rs-text-muted",
        className
      )}
      {...props}
    >
      {children}
    </td>
  </tr>
))
TableEmpty.displayName = "TableEmpty"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  SortableTableHead,
  TableRow,
  TableCell,
  TableCaption,
  TableEmpty,
  tableContainerVariants,
}
