import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  Calendar,
  Clock,
  User,
  Tag,
  Repeat,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getListenerSessions } from '@/api/listener/getsessions/api';
import type { Session } from '@/api/listener/getsessions/types';
import { SessionComment } from './SessionComment';
import { SessionRepeatRecommendation } from './SessionRepeatRecommendation';
import { SessionRelated } from './SessionRelated';
import { Button } from '@/components/ui/button';
import { getRepeatStatus, isRepeatSession, isParentSession } from '@/api/listener/getsessions/api';

const ITEMS_PER_PAGE = 5;

interface ListenerSessionsProps {
  listenerId: string;
}

export const ListenerSessions: React.FC<ListenerSessionsProps> = ({ listenerId }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRepeatSessions, setExpandedRepeatSessions] = useState<Set<string>>(new Set());

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

  const getStatusColor = (status: Session['status']) => {
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

  const getRepeatBadge = (session: Session) => {
    if (isParentSession(session)) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
          <Repeat className="h-3 w-3 mr-1" />
          Parent Session ({session.repeats?.count} repeat{session.repeats?.count !== 1 ? 's' : ''})
        </span>
      );
    }
    
    if (isRepeatSession(session)) {
      const repeatStatus = getRepeatStatus(session);
      if (repeatStatus === 'pending') {
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Pending Acceptance
          </span>
        );
      }
      
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">
          <Repeat className="h-3 w-3 mr-1" />
          Repeat Session
        </span>
      );
    }
    
    return null;
  };

  const toggleRepeatSessions = (sessionId: string) => {
    setExpandedRepeatSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

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
      {currentSessions.map((session) => {
        const isParent = isParentSession(session);
        const isRepeat = isRepeatSession(session);
        const repeatStatus = getRepeatStatus(session);
        
        return (
          <div key={session._id}>
            <Card id={`session-${session._id}`} className="p-6">
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
                      <span>{session.topicRef?.topic || session.topic}</span>
                    </div>
                  </div>

                  {/* Repeat Session Indicator */}
                  {(isParent || isRepeat) && (
                    <div className="flex items-center gap-2">
                      {getRepeatBadge(session)}
                      {isParent && (
                        <button
                          onClick={() => toggleRepeatSessions(session._id)}
                          className="ml-2 text-gray-500 hover:text-gray-700"
                        >
                          {expandedRepeatSessions.has(session._id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Reflection */}
                  {session.reflectData && session.reflectData.userReflectionData.length > 0 && (
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

                  {/* Comment */}
                  <SessionComment
                sessionId={session._id}
                existingComment={session.comment}  // Pass the comment from API
                canEdit={session.status !== 'pending'}  // Renamed prop
                onCommentAdded={fetchSessions}
                  />

                  {/* Repeat Recommendation */}
                  <SessionRepeatRecommendation
                    sessionId={session._id}
                    status={session.status}
                    onRecommendationMade={fetchSessions}
                  />

                  {/* Related Sessions */}
                  <SessionRelated
                    sessionId={session._id}
                    isRepeatSession={isRepeat}
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
                <div className="flex flex-col items-end space-y-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      session.status
                    )}`}
                  >
                    {session.status}
                  </span>
                  {session.meetingLink && (
                    <a 
                      href={session.meetingLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View Meeting
                    </a>
                  )}
                </div>
              </div>
            </Card>

            {/* Child Repeat Sessions */}
            {isParent && expandedRepeatSessions.has(session._id) && (
              <div className="ml-8 mt-4 space-y-4">
                {sessions
                  .filter(s => s.repeatSessionId === session._id)
                  .map(repeatSession => (
                    <Card key={repeatSession._id} className="p-4 border-l-4 border-indigo-500">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-grow">
                          <div className="flex items-center gap-2">
                            <Repeat className="h-4 w-4 text-indigo-500" />
                            <span className="font-medium">Repeat Session</span>
                            {getRepeatStatus(repeatSession) === 'pending' && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Pending
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(repeatSession.time)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{formatTime(repeatSession.time)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Tag className="h-4 w-4" />
                              <span>{repeatSession.topicRef?.topic || repeatSession.topic}</span>
                            </div>
                          </div>
                          
                          {repeatSession.meetingLink && (
                            <a 
                              href={repeatSession.meetingLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View Meeting
                            </a>
                          )}
                        </div>
                        
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            repeatSession.status
                          )}`}
                        >
                          {repeatSession.status}
                        </span>
                      </div>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        );
      })}

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