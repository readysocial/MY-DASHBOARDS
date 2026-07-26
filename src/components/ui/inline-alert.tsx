import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

const variants = {
  error: {
    className: "border-rs-primary/20 bg-rs-primary-tint text-rs-text",
    Icon: AlertTriangle,
    iconClassName: "text-rs-primary",
  },
  success: {
    className: "border-rs-border bg-rs-surface text-rs-text",
    Icon: CheckCircle2,
    iconClassName: "text-rs-success",
  },
  info: {
    className: "border-rs-border bg-rs-surface text-rs-text-secondary",
    Icon: Info,
    iconClassName: "text-rs-text-muted",
  },
} as const;

export type InlineAlertVariant = keyof typeof variants;

export interface InlineAlertProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: InlineAlertVariant;
  onDismiss?: () => void;
}

/**
 * Persistent in-page feedback. Prefer Sonner toast for ephemeral success/action results.
 */
export function InlineAlert({
  variant = "info",
  className,
  children,
  onDismiss,
  ...props
}: InlineAlertProps) {
  const { className: tone, Icon, iconClassName } = variants[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm",
        tone,
        className,
      )}
      {...props}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconClassName)} />
      <div className="min-w-0 flex-1">{children}</div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-md p-0.5 text-rs-text-muted hover:bg-rs-page hover:text-rs-text"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
