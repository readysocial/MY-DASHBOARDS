import React from "react";
import { cn } from "@/lib/utils";

export type StatusTone = "success" | "info" | "neutral" | "warning";

const toneStyles: Record<
  StatusTone,
  { shell: string; dot: string; label: string }
> = {
  success: {
    shell: "border-[#3D9B6E]/25 bg-[#3D9B6E]/10",
    dot: "bg-rs-success",
    label: "text-[#2F7A56]",
  },
  info: {
    shell: "border-rs-blue/25 bg-rs-blue-tint",
    dot: "bg-rs-blue",
    label: "text-[#1580AB]",
  },
  warning: {
    shell: "border-[#C4922E]/30 bg-[#C4922E]/12",
    dot: "bg-rs-warning",
    label: "text-[#8F6C1F]",
  },
  neutral: {
    shell: "border-rs-border bg-[#F4F4F4]",
    dot: "bg-rs-text-muted",
    label: "text-rs-text-secondary",
  },
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
 * Compact status chip: soft tint fill, modest radius (not a capsule).
 */
export function StatusBadge({
  children,
  tone = "neutral",
  className,
}: StatusBadgeProps) {
  const styles = toneStyles[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
        styles.shell,
        styles.label,
        className,
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 shrink-0 rounded-sm", styles.dot)}
        aria-hidden
      />
      {children}
    </span>
  );
}
