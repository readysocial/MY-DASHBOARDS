import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, User, Tag, AlertCircle, ArrowRight, RefreshCw, Link2, CheckCircle2, XCircle, Clock3, ArrowLeft, MessageCircle } from 'lucide-react';
import { getRelatedSessions } from '@/api/listener/repeatsession/api';
import type { RelatedSessionsResponse, Session } from '@/api/listener/repeatsession/types';

interface SessionRelatedProps {
  sessionId: string;
  isRepeatSession?: boolean;
  repeatSessionId?: string;
  onRelatedSessionClick?: (session: Session) => void;
}

export const SessionRelated = ({ 
  sessionId, 
  isRepeatSession = false,
  repeatSessionId,
  onRelatedSessionClick 
}: SessionRelatedProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [relatedData, setRelatedData] = useState<RelatedSessionsResponse | null>(null);

  const fetchRelatedSessions = async () => {
    // Only fetch related sessions for parent sessions
    if (isRepeatSession) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await getRelatedSessions({ sessionId });
      setRelatedData(response);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch related sessions');
      console.error('Error fetching related sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId && !isRepeatSession) {
      fetchRelatedSessions();
    }
  }, [sessionId, isRepeatSession]);

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

  const getStatusIcon = (status: Session['status']) => {
    switch (status) {
      case 'successful':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'unsuccessful':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock3 className="h-4 w-4 text-blue-500" />;
    }
  };

  // If this is a repeat session, show link to parent
  if (isRepeatSession && repeatSessionId) {
    return (
      <div className="mt-4 border-t border-gray-100 pt-4">
        <Card 
          className="p-4 border-amber-100 hover:border-amber-200 hover:shadow-md cursor-pointer transition-all"
          onClick={() => onRelatedSessionClick?.({ _id: repeatSessionId } as Session)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-amber-100 rounded-full flex items-center justify-center">
                <Link2 className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">View Original Session</span>
                <span className="text-xs text-gray-500">This is a follow-up session</span>
              </div>
            </div>
            <ArrowLeft className="h-5 w-5 text-amber-400" />
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <RefreshCw className="h-5 w-5 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600 p-4">
        <AlertCircle className="h-5 w-5" />
        <span>{error}</span>
      </div>
    );
  }

  // Only show related sessions section if this is a parent session with repeats
  if (!relatedData?.baseSession?.repeats || !relatedData.relatedSessions.length) {
    return null;
  }

  // Filter sessions that have comments
  const sessionsWithComments = relatedData.relatedSessions.filter(
    session => session.comment && session.comment.trim() !== ''
  );

  // If no sessions have comments, don't show anything
  if (sessionsWithComments.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 border-t border-gray-100 pt-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="h-5 w-5 text-purple-500" />
        <h3 className="text-lg font-medium text-gray-900">Session Comments</h3>
        <span className="text-sm text-gray-500">
          ({sessionsWithComments.length})
        </span>
      </div>

      <div className="space-y-4">
        {sessionsWithComments.map((session) => (
          <Card 
            key={session._id}
            className="p-4 border-blue-100 hover:border-blue-200 hover:shadow-md cursor-pointer transition-all"
            onClick={() => onRelatedSessionClick?.(session)}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {session.user.anonymousName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(session.time)} at {formatTime(session.time)}
                    </span>
                  </div>
                </div>
                
                {/* Comment Display */}
                {session.comment && session.comment.trim() !== '' && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">{session.comment}</p>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                {getStatusIcon(session.status)}
                <ArrowRight className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};