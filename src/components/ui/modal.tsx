import React, { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** max width class — default max-w-lg */
  className?: string;
  contentClassName?: string;
}

/**
 * Lightweight modal shell matching TableCard / Cloudflare chrome.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  contentClassName,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-rs-text/40"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rs-modal-title"
        className={cn(
          "relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden",
          "rounded-xl border border-rs-border bg-rs-surface shadow-sm",
          "max-w-lg",
          className
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-rs-border px-4 py-3">
          <div className="min-w-0 space-y-0.5">
            <h2
              id="rs-modal-title"
              className="text-sm font-medium text-rs-text"
            >
              {title}
            </h2>
            {description ? (
              <p className="text-xs text-rs-text-muted">{description}</p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-rs-text-muted"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div
          className={cn(
            "flex-1 overflow-y-auto px-4 py-4",
            contentClassName
          )}
        >
          {children}
        </div>

        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-rs-border bg-rs-page/60 px-4 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
