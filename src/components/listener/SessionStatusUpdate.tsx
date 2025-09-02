import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { updateSessionStatus } from '@/api/admin/sessions/api';
import type { SessionStatus } from '@/api/listener/updatestatus/types'; // ✅ correct file
import { AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface SessionStatusUpdateProps {
  sessionId: string;
  currentStatus: SessionStatus;
  sessionTime: string;
  onStatusUpdated: (newStatus: SessionStatus) => void;
}

export const SessionStatusUpdate: React.FC<SessionStatusUpdateProps> = ({
  sessionId,
  currentStatus,
  sessionTime,
  onStatusUpdated,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusUpdate = async (newStatus: SessionStatus) => {
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

  /* ---------- unchanged logic ---------- */
  const isSessionInPast = new Date(sessionTime) < new Date();
  const oneHourAfterSession = new Date(sessionTime);
  oneHourAfterSession.setHours(oneHourAfterSession.getHours() + 1);
  const canUpdateStatus = isSessionInPast && new Date() >= oneHourAfterSession;

  if (currentStatus !== 'pending') {
    return (
      <div className="flex items-center gap-2">
        {currentStatus === 'successful' && (
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle2 size={16} />
            <span className="text-sm">Completed Successfully</span>
          </div>
        )}
        {currentStatus === 'unsuccessful' && (
          <div className="flex items-center gap-2 text-red-400">
            <XCircle size={16} />
            <span className="text-sm">Completed with Issues</span>
          </div>
        )}
        {currentStatus === 'cancelled' && (
          <div className="flex items-center gap-2 text-slate-400">
            <AlertCircle size={16} />
            <span className="text-sm">Cancelled</span>
          </div>
        )}
      </div>
    );
  }

  if (!isSessionInPast) {
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <Clock size={16} />
        <span className="text-sm">Session hasn’t started yet</span>
      </div>
    );
  }

  if (!canUpdateStatus) {
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <Clock size={16} />
        <span className="text-sm">Available 1 hr after session start</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        onClick={() => handleStatusUpdate('successful')}
        disabled={isLoading}
        className="bg-green-600 hover:bg-green-700"
      >
        <CheckCircle2 size={14} className="mr-1" />
        Successful
      </Button>
      <Button
        size="sm"
        onClick={() => handleStatusUpdate('unsuccessful')}
        disabled={isLoading}
        className="bg-red-600 hover:bg-red-700"
      >
        <XCircle size={14} className="mr-1" />
        Unsuccessful
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleStatusUpdate('cancelled')}
        disabled={isLoading}
        className="border-slate-600 text-slate-300 hover:bg-slate-800"
      >
        <AlertCircle size={14} className="mr-1" />
        Cancel
      </Button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
};