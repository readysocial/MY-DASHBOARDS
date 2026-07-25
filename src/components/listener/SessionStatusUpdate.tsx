import React, { useState } from 'react';
import {
  refundSessionPayment,
  updateSessionStatus,
} from '@/api/admin/sessions/api';
import type { SessionStatus } from '@/api/listener/updatestatus/types';
import { confirm } from '@/lib/confirm';
import { StatusBadge, statusToneFrom } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type PaymentStatus = 'paid' | 'refunded' | 'unpaid' | string | undefined;

interface SessionStatusUpdateProps {
  sessionId: string;
  currentStatus: SessionStatus;
  sessionTime: string;
  paymentStatus?: PaymentStatus;
  onStatusUpdated: (
    newStatus: SessionStatus,
    paymentStatus?: PaymentStatus
  ) => void;
  className?: string;
}

/**
 * Compact status control for dense tables: badge when settled,
 * native select when still pending. Supports spark refunds.
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
  const isPaid = paymentStatus === 'paid';
  const canExplicitRefund =
    isPaid &&
    (currentStatus === 'cancelled' || currentStatus === 'unsuccessful');

  const handleStatusUpdate = async (newStatus: SessionStatus) => {
    if (newStatus === currentStatus) return;

    const messages: Record<string, string> = {
      cancelled: 'Cancel this session? This cannot be undone.',
      unsuccessful:
        'Mark this session as unsuccessful? This cannot be undone.',
      successful: 'Mark this session as successful?',
    };

    let issueRefund = false;
    if (isPaid && (newStatus === 'cancelled' || newStatus === 'unsuccessful')) {
      const choice = await confirm({
        title: 'Update session & refund sparks?',
        description: `${messages[newStatus]} Sparks were paid for this session. Confirm to update status and refund sparks.`,
        confirmText: 'Update & refund',
        variant: 'destructive',
      });
      if (!choice) return;
      issueRefund = true;
    } else {
      const confirmed = await confirm({
        title: 'Update session',
        description:
          messages[newStatus] || `Change status to "${newStatus}"?`,
        confirmText: 'Confirm',
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
          (issueRefund ? 'refunded' : paymentStatus)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExplicitRefund = async () => {
    const reasonOk = await confirm({
      title: 'Refund session sparks?',
      description:
        'This will credit the session sparks back to the user. Continue?',
      confirmText: 'Refund sparks',
      variant: 'destructive',
    });
    if (!reasonOk) return;

    const reason =
      window.prompt(
        'Refund reason (required)',
        'Support refund — session cancelled/unsuccessful'
      ) || '';
    if (!reason.trim()) {
      setError('Refund reason is required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await refundSessionPayment(sessionId, reason.trim());
      onStatusUpdated(currentStatus, 'refunded');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refund');
    } finally {
      setIsLoading(false);
    }
  };

  if (currentStatus !== 'pending') {
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge tone={statusToneFrom(currentStatus)}>
            {currentStatus}
          </StatusBadge>
          {paymentStatus ? (
            <span
              className={cn(
                'inline-block rounded-full px-2 py-0.5 text-[11px] font-medium',
                paymentStatus === 'paid'
                  ? 'bg-blue-100 text-blue-800'
                  : paymentStatus === 'refunded'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-700'
              )}
            >
              {paymentStatus}
            </span>
          ) : null}
        </div>
        {canExplicitRefund ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            disabled={isLoading}
            onClick={() => void handleExplicitRefund()}
          >
            {isLoading ? 'Refunding…' : 'Refund sparks'}
          </Button>
        ) : null}
        {error ? (
          <span className="text-[11px] text-rs-primary">{error}</span>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn('flex min-w-[9.5rem] flex-col gap-1', className)}>
      {paymentStatus ? (
        <span
          className={cn(
            'inline-block w-fit rounded-full px-2 py-0.5 text-[11px] font-medium',
            paymentStatus === 'paid'
              ? 'bg-blue-100 text-blue-800'
              : paymentStatus === 'refunded'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-700'
          )}
        >
          {paymentStatus}
        </span>
      ) : null}
      <select
        value=""
        disabled={isLoading}
        aria-label="Update session status"
        onChange={(e) => {
          const value = e.target.value as SessionStatus;
          e.target.value = '';
          if (value) void handleStatusUpdate(value);
        }}
        className="h-8 w-full rounded-md border border-rs-border bg-rs-surface px-2 text-xs text-rs-text disabled:opacity-50"
      >
        <option value="" disabled>
          {isLoading ? 'Updating…' : 'Pending — update'}
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
        <span className="text-[11px] leading-tight text-rs-text-muted">
          {isSessionInPast
            ? 'Outcome available 1h after start'
            : 'Outcome after session ends'}
        </span>
      ) : null}
      {error ? (
        <span className="text-[11px] text-rs-primary">{error}</span>
      ) : null}
    </div>
  );
};
