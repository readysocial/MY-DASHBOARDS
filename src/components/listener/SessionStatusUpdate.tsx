import React, { useState } from "react";
import {
  refundSessionPayment,
  updateSessionStatus,
} from "@/api/admin/sessions/api";
import type { SessionStatus } from "@/api/listener/updatestatus/types";
import { confirm } from "@/lib/confirm";
import { StatusBadge, statusToneFrom } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RotateCcw } from "lucide-react";

export type PaymentStatus = "paid" | "refunded" | "unpaid" | string | undefined;

interface SessionStatusUpdateProps {
  sessionId: string;
  currentStatus: SessionStatus;
  sessionTime: string;
  paymentStatus?: PaymentStatus;
  onStatusUpdated: (
    newStatus: SessionStatus,
    paymentStatus?: PaymentStatus,
  ) => void;
  className?: string;
}

interface SessionPaymentCellProps {
  sessionId: string;
  currentStatus: SessionStatus;
  paymentStatus?: PaymentStatus;
  onPaymentUpdated: (paymentStatus: PaymentStatus) => void;
  className?: string;
}

/**
 * Session outcome only — badge when settled, select when pending.
 * Payment UI lives in SessionPaymentCell.
 */
export const SessionStatusUpdate: React.FC<SessionStatusUpdateProps> = ({
  sessionId,
  currentStatus,
  sessionTime,
  paymentStatus,
  onStatusUpdated,
  className,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSessionInPast = new Date(sessionTime) < new Date();
  const oneHourAfterSession = new Date(sessionTime);
  oneHourAfterSession.setHours(oneHourAfterSession.getHours() + 1);
  const canMarkComplete = isSessionInPast && new Date() >= oneHourAfterSession;
  const isPaid = paymentStatus === "paid";

  const handleStatusUpdate = async (newStatus: SessionStatus) => {
    if (newStatus === currentStatus) return;

    const messages: Record<string, string> = {
      cancelled: "Cancel this session? This cannot be undone.",
      unsuccessful:
        "Mark this session as unsuccessful? This cannot be undone.",
      successful: "Mark this session as successful?",
    };

    let issueRefund = false;
    if (isPaid && (newStatus === "cancelled" || newStatus === "unsuccessful")) {
      const choice = await confirm({
        title: "Update session & refund sparks?",
        description: `${messages[newStatus]} Sparks were paid for this session. Confirm to update status and refund sparks.`,
        confirmText: "Update & refund",
        variant: "destructive",
      });
      if (!choice) return;
      issueRefund = true;
    } else {
      const confirmed = await confirm({
        title: "Update session",
        description:
          messages[newStatus] || `Change status to "${newStatus}"?`,
        confirmText: "Confirm",
      });
      if (!confirmed) return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await updateSessionStatus(sessionId, {
        status: newStatus,
        ...(issueRefund ? { issueRefund: true } : {}),
      });
      onStatusUpdated(
        result.session.status,
        (result.session as { paymentStatus?: PaymentStatus }).paymentStatus ??
          (issueRefund ? "refunded" : paymentStatus),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setIsLoading(false);
    }
  };

  if (currentStatus !== "pending") {
    return (
      <div className={cn("space-y-1", className)}>
        <StatusBadge tone={statusToneFrom(currentStatus)}>
          {currentStatus}
        </StatusBadge>
        {error ? (
          <p className="text-[11px] text-rs-primary">{error}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("min-w-[9.5rem] space-y-1", className)}>
      <select
        value=""
        disabled={isLoading}
        aria-label="Update session status"
        onChange={(e) => {
          const value = e.target.value as SessionStatus;
          e.target.value = "";
          if (value) void handleStatusUpdate(value);
        }}
        className="h-8 w-full rounded-md border border-rs-border bg-rs-surface px-2 text-xs text-rs-text disabled:opacity-50"
      >
        <option value="" disabled>
          {isLoading ? "Updating…" : "Pending — update"}
        </option>
        <option value="cancelled">Cancel session</option>
        {canMarkComplete ? (
          <>
            <option value="successful">Mark successful</option>
            <option value="unsuccessful">Mark unsuccessful</option>
          </>
        ) : null}
      </select>
      {!canMarkComplete ? (
        <p className="text-[11px] leading-tight text-rs-text-muted">
          {isSessionInPast
            ? "Outcome available 1h after start"
            : "Outcome after session ends"}
        </p>
      ) : null}
      {error ? <p className="text-[11px] text-rs-primary">{error}</p> : null}
    </div>
  );
};

/**
 * Payment status + optional compact refund action (paid + cancelled/unsuccessful).
 */
export const SessionPaymentCell: React.FC<SessionPaymentCellProps> = ({
  sessionId,
  currentStatus,
  paymentStatus,
  onPaymentUpdated,
  className,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = paymentStatus || "unpaid";
  const canRefund =
    status === "paid" &&
    (currentStatus === "cancelled" || currentStatus === "unsuccessful");

  const handleExplicitRefund = async () => {
    const reasonOk = await confirm({
      title: "Refund session sparks?",
      description:
        "This will credit the session sparks back to the user. Continue?",
      confirmText: "Refund sparks",
      variant: "destructive",
    });
    if (!reasonOk) return;

    const reason =
      window.prompt(
        "Refund reason (required)",
        "Support refund — session cancelled/unsuccessful",
      ) || "";
    if (!reason.trim()) {
      setError("Refund reason is required");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await refundSessionPayment(sessionId, reason.trim());
      onPaymentUpdated("refunded");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refund");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col items-start gap-1.5", className)}>
      <StatusBadge tone={statusToneFrom(status)}>{status}</StatusBadge>
      {canRefund ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs"
          disabled={isLoading}
          onClick={() => void handleExplicitRefund()}
        >
          <RotateCcw
            className={cn("h-3 w-3", isLoading && "animate-spin")}
            strokeWidth={1.75}
          />
          {isLoading ? "Refunding…" : "Refund sparks"}
        </Button>
      ) : null}
      {error ? <p className="text-[11px] text-rs-primary">{error}</p> : null}
    </div>
  );
};
