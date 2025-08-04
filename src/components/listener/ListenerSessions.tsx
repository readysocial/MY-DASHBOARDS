import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  Calendar,
  Clock,
  User,
  Tag,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { getListenerSessions } from '@/api/listener/getsessions/api';
import type { GetListenerSessionsResponse, Session } from '@/api/listener/getsessions/types';
// import { SessionStatusUpdate } from './SessionStatusUpdate';          // <-- commented out
import { SessionComment } from './SessionComment';
import { SessionRepeatRecommendation } from './SessionRepeatRecommendation';
import { SessionRelated } from './SessionRelated';
import { Button } from '@/components/ui/button';
import type { SessionStatus } from '@/api/listener/updatestatus/types';

const ITEMS_PER_PAGE = 5;

interface ListenerSessionsProps {
  listenerId: string;
}

export const ListenerSessions: React.FC<ListenerSessionsProps> = ({ listenerId }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchSessions = async () => {
    try {
      const response = await getListenerSessions();
      setSessions(response.sessions);
    } catch (error) {
      setError('Failed to fetch sessions');
      console.error('Failed to fetch sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const getStatusColor = (status: SessionStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'successful':
        return 'bg-green-100 text-green-800';
      case 'unsuccessful':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // const handleStatusUpdated = (sessionId: string, newStatus: SessionStatus) =>
  //   setSessions((prev) =>
  //     prev.map((s) => (s._id === sessionId ? { ...s, status: newStatus } : s))
  //   );

  const totalPages = Math.ceil(sessions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentSessions = sessions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading sessions...</div>
      </div>
    );

  if (error)
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </Card>
    );

  if (sessions.length === 0)
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Sessions Found</h3>
          <p className="text-gray-500 mt-2">You don't have any sessions scheduled yet.</p>
        </div>
      </Card>
    );

  return (
    <div className="space-y-6">
      {currentSessions.map((session) => (
        <Card key={session._id} id={`session-${session._id}`} className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-4 flex-grow">
              {/* User */}
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{session.user.anonymousName}</h3>
                  <p className="text-sm text-gray-500">Anonymous User</p>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(session.time)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(session.time)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <span>{session.topic}</span>
                </div>
              </div>

              {/* Reflection */}
              {session.reflectData && (
                <div className="mt-4 space-y-3 bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900">Session Reflection</h4>
                  {session.reflectData.userReflectionData.map((r) => (
                    <div key={r._id} className="bg-white p-3 rounded-md shadow-sm">
                      <p className="text-sm font-medium text-gray-700">{r.question}</p>
                      <p className="text-sm text-gray-600 mt-1">{r.answer}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Status Update */}
              {/* <SessionStatusUpdate
                sessionId={session._id}
                currentStatus={session.status as SessionStatus}
                sessionTime={session.time}
                onStatusUpdated={(newStatus) => handleStatusUpdated(session._id, newStatus)}
              /> */}

              {/* Comment */}
              <SessionComment
                sessionId={session._id}
                onCommentAdded={fetchSessions}
                isEditable={session.status !== 'pending'}
              />

              {/* Repeat Recommendation */}
              <SessionRepeatRecommendation
                sessionId={session._id}
                status={session.status as SessionStatus}
                onRecommendationMade={fetchSessions}
              />

              {/* Related Sessions */}
              <SessionRelated
                sessionId={session._id}
                isRepeatSession={!!session.repeatSessionId}
                repeatSessionId={session.repeatSessionId}
                onRelatedSessionClick={(relatedSession) => {
                  const el = document.getElementById(`session-${relatedSession._id}`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                    el.classList.add('ring-2', 'ring-blue-500');
                    setTimeout(() => el.classList.remove('ring-2', 'ring-blue-500'), 2000);
                  }
                }}
              />
            </div>

            {/* Status Badge */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                session.status as SessionStatus
              )}`}
            >
              {session.status}
            </span>
          </div>
        </Card>
      ))}

      {/* Pagination */}
      {totalPages >= 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <Button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="flex items-center gap-1 font-bold text-black"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <span className="text-sm font-bold">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 font-bold text-black"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};