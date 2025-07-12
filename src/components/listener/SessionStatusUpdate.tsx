import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { updateSessionStatus } from '@/api/listener/updatestatus/api';
import type { SessionStatus } from '@/api/listener/updatestatus/types';
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

  const isSessionInPast = new Date(sessionTime) < new Date();
  const oneHourAfterSession = new Date(sessionTime);
  oneHourAfterSession.setHours(oneHourAfterSession.getHours() + 1);
  const canUpdateStatus = isSessionInPast && new Date() >= oneHourAfterSession;

  if (currentStatus !== 'pending') {
    return (
      <div className="flex items-center gap-1 sm:gap-2">
        {currentStatus === 'successful' && (
          <div className="flex items-center gap-1 sm:gap-2 text-green-600">
            <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Completed Successfully</span>
          </div>
        )}
        {currentStatus === 'unsuccessful' && (
          <div className="flex items-center gap-1 sm:gap-2 text-red-600">
            <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Completed with Issues</span>
          </div>
        )}
        {currentStatus === 'cancelled' && (
          <div className="flex items-center gap-1 sm:gap-2 text-gray-600">
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Cancelled</span>
          </div>
        )}
      </div>
    );
  }

  if (!isSessionInPast) {
    return (
      <div className="flex items-center gap-1 sm:gap-2 text-gray-600">
        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="text-xs sm:text-sm">Session hasn't started yet</span>
      </div>
    );
  }

  if (!canUpdateStatus) {
    return (
      <div className="flex items-center gap-1 sm:gap-2 text-gray-600">
        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="text-xs sm:text-sm">Status can be updated 1 hour after session start</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => handleStatusUpdate('successful')}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm py-1.5 sm:py-2"
        >
          <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          Successful
        </Button>
        <Button
          size="sm"
          onClick={() => handleStatusUpdate('unsuccessful')}
          disabled={isLoading}
          className="bg-red-600 hover:bg-red-700 text-xs sm:text-sm py-1.5 sm:py-2"
        >
          <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          Unsuccessful
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleStatusUpdate('cancelled')}
          disabled={isLoading}
          className="text-xs sm:text-sm py-1.5 sm:py-2"
        >
          <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          Cancel
        </Button>
      </div>
      {error && <p className="text-xs sm:text-sm text-red-600">{error}</p>}
    </div>
  );
}; 