import React, { useState } from 'react';
import { updateSessionStatus } from '@/api/admin/sessions/api';
import type { SessionStatus } from '@/api/listener/updatestatus/types';
import { confirm } from '@/lib/confirm';
import { StatusBadge, statusToneFrom } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';

interface SessionStatusUpdateProps {
  sessionId: string;
  currentStatus: SessionStatus;
  sessionTime: string;
  onStatusUpdated: (newStatus: SessionStatus) => void;
  className?: string;
}

/**
 * Compact status control for dense tables: badge when settled,
 * native select when still pending.
 */
export const SessionStatusUpdate: React.FC<SessionStatusUpdateProps> = ({
  sessionId,
  currentStatus,
  sessionTime,
  onStatusUpdated,
  className,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSessionInPast = new Date(sessionTime) < new Date();
  const oneHourAfterSession = new Date(sessionTime);
  oneHourAfterSession.setHours(oneHourAfterSession.getHours() + 1);
  const canMarkComplete = isSessionInPast && new Date() >= oneHourAfterSession;

  const handleStatusUpdate = async (newStatus: SessionStatus) => {
    if (newStatus === currentStatus) return;

    const messages: Record<string, string> = {
      cancelled:
        'Cancel this session? This cannot be undone.',
      unsuccessful:
        'Mark this session as unsuccessful? This cannot be undone.',
      successful: 'Mark this session as successful?',
    };

    const confirmed = await confirm({
      title: 'Update session',
      description:
        messages[newStatus] || `Change status to "${newStatus}"?`,
      confirmText: 'Confirm',
    });
    if (!confirmed) return;

    try {
      setIsLoading(true);
      setError(null);
      const result = await updateSessionStatus(sessionId, { status: newStatus });
      onStatusUpdated(result.session.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  if (currentStatus !== 'pending') {
    return (
      <div className={cn('flex flex-col gap-0.5', className)}>
        <StatusBadge tone={statusToneFrom(currentStatus)}>
          {currentStatus}
        </StatusBadge>
      </div>
    );
  }

  return (
    <div className={cn('flex min-w-[9.5rem] flex-col gap-1', className)}>
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
