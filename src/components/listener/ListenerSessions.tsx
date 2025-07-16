import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, User, Tag, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { getListenerSessions } from '@/api/listener/getsessions/api';
import type { GetListenerSessionsResponse, Session } from '@/api/listener/getsessions/types';
import { SessionMeetingLink } from './SessionMeetingLink';
import { SessionStatusUpdate } from './SessionStatusUpdate';
import { SessionComment } from './SessionComment';
import { SessionRepeatRecommendation } from './SessionRepeatRecommendation';
import { SessionRelated } from './SessionRelated';
import { Button } from '@/components/ui/button';
import type { SessionStatus } from '@/api/listener/updatestatus/types';

const ITEMS_PER_PAGE = 5;

export const ListenerSessions = () => {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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

  const handleMeetingLinkAdded = (sessionId: string, newLink: string) => {
    setSessions(prevSessions =>
      prevSessions.map(session =>
        session._id === sessionId
          ? { ...session, meetingLink: newLink }
          : session
      )
    );
  };

  const handleStatusUpdated = (sessionId: string, newStatus: SessionStatus) => {
    setSessions(prevSessions =>
      prevSessions.map(session =>
        session._id === sessionId
          ? { ...session, status: newStatus }
          : session
      )
    );
  };

  // Pagination logic
  const totalPages = Math.ceil(sessions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentSessions = sessions.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading sessions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Sessions Found</h3>
          <p className="text-gray-500 mt-2">You don't have any sessions scheduled yet.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {currentSessions.map((session) => (
        <Card key={session._id} id={`session-${session._id}`} className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-4 flex-grow">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{session.user.anonymousName}</h3>
                  <p className="text-sm text-gray-500">Anonymous User</p>
                </div>
              </div>

              {/* Session Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">{formatDate(session.time)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{formatTime(session.time)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Tag className="h-4 w-4" />
                  <span className="text-sm">{session.topic}</span>
                </div>
              </div>

              {/* Reflection Data */}
              {session.reflectData && (
                <div className="mt-4 space-y-3 bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900">Session Reflection</h4>
                  <div className="space-y-3">
                    {session.reflectData.userReflectionData.map((reflection) => (
                      <div key={reflection._id} className="bg-white p-3 rounded-md shadow-sm">
                        <p className="text-sm font-medium text-gray-700">{reflection.question}</p>
                        <p className="text-sm text-gray-600 mt-1">{reflection.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Meeting Link */}
              <SessionMeetingLink
                sessionId={session._id}
                initialMeetingLink={session.meetingLink}
                onLinkAdded={(newLink) => handleMeetingLinkAdded(session._id, newLink)}
                isEditable={session.status === 'pending'}
              />

              {/* Status Update */}
              <SessionStatusUpdate
                sessionId={session._id}
                currentStatus={session.status as SessionStatus}
                sessionTime={session.time}
                onStatusUpdated={(newStatus) => handleStatusUpdated(session._id, newStatus)}
              />

              {/* Session Comment */}
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
                  // Find the session in the list and scroll to it
                  const element = document.getElementById(`session-${relatedSession._id}`);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                    // Add a highlight effect
                    element.classList.add('ring-2', 'ring-blue-500');
                    setTimeout(() => {
                      element.classList.remove('ring-2', 'ring-blue-500');
                    }, 2000);
                  }
                }}
              />
            </div>

            {/* Status Badge */}
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status as SessionStatus)}`}>
              {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
            </span>
                      </div>
          </Card>
        ))}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <Button
                variant="outline"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(endIndex, sessions.length)}
                  </span>{' '}
                  of <span className="font-medium">{sessions.length}</span> results
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
}; 