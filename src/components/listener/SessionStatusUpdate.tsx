// SessionStatusUpdate.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { updateSessionStatus } from '@/api/admin/sessions/api';
import type { SessionStatus } from '@/api/listener/updatestatus/types'; // ✅ correct file
import { AlertCircle, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';

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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState<SessionStatus | null>(null);

  const handleStatusUpdate = async (newStatus: SessionStatus) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await updateSessionStatus(sessionId, { status: newStatus });
      onStatusUpdated(result.session.status);
      setShowConfirmModal(false); // Close modal after success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------- Session timing logic ---------- */
  const isSessionInPast = new Date(sessionTime) < new Date();
  const oneHourAfterSession = new Date(sessionTime);
  oneHourAfterSession.setHours(oneHourAfterSession.getHours() + 1);
  // Can mark as successful/unsuccessful only after session + 1 hour
  const canMarkComplete = isSessionInPast && new Date() >= oneHourAfterSession;

  // Show final status for non-pending sessions
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

  // --- MODAL COMPONENT ---
  const ConfirmModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-8 w-8 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-900">Confirm Status Change</h3>
        </div>

        <p className="text-gray-700 mb-6">
          {targetStatus === 'cancelled'
            ? 'Are you sure you want to cancel this session? This action cannot be undone.'
            : targetStatus === 'unsuccessful'
            ? 'Are you sure you want to mark this session as "Unsuccessful"? This cannot be undone.'
            : 'Are you sure you want to mark this session as "Successful"?'}
        </p>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setShowConfirmModal(false)}
            className="text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (targetStatus) handleStatusUpdate(targetStatus);
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Confirm'}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Cancel button - always available for pending sessions */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setTargetStatus('cancelled');
              setShowConfirmModal(true);
            }}
            disabled={isLoading}
            className="border-slate-600 text-slate-700 hover:bg-slate-100"
          >
            <AlertCircle size={14} className="mr-1" />
            Cancel Session
          </Button>
        </div>

        {/* Completion buttons - only available after session + 1 hour */}
        {canMarkComplete ? (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => {
                setTargetStatus('successful');
                setShowConfirmModal(true);
              }}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 size={14} className="mr-1" />
              Successful
            </Button>

            <Button
              size="sm"
              onClick={() => {
                setTargetStatus('unsuccessful');
                setShowConfirmModal(true);
              }}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              <XCircle size={14} className="mr-1" />
              Unsuccessful
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-400">
            <Clock size={14} />
            <span className="text-xs">
              {!isSessionInPast
                ? "Completion status available after session ends"
                : "Available 1 hr after session start"}
            </span>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}

      {/* Render modal only when needed */}
      {showConfirmModal && <ConfirmModal />}
    </>
  );
};