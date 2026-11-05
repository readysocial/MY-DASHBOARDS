import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Cloudflare-style page header: title + muted description + optional actions.
 */
export function PageHeader({
  title,
  description,
  icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        {title || icon ? (
          <div className="flex items-center gap-2">
            {icon ? (
              <span className="text-rs-text-muted shrink-0 [&_svg]:h-5 [&_svg]:w-5">
                {icon}
              </span>
            ) : null}
            {title ? (
              <h1 className="rs-page-title truncate">{title}</h1>
            ) : null}
          </div>
        ) : null}
        {description ? (
          <p className="rs-page-description max-w-2xl">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
