import React from "react";
import { ArrowDown, ArrowUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string;
  /** Muted line under the value (e.g. fiat equivalent). */
  secondary?: string;
  trend?: {
    value: number;
    label?: string;
  };
  hint?: string;
  className?: string;
}

/**
 * Metric card with Cloudflare "inner curve":
 * gray shell → label in the shell → nested white body with rounded
 * corners so gray wraps around the top of the content panel.
 */
export function StatCard({
  label,
  value,
  secondary,
  trend,
  hint,
  className,
}: StatCardProps) {
  const positive = trend == null || trend.value >= 0;

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 px-3 pb-2 pt-2.5">
        <p className="truncate text-xs font-medium text-rs-text-secondary">
          {label}
        </p>
        {hint ? (
          <span
            title={hint}
            className="inline-flex shrink-0 text-rs-text-muted"
          >
            <Info className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
            <span className="sr-only">{hint}</span>
          </span>
        ) : null}
      </CardHeader>
      <CardContent className="px-4 py-4">
        <p className="rs-stat-value">{value}</p>
        {secondary ? (
          <p className="mt-1 text-xs tabular-nums text-rs-text-muted">
            {secondary}
          </p>
        ) : null}
        {trend ? (
          <p className="mt-2 flex items-center gap-1 text-xs">
            {positive ? (
              <ArrowUp
                className="h-3.5 w-3.5 text-rs-success"
                strokeWidth={2.5}
                aria-hidden
              />
            ) : (
              <ArrowDown
                className="h-3.5 w-3.5 text-rs-text-muted"
                strokeWidth={2.5}
                aria-hidden
              />
            )}
            <span
              className={cn(
                "font-medium tabular-nums",
                positive ? "text-rs-success" : "text-rs-text-muted"
              )}
            >
              {Math.abs(trend.value)}%
            </span>
            {trend.label ? (
              <span className="text-rs-text-muted">{trend.label}</span>
            ) : null}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
