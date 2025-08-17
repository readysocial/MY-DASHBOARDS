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
  ChevronUp,
  ArrowRight
} from 'lucide-react';
import { getListenerSessions } from '@/api/listener/getsessions/api';
import type { Session } from '@/api/listener/getsessions/types';
import { SessionComment } from './SessionComment';
import { SessionRepeatRecommendation } from './SessionRepeatRecommendation';
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
      setIsLoading(true);
      const response = await getListenerSessions(); // Fixed: No parameter needed
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
  }, [listenerId]);

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
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'successful':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'unsuccessful':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getRepeatBadge = (session: Session) => {
    if (isParentSession(session)) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 font-medium border border-purple-200">
          <Repeat className="h-3 w-3 mr-1" />
          Parent Session ({session.repeats?.count} repeat{session.repeats?.count !== 1 ? 's' : ''})
        </span>
      );
    }
    if (isRepeatSession(session)) {
      const repeatStatus = getRepeatStatus(session);
      if (repeatStatus === 'pending') {
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 font-medium border border-yellow-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Pending Acceptance
          </span>
        );
      }
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800 font-medium border border-indigo-200">
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
  
  // Group sessions by parent session
  const groupSessionsByParent = (sessions: Session[]): { [key: string]: Session[] } => {
    const groups: { [key: string]: Session[] } = {};
    
    // First, find all parent sessions (those with repeats.count > 0)
    sessions.forEach(session => {
      if (isParentSession(session)) {
        groups[session._id] = [session];
      }
    });
    
    // Then, add child sessions to their parent groups
    sessions.forEach(session => {
      if (isRepeatSession(session) && session.repeatSessionId && groups[session.repeatSessionId]) {
        groups[session.repeatSessionId].push(session);
      }
    });
    
    // Add standalone sessions (not part of a repeat group)
    sessions.forEach(session => {
      if (!isRepeatSession(session) && !isParentSession(session)) {
        groups[session._id] = [session];
      }
    });
    
    return groups;
  };
  
  const renderTable = () => {
    const sessionGroups = groupSessionsByParent(currentSessions);
    const groupedSessionIds = Object.keys(sessionGroups);
    
    return (
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">User</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Date & Time</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Topic</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Notes</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Repeat</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {groupedSessionIds.map(groupId => {
              const group = sessionGroups[groupId];
              const parentSession = group[0];
              
              return (
                <React.Fragment key={groupId}>
                  {/* Parent Session Row */}
                  <tr className="bg-gray-50">
                    <td colSpan={7} className="px-6 py-2 border-t border-gray-200">
                      <div className="flex items-center">
                        {isParentSession(parentSession) && (
                          <button 
                            onClick={() => toggleRepeatSessions(parentSession._id)}
                            className="mr-2 text-gray-500 hover:text-gray-700 transition-colors"
                            aria-expanded={expandedRepeatSessions.has(parentSession._id)}
                            aria-label={expandedRepeatSessions.has(parentSession._id) ? "Collapse repeat sessions" : "Expand repeat sessions"}
                          >
                            {expandedRepeatSessions.has(parentSession._id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        <span className="font-semibold text-gray-800">
                          {isParentSession(parentSession) ? `Parent Session (${parentSession.repeats?.count} repeat${parentSession.repeats?.count !== 1 ? 's' : ''})` : 'Session'}
                        </span>
                      </div>
                    </td>
                  </tr>
                  
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center mr-3 border border-purple-200">
                          <User className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{parentSession.user.anonymousName}</div>
                          <div className="text-xs text-gray-500">Anonymous User</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{formatDate(parentSession.time)}</div>
                      <div className="text-gray-700">{formatTime(parentSession.time)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm bg-gray-100 text-gray-800 font-medium border border-gray-200">
                        <Tag className="h-4 w-4 mr-1.5 text-gray-500" />
                        {parentSession.topicRef?.topic || parentSession.topic}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${getStatusColor(parentSession.status)}`}>
                        {parentSession.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full">
                        <SessionComment
                          sessionId={parentSession._id}
                          existingComment={parentSession.comment}
                          canEdit={parentSession.status !== 'pending'}
                          onCommentAdded={fetchSessions}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRepeatBadge(parentSession)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        {parentSession.meetingLink && (
                          <a 
                            href={parentSession.meetingLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center transition-colors"
                          >
                            View Meeting <ArrowRight className="h-4 w-4 ml-1.5" />
                          </a>
                        )}
                        <SessionRepeatRecommendation
                          sessionId={parentSession._id}
                          status={parentSession.status}
                          onRecommendationMade={fetchSessions}
                        />
                      </div>
                    </td>
                  </tr>
                  
                  {/* Child Repeat Sessions */}
                  {isParentSession(parentSession) && expandedRepeatSessions.has(parentSession._id) && group.length > 1 && (
                    group.slice(1).map((childSession) => (
                      <tr key={childSession._id} className="bg-gray-50 hover:bg-gray-100 transition-colors">
                        <td className="pl-12 py-4 whitespace-nowrap border-l border-gray-200">
                          <div className="flex items-center">
                            <Repeat className="h-5 w-5 mr-3 text-indigo-500" />
                            <div>
                              <div className="font-medium text-gray-900">Repeat Session</div>
                              <div className="text-xs text-gray-500">Follow-up session</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{formatDate(childSession.time)}</div>
                          <div className="text-gray-700">{formatTime(childSession.time)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm bg-gray-100 text-gray-800 font-medium border border-gray-200">
                            <Tag className="h-4 w-4 mr-1.5 text-gray-500" />
                            {childSession.topicRef?.topic || childSession.topic}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${getStatusColor(childSession.status)}`}>
                              {childSession.status}
                            </span>
                            {getRepeatStatus(childSession) === 'pending' && (
                              <span className="mt-1.5 inline-flex items-center px-2.5 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800 font-medium border border-yellow-200">
                                <AlertTriangle className="h-4 w-4 mr-1.5" />
                                Pending Acceptance
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-full">
                            <SessionComment
                              sessionId={childSession._id}
                              existingComment={childSession.comment}
                              canEdit={childSession.status !== 'pending'}
                              onCommentAdded={fetchSessions}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRepeatBadge(childSession)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-2">
                            {childSession.meetingLink && (
                              <a 
                                href={childSession.meetingLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center transition-colors"
                              >
                                View Meeting <ArrowRight className="h-4 w-4 ml-1.5" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-700 font-medium">Loading sessions...</div>
      </div>
    );

  if (error)
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">{error}</span>
        </div>
      </Card>
    );

  if (sessions.length === 0)
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sessions Found</h3>
          <p className="text-gray-600">You don't have any sessions scheduled yet.</p>
        </div>
      </Card>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Your Sessions</h2>
          <p className="text-gray-600 mt-1">View and manage your sessions</p>
        </div>
      </div>
      
      {renderTable()}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 pt-6 gap-4">
          <Button
            onClick={handlePrev}
            disabled={currentPage === 1}
            variant="outline"
            className="flex items-center gap-2 font-medium text-gray-700 min-h-[40px] px-4 py-2 w-full sm:w-auto"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <span className="text-sm font-medium text-gray-700 py-2 px-4 bg-gray-50 rounded-lg">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            variant="outline"
            className="flex items-center gap-2 font-medium text-gray-700 min-h-[40px] px-4 py-2 w-full sm:w-auto"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};