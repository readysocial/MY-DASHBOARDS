import React from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface TableCardProps {
  title: string;
  description?: string;
  /** Actions in the gray header (e.g. outline buttons). */
  actions?: React.ReactNode;
  /** Optional toolbar between header and table (filters, search). */
  toolbar?: React.ReactNode;
  /** Table with variant="plain", or mobile fallback content. */
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/**
 * Composable titled table shell used across admin pages.
 *
 * Composition (Sessions / Listeners / Sparks):
 * ```
 * <TableCard title="…" description="…" actions={<TableCardSearch />} footer={<TablePagination />}>
 *   <Table variant="plain">…</Table>
 * </TableCard>
 * ```
 *
 * - `actions` — search / refresh in the gray header
 * - `toolbar` — optional filters under the header
 * - `children` — always `Table variant="plain"` (+ optional mobile list)
 * - `footer` — always `TablePagination`
 */
export function TableCard({
  title,
  description,
  actions,
  toolbar,
  children,
  footer,
  className,
}: TableCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader
        className={cn(
          actions &&
            "flex-row items-start justify-between gap-3 space-y-0 sm:items-center"
        )}
      >
        <div className="min-w-0 space-y-1">
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </CardHeader>

      {toolbar ? (
        <div className="px-4 pb-3">{toolbar}</div>
      ) : null}

      <CardContent className="p-0">{children}</CardContent>

      {footer ? <CardFooter>{footer}</CardFooter> : null}
    </Card>
  );
}
