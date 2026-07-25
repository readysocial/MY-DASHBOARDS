import React from "react";
import { cn } from "@/lib/utils";

export type StatusTone = "success" | "info" | "neutral" | "warning";

const toneDot: Record<StatusTone, string> = {
  success: "bg-rs-success",
  info: "bg-rs-blue",
  warning: "bg-rs-warning",
  neutral: "bg-rs-text-muted",
};

interface StatusBadgeProps {
  children: React.ReactNode;
  tone?: StatusTone;
  className?: string;
}

/**
 * Map common backend status strings to badge tones.
 */
export function statusToneFrom(status: string): StatusTone {
  const value = status.toLowerCase();
  if (
    value === "active" ||
    value === "completed" ||
    value === "verified" ||
    value === "success" ||
    value === "successful" ||
    value === "refunded"
  ) {
    return "success";
  }
  if (
    value === "in progress" ||
    value === "pending" ||
    value === "processing" ||
    value === "ongoing" ||
    value === "paid"
  ) {
    return "info";
  }
  if (
    value === "suspended" ||
    value === "warning" ||
    value === "unverified" ||
    value === "unsuccessful"
  ) {
    return "warning";
  }
  return "neutral";
}

/**
 * Cloudflare-style status pill: outline + small status dot.
 */
export function StatusBadge({
  children,
  tone = "neutral",
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-rs-border bg-rs-surface px-2.5 py-0.5 text-xs font-medium text-rs-text",
        className
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", toneDot[tone])}
        aria-hidden
      />
      {children}
    </span>
  );
}
