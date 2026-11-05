import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PageErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/**
 * Full-panel failure when a list/page cannot load. Pair with Retry.
 */
export function PageError({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Retry",
  className,
  ...props
}: PageErrorProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-rs-border bg-rs-surface px-4 py-12 text-center",
        className,
      )}
      {...props}
    >
      <AlertTriangle className="mb-3 h-8 w-8 text-rs-text-muted" strokeWidth={1.5} />
      <p className="text-sm font-medium text-rs-text">{title}</p>
      <p className="mt-1 max-w-md text-sm text-rs-text-muted">{message}</p>
      {onRetry ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={onRetry}
        >
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
