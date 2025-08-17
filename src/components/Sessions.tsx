import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Plus, 
  Calendar, 
  X, 
  Eye, 
  Edit2, 
  Video,
  Clock,
  Headphones,
  RefreshCw,
  Tag,
  Check,
  Trash2,
  Copy,
  Repeat,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getAuthHeaders, handleUnauthorized, validateToken } from '../utils/api';
import { API_URL } from '@/config/api';
import { SessionMeetingLink } from '@/components/listener/SessionMeetingLink';
import { SessionStatusUpdate } from '@/components/listener/SessionStatusUpdate';
import { Button } from '@/components/ui/button';

interface User {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  anonymousName: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}
interface Listener {
  _id: string;
  name: string;
  description: string;
  gender: string;
  phoneNumber: string;
  email: string;
  active: boolean;
}
interface ReflectionQuestion {
  question: string;
  answer: string;
  _id: string;
}
interface ReflectData {
  userReflectionData: ReflectionQuestion[];
  _id: string;
}
interface TopicRef {
  _id: string;
  topic: string;
  count: number;
  createdAt: string;
  updatedAt: string;
}
interface Repeats {
  count: number;
  pendingAcceptance: boolean;
  _id: string;
}
interface Session {
  _id: string;
  user: User;
  listener: Listener;
  topic: string;
  topicRef?: TopicRef;
  time: string;
  meetingLink?: string;
  status: SessionStatus; 
  reflectData?: ReflectData;
  repeats?: Repeats;
  repeatSessionId?: string;
  createdAt: string;
  updatedAt: string;
}
type SessionProgress = 'scheduled' | 'ongoing' | 'completed';
type SessionStatus = 'successful' | 'unsuccessful' | 'cancelled' | 'pending';
const getSessionProgress = (sessionTime: string): SessionProgress => {
  const sessionDate = new Date(sessionTime);
  const now = new Date();
  const sessionDuration = 60 * 60 * 1000;
  const sessionEndTime = new Date(sessionDate.getTime() + sessionDuration);
  if (now < sessionDate) {
    return 'scheduled';
  } else if (now >= sessionDate && now <= sessionEndTime) {
    return 'ongoing';
  } else {
    return 'completed';
  }
};
const ProgressBadge: React.FC<{ progress: SessionProgress }> = ({ progress }) => {
  const progressClasses = {
    'scheduled': 'bg-blue-100 text-blue-800',
    'ongoing': 'bg-yellow-100 text-yellow-800',
    'completed': 'bg-green-100 text-green-800'
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs ${progressClasses[progress]}`}>
      {progress}
    </span>
  );
};
const rotateAnimation = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`;
const RefreshButton: React.FC<{ onClick: () => void; isLoading: boolean }> = ({ onClick, isLoading }) => {
  return (
    <>
      <style>{rotateAnimation}</style>
      <button
        onClick={onClick}
        disabled={isLoading}
        className={`p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors
          flex items-center justify-center ${isLoading ? 'cursor-not-allowed' : ''}`}
        title="Refresh"
      >
        <RefreshCw 
          className={`h-5 w-5 text-gray-600 
            ${isLoading ? 'animate-spin' : 'transform transition-transform hover:rotate-180'}`}
        />
      </button>
    </>
  );
};
const StatusBadge: React.FC<{ status: Session['status'] }> = ({ status }) => {
  const statusClasses = {
    'successful': 'bg-green-100 text-green-800',
    'unsuccessful': 'bg-yellow-100 text-yellow-800',
    'cancelled': 'bg-red-100 text-red-800',
    'pending': 'bg-blue-100 text-blue-800'
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs ${statusClasses[status]}`}>
      {status}
    </span>
  );
};
const RepeatBadge: React.FC<{ 
  repeats?: Repeats; 
  isParent?: boolean; 
  isChild?: boolean;
  pendingAcceptance?: boolean;
}> = ({ repeats, isParent, isChild, pendingAcceptance }) => {
  if (!repeats && !isParent && !isChild && pendingAcceptance === undefined) return null;
  let badgeText = '';
  let badgeClass = '';
  if (isParent) {
    badgeText = `Parent Session (${repeats?.count || 0} repeat${repeats?.count !== 1 ? 's' : ''})`;
    badgeClass = 'bg-purple-100 text-purple-800';
  } else if (isChild) {
    if (pendingAcceptance) {
      badgeText = 'Pending Acceptance';
      badgeClass = 'bg-yellow-100 text-yellow-800';
    } else {
      badgeText = 'Repeat Session';
      badgeClass = 'bg-indigo-100 text-indigo-800';
    }
  }
  return (
    <span className={`px-2 py-1 rounded-full text-xs ${badgeClass} flex items-center`}>
      <Repeat className="h-3 w-3 mr-1" />
      {badgeText}
    </span>
  );
};
const Sessions: React.FC = () => {
  useEffect(() => {
    validateToken();
  }, []);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sessionsPerPage] = useState(10);
  const [totalSessions, setTotalSessions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('time');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [isTopicOperationLoading, setIsTopicOperationLoading] = useState(false);
  const [topicError, setTopicError] = useState<string | null>(null);
  const [existingTopics, setExistingTopics] = useState<TopicRef[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingTopicName, setEditingTopicName] = useState('');
  const [expandedRepeatSessions, setExpandedRepeatSessions] = useState<Set<string>>(new Set());
  // Group sessions by parent session
  const groupSessionsByParent = (sessions: Session[]): { [key: string]: Session[] } => {
    const groups: { [key: string]: Session[] } = {};
    // First, find all parent sessions (those with repeats.count > 0)
    sessions.forEach(session => {
      if (session.repeats && session.repeats.count > 0) {
        groups[session._id] = [session];
      }
    });
    // Then, add child sessions to their parent groups
    sessions.forEach(session => {
      if (session.repeatSessionId && groups[session.repeatSessionId]) {
        groups[session.repeatSessionId].push(session);
      }
    });
    // Add standalone sessions (not part of a repeat group)
    sessions.forEach(session => {
      if (!session.repeatSessionId && !(session.repeats && session.repeats.count > 0)) {
        groups[session._id] = [session];
      }
    });
    return groups;
  };
  const fetchTopics = async () => {
    if (!validateToken()) return;
    setIsLoadingTopics(true);
    try {
      const response = await fetch(`${API_URL}/sessions/topics`, {
        headers: getAuthHeaders()
      });
      if (response.status === 401) {
        return handleUnauthorized(response);
      }
      const data = await response.json();
      if (data && Array.isArray(data.topics)) {
        setExistingTopics(data.topics);
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setIsLoadingTopics(false);
    }
  };
  useEffect(() => {
    if (showTopicModal) {
      fetchTopics();
    }
  }, [showTopicModal]);
  const fetchSessions = async () => {
    if (!validateToken()) return;
    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_URL}/sessions/platform/all?limit=1000`,
        {
          headers: getAuthHeaders()
        }
      );
      if (response.status === 401) {
        return handleUnauthorized(response);
      }
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch sessions');
      }
      if (data && Array.isArray(data.sessions)) {
        // Filter out invalid sessions, including those with missing user or anonymousName
        const validSessions = data.sessions.filter((session: Session) => 
          session && session._id && session.status && session.user
        );
        
        const sortedSessions = [...validSessions].sort((a, b) => {
          let compareA, compareB;
          switch (sortBy) {
            case 'user':
              // Safely handle anonymousName being null
              compareA = a.user?.anonymousName ?? '';
              compareB = b.user?.anonymousName ?? '';
              break;
            case 'listener':
              compareA = a.listener?.name || '';
              compareB = b.listener?.name || '';
              break;
            case 'time':
              compareA = new Date(a.time).getTime();
              compareB = new Date(b.time).getTime();
              break;
            case 'topic':
              compareA = a.topicRef?.topic || a.topic || '';
              compareB = b.topicRef?.topic || b.topic || '';
              break;
            case 'status':
              compareA = a.status || '';
              compareB = b.status || '';
              break;
            case 'repeats':
              compareA = a.repeats?.count || 0;
              compareB = b.repeats?.count || 0;
              break;
            default:
              compareA = new Date(a.time).getTime();
              compareB = new Date(b.time).getTime();
          }
          if (typeof compareA === 'string' && typeof compareB === 'string') {
            return sortOrder === 'asc' 
              ? compareA.localeCompare(compareB)
              : compareB.localeCompare(compareA);
          }
          return sortOrder === 'asc'
            ? (compareA < compareB ? -1 : 1)
            : (compareA > compareB ? -1 : 1);
        });
        setSessions(sortedSessions);
        setTotalSessions(sortedSessions.length);
        const startIndex = (currentPage - 1) * sessionsPerPage;
        const endIndex = startIndex + sessionsPerPage;
        setFilteredSessions(sortedSessions.slice(startIndex, endIndex));
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (!Array.isArray(sessions)) return;
    const filtered = sessions.filter((session: Session) => {
      // Skip sessions with missing user data
      if (!session || !session.user || !session.listener) return false;
      
      const searchTermLower = searchTerm.toLowerCase();
      
      // Safely handle anonymousName being null or undefined
      const userAnonymousName = session.user.anonymousName != null ? 
        String(session.user.anonymousName) : '';
        
      const listenerName = session.listener.name || '';
      const sessionTime = session.time ? new Date(session.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      const topicName = session.topicRef?.topic || session.topic || '';
      
      return (
        userAnonymousName.toLowerCase().includes(searchTermLower) ||
        listenerName.toLowerCase().includes(searchTermLower) ||
        sessionTime.includes(searchTerm) ||
        topicName.toLowerCase().includes(searchTermLower)
      );
    });
    setTotalSessions(filtered.length);
    const startIndex = (currentPage - 1) * sessionsPerPage;
    const endIndex = startIndex + sessionsPerPage;
    setFilteredSessions(filtered.slice(startIndex, endIndex));
  }, [searchTerm, sessions, currentPage, sessionsPerPage]);
  useEffect(() => {
    fetchSessions();
  }, [sortBy, sortOrder]);
  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };
  const handleSort = (column: string) => {
    const newSortOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(column);
    setSortOrder(newSortOrder);
    setCurrentPage(1);
  };
  const toggleRepeatSession = (sessionId: string) => {
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
  const generatePageNumbers = (currentPage: number, totalPages: number) => {
    const pageNumbers = [];
    pageNumbers.push(1);
    let start = Math.max(2, currentPage - 2);
    let end = Math.min(totalPages - 1, currentPage + 2);
    if (start > 2) {
      pageNumbers.push('...');
    }
    for (let i = start; i <= end; i++) {
      pageNumbers.push(i);
    }
    if (end < totalPages - 1) {
      pageNumbers.push('...');
    }
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }
    return pageNumbers;
  };
  // ✅ Create Topic Handler
  const handleCreateTopic = async () => {
    if (!validateToken()) return;
    if (!newTopic.trim()) {
      setTopicError('Please enter a topic name');
      return;
    }
    const topicExists = existingTopics.some(
      t => t.topic.toLowerCase() === newTopic.trim().toLowerCase()
    );
    if (topicExists) {
      setTopicError('This topic already exists');
      return;
    }
    setIsTopicOperationLoading(true);
    setTopicError(null);
    try {
      const response = await fetch(`${API_URL}/sessions/topics`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ topic: newTopic.trim().toLowerCase() })
      });
      if (response.status === 401) {
        return handleUnauthorized(response);
      }
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create topic');
      }
      setNewTopic('');
      fetchTopics();
      alert('Topic created successfully!');
    } catch (error) {
      console.error('Error creating topic:', error);
      setTopicError(error instanceof Error ? error.message : 'Failed to create topic');
    } finally {
      setIsTopicOperationLoading(false);
    }
  };
  // ✅ Edit Topic Handler
  const handleEditTopic = async (topicId: string, newTopicName: string) => {
    if (!newTopicName.trim()) {
      setTopicError('Topic name cannot be empty');
      return;
    }
    const topicExists = existingTopics.some(
      t => t._id !== topicId && t.topic.toLowerCase() === newTopicName.trim().toLowerCase()
    );
    if (topicExists) {
      setTopicError('This topic already exists');
      return;
    }
    setIsTopicOperationLoading(true);
    setTopicError(null);
    try {
      const response = await fetch(`${API_URL}/sessions/topics/${topicId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ topic: newTopicName.trim().toLowerCase() })
      });
      if (response.status === 401) {
        return handleUnauthorized(response);
      }
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update topic');
      }
      setEditingTopicId(null);
      setEditingTopicName('');
      fetchTopics();
    } catch (error) {
      console.error('Error updating topic:', error);
      setTopicError(error instanceof Error ? error.message : 'Failed to update topic');
    } finally {
      setIsTopicOperationLoading(false);
    }
  };
  // ✅ Delete Topic Handler
  const handleDeleteTopic = async (topicId: string) => {
    if (!window.confirm('Are you sure you want to delete this topic? This action cannot be undone.')) {
      return;
    }
    setIsTopicOperationLoading(true);
    try {
      const response = await fetch(`${API_URL}/sessions/topics/${topicId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.status === 401) {
        return handleUnauthorized(response);
      }
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete topic');
      }
      fetchTopics();
    } catch (error) {
      console.error('Error deleting topic:', error);
      setTopicError(error instanceof Error ? error.message : 'Failed to delete topic');
    } finally {
      setIsTopicOperationLoading(false);
    }
  };
  // ✅ Export Sessions function
  const exportSessions = async () => {
    if (!validateToken()) return;
    try {
      const response = await fetch(`${API_URL}/sessions/export`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (response.status === 401) {
        return handleUnauthorized(response);
      }
      if (!response.ok) {
        throw new Error('Failed to export sessions');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sessions_export.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting sessions:', error);
      alert('Failed to export sessions. Please try again.');
    }
  };
  // ✅ Mobile Card Renderer
  const renderMobileCard = (session: Session) => {
    // Skip rendering if session has no user
    if (!session.user) {
      return null;
    }
    
    const isParent = session.repeats && session.repeats.count > 0;
    const isChild = !!session.repeatSessionId;
    const pendingAcceptance = isChild && session.repeats?.pendingAcceptance;
    return (
      <div key={session._id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-medium text-gray-900">
              {/* Handle null/undefined anonymousName */}
              {session.user.anonymousName ?? 'Anonymous User'}
            </h3>
          </div>
          <div className="flex flex-col gap-2">
            <ProgressBadge progress={getSessionProgress(session.time)} />
            <StatusBadge status={session.status} />
            <RepeatBadge 
              repeats={session.repeats} 
              isParent={isParent} 
              isChild={isChild}
              pendingAcceptance={pendingAcceptance}
            />
          </div>
        </div>
        {isParent && expandedRepeatSessions.has(session._id) && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-700">Repeat Sessions ({session.repeats?.count})</span>
              <button 
                onClick={() => toggleRepeatSession(session._id)}
                className="text-gray-500 hover:text-gray-700"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
            </div>
            {sessions
              .filter(s => s.repeatSessionId === session._id)
              .map(repeatSession => {
                const repeatPending = repeatSession.repeats?.pendingAcceptance;
                return (
                  <div 
                    key={repeatSession._id} 
                    className="mt-2 p-2 bg-white border border-gray-200 rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-gray-500" />
                          <span className="text-sm">
                            {new Date(repeatSession.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center mt-1">
                          <Tag className="h-4 w-4 mr-1 text-gray-500" />
                          <span className="text-sm">
                            {repeatSession.topicRef?.topic || repeatSession.topic}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <StatusBadge status={repeatSession.status} />
                        {repeatPending ? (
                          <span className="text-xs text-yellow-600 mt-1 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Pending
                          </span>
                        ) : (
                          <span className="text-xs text-green-600 mt-1 flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Accepted
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center">
            <Headphones className="h-4 w-4 mr-2" />
            <div className="flex flex-col">
              <span>{session.listener.name}</span>
              <span className="text-xs text-gray-500">{session.listener.email}</span>
            </div>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            <span>{new Date(session.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center">
            <Tag className="h-4 w-4 mr-2" />
            <span>{session.topicRef?.topic || session.topic}</span>
          </div>
          {isParent && (
            <div className="flex items-center mt-2">
              <Repeat className="h-4 w-4 mr-2 text-purple-500" />
              <div className="flex items-center">
                <span className="text-sm text-purple-700">
                  Parent Session • {session.repeats?.count} repeat{session.repeats?.count !== 1 ? 's' : ''}
                </span>
                <button 
                  onClick={() => toggleRepeatSession(session._id)}
                  className="ml-2 text-purple-500 hover:text-purple-700"
                >
                  {expandedRepeatSessions.has(session._id) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}
          {isChild && (
            <div className="flex items-center mt-2">
              <Repeat className="h-4 w-4 mr-2 text-indigo-500" />
              <div className="flex flex-col">
                <span className="text-sm text-indigo-700">
                  Repeat Session
                </span>
                {pendingAcceptance && (
                  <span className="text-xs text-yellow-600 mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Awaiting listener acceptance
                  </span>
                )}
              </div>
            </div>
          )}
          {session.reflectData && (
            <div className="mt-4 border-t border-gray-100 pt-3">
              <h4 className="font-medium text-gray-900 mb-2">Session Reflection</h4>
              {session.reflectData.userReflectionData.map((reflection) => (
                <div key={reflection._id} className="mb-2 last:mb-0 pl-2 border-l-2 border-gray-200">
                  <p className="text-xs font-medium text-gray-500">{reflection.question}</p>
                  <p className="text-sm text-gray-900">{reflection.answer}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-4 space-y-3">
          {/* Meeting Link */}
          <div className="flex justify-between items-center">
            <SessionMeetingLink
              sessionId={session._id}
              initialMeetingLink={session.meetingLink}
              onLinkAdded={(newLink) => {
                setSessions(prev => prev.map(s => s._id === session._id ? { ...s, meetingLink: newLink } : s));
              }}
              isEditable={true}
            />
          </div>
          {/* ✅ New Status Update Component */}
          <div className="pt-2 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Update Status</h4>
            <SessionStatusUpdate
              sessionId={session._id}
              currentStatus={session.status}
              sessionTime={session.time}
              onStatusUpdated={(newStatus) => {
                setSessions(prev => prev.map(s => s._id === session._id ? { ...s, status: newStatus } : s));
              }}
            />
          </div>
        </div>
      </div>
    );
  };
  // ✅ Table Renderer
  const renderTable = () => {
    const sessionGroups = groupSessionsByParent(filteredSessions);
    const groupedSessionIds = Object.keys(sessionGroups);
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('user')}>User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('listener')}>Listener</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('time')}>Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('topic')}>Topic</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meeting Link</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('repeats')}>Repeats</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reflection</th>
              {/* ✅ New Column for Status Update */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Update Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {groupedSessionIds.map(groupId => {
              const group = sessionGroups[groupId];
              const parentSession = group[0];
              // Skip if parent session has no user
              if (!parentSession.user) {
                return null;
              }
              
              const isParent = parentSession.repeats && parentSession.repeats.count > 0;
              const hasChildren = group.length > 1;
              return (
                <React.Fragment key={groupId}>
                  <tr className="bg-gray-50">
                    <td colSpan={10} className="px-6 py-2">
                      <div className="flex items-center">
                        {isParent && (
                          <button 
                            onClick={() => toggleRepeatSession(parentSession._id)}
                            className="mr-2 text-gray-500 hover:text-gray-700"
                          >
                            {expandedRepeatSessions.has(parentSession._id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        <span className="font-medium text-gray-700">
                          {isParent ? `Parent Session (${parentSession.repeats?.count} repeat${parentSession.repeats?.count !== 1 ? 's' : ''})` : 'Session'}
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {/* Handle null/undefined anonymousName */}
                          {parentSession.user.anonymousName ?? 'Anonymous User'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-900">{parentSession.listener.name}</span>
                        <span className="text-xs text-gray-500">{parentSession.listener.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-900">
                          {new Date(parentSession.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {parentSession.topicRef?.topic || parentSession.topic}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SessionMeetingLink
                        sessionId={parentSession._id}
                        initialMeetingLink={parentSession.meetingLink}
                        onLinkAdded={(newLink) => {
                          setSessions(prev => prev.map(s => s._id === parentSession._id ? { ...s, meetingLink: newLink } : s));
                        }}
                        isEditable={true}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ProgressBadge progress={getSessionProgress(parentSession.time)} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={parentSession.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isParent ? (
                        <div className="flex items-center">
                          <Repeat className="h-4 w-4 mr-1 text-purple-500" />
                          <span className="text-sm text-purple-700">
                            {parentSession.repeats?.count} repeat{parentSession.repeats?.count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {parentSession.reflectData ? (
                        <div className="max-w-xs">
                          {parentSession.reflectData.userReflectionData.map((reflection) => (
                            <div key={reflection._id} className="mb-2 last:mb-0">
                              <p className="text-xs font-medium text-gray-500">{reflection.question}</p>
                              <p className="text-sm text-gray-900">{reflection.answer}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">No reflection</span>
                      )}
                    </td>
                    {/* ✅ New Column: Status Update */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SessionStatusUpdate
                        sessionId={parentSession._id}
                        currentStatus={parentSession.status}
                        sessionTime={parentSession.time}
                        onStatusUpdated={(newStatus) => {
                          setSessions(prev => prev.map(s => s._id === parentSession._id ? { ...s, status: newStatus } : s));
                        }}
                      />
                    </td>
                  </tr>
                  {isParent && expandedRepeatSessions.has(parentSession._id) && hasChildren && (
                    group.slice(1).map((childSession) => {
                      // Skip if child session has no user
                      if (!childSession.user) {
                        return null;
                      }
                      
                      const pendingAcceptance = childSession.repeats?.pendingAcceptance;
                      return (
                        <tr key={childSession._id} className="bg-gray-50">
                          <td className="pl-12 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <Repeat className="h-4 w-4 mr-2 text-indigo-500" />
                              <span className="text-sm font-medium text-gray-900">
                                Repeat Session
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-900">{childSession.listener.name}</span>
                              <span className="text-xs text-gray-500">{childSession.listener.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-900">
                                {new Date(childSession.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                            {childSession.topicRef?.topic || childSession.topic}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap">
                            <SessionMeetingLink
                              sessionId={childSession._id}
                              initialMeetingLink={childSession.meetingLink}
                              onLinkAdded={(newLink) => {
                                setSessions(prev => prev.map(s => s._id === childSession._id ? { ...s, meetingLink: newLink } : s));
                              }}
                              isEditable={true}
                            />
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap">
                            <ProgressBadge progress={getSessionProgress(childSession.time)} />
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <StatusBadge status={childSession.status} />
                              {pendingAcceptance && (
                                <span className="ml-2 text-xs text-yellow-600 flex items-center">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Pending
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap">
                            <span className="text-xs text-gray-500">Child session</span>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap">
                            {childSession.reflectData ? (
                              <div className="max-w-xs">
                                {childSession.reflectData.userReflectionData.map((reflection) => (
                                  <div key={reflection._id} className="mb-1">
                                    <p className="text-xs font-medium text-gray-500">{reflection.question}</p>
                                    <p className="text-xs text-gray-900">{reflection.answer}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500">No reflection</span>
                            )}
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap">
                            <SessionStatusUpdate
                              sessionId={childSession._id}
                              currentStatus={childSession.status}
                              sessionTime={childSession.time}
                              onStatusUpdated={(newStatus) => {
                                setSessions(prev => prev.map(s => s._id === childSession._id ? { ...s, status: newStatus } : s));
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };
  const renderTopicModal = () => (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" aria-hidden="true"></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-gray-900 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-gray-700">
          <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 bg-red-500/10 p-2 rounded-lg">
                  <Tag className="h-8 w-8 text-red-500" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-semibold text-white tracking-tight">
                  Manage Topics
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowTopicModal(false);
                  setNewTopic('');
                  setTopicError(null);
                  setEditingTopicId(null);
                }}
                className="text-gray-400 hover:text-gray-300 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          <div className="bg-gray-900 px-6 py-8">
            <div className="space-y-6">
              <div>
                <label htmlFor="topic-name" className="block text-lg font-medium text-gray-200 mb-3">
                  {editingTopicId ? 'Edit Topic Name' : 'Create New Topic'}
                </label>
                <div className="relative">
                  <input
                    id="topic-name"
                    type="text"
                    className="w-full px-5 py-4 text-xl bg-gray-800 border-2 border-gray-700 rounded-xl 
                      text-white placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500 
                      focus:ring-opacity-50 transition-all duration-200 shadow-sm
                      hover:border-gray-600"
                    placeholder={editingTopicId ? "Enter updated topic name" : "e.g., Career Development, Mental Health"}
                    value={editingTopicId ? editingTopicName : newTopic}
                    onChange={(e) => {
                      if (editingTopicId) {
                        setEditingTopicName(e.target.value);
                      } else {
                        setNewTopic(e.target.value);
                      }
                      setTopicError(null);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !isTopicOperationLoading) {
                        if (editingTopicId) {
                          handleEditTopic(editingTopicId, editingTopicName);
                        } else {
                          handleCreateTopic();
                        }
                      }
                    }}
                  />
                  {(!editingTopicId && newTopic) || (editingTopicId && editingTopicName) && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <Tag className="h-6 w-6 text-red-500" />
                    </div>
                  )}
                </div>
                {topicError && (
                  <div className="mt-3 flex items-center space-x-2 text-red-500">
                    <X className="h-5 w-5" />
                    <p className="text-sm">{topicError}</p>
                  </div>
                )}
                <p className="mt-3 text-sm text-gray-400">
                  {editingTopicId 
                    ? "Update the topic name. This will affect all sessions using this topic." 
                    : "Choose a clear and specific name that describes the topic. This will help users find relevant sessions."}
                </p>
              </div>
              <div className="mt-8">
                <h4 className="text-lg font-medium text-gray-200 mb-4 flex items-center">
                  <Tag className="h-5 w-5 mr-2 text-red-500" />
                  Existing Topics
                </h4>
                {isLoadingTopics ? (
                  <div className="flex justify-center py-4">
                    <RefreshCw className="h-6 w-6 text-gray-400 animate-spin" />
                  </div>
                ) : existingTopics.length > 0 ? (
                  <div className="space-y-3">
                    {existingTopics.map((topic) => (
                      editingTopicId === topic._id ? (
                        // Editing state
                        <div key={topic._id} className="flex items-center space-x-3 bg-gray-800 px-4 py-3 rounded-xl w-full">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={editingTopicName}
                              onChange={(e) => setEditingTopicName(e.target.value)}
                              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg 
                                border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                              placeholder="Enter updated topic name"
                            />
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditTopic(topic._id, editingTopicName)}
                              className="p-2 text-green-500 hover:text-green-400 transition-colors"
                              disabled={isTopicOperationLoading}
                            >
                              <Check className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingTopicId(null);
                                setEditingTopicName('');
                              }}
                              className="p-2 text-gray-400 hover:text-gray-300 transition-colors"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Normal state
                        <div key={topic._id} className="flex items-center justify-between bg-gray-800 px-4 py-3 rounded-xl w-full">
                          <div className="flex items-center space-x-3">
                            <Tag className="h-5 w-5 text-gray-400" />
                            <div>
                              <span className="text-base text-gray-300">{topic.topic}</span>
                              {topic.count > 0 && (
                                <span className="text-sm text-gray-500 ml-2">({topic.count} session{topic.count !== 1 ? 's' : ''})</span>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-3">
                            <button
                              onClick={() => {
                                setEditingTopicId(topic._id);
                                setEditingTopicName(topic.topic);
                              }}
                              className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                              disabled={isTopicOperationLoading}
                            >
                              <Edit2 className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTopic(topic._id)}
                              className="p-2 text-red-400 hover:text-red-300 transition-colors"
                              disabled={isTopicOperationLoading}
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-4 bg-gray-800 rounded-xl">
                    No topics found. Create your first topic!
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="bg-gray-800 px-6 py-4 sm:flex sm:flex-row-reverse sm:px-6 border-t border-gray-700">
            {editingTopicId ? null : (
              <button
                type="button"
                className="w-full sm:w-auto flex items-center justify-center px-6 py-3 rounded-xl
                  text-white text-lg font-medium bg-red-500 hover:bg-red-600 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-500
                  transition-colors duration-200 sm:ml-3"
                onClick={handleCreateTopic}
                disabled={isTopicOperationLoading || !newTopic.trim()}
              >
                {isTopicOperationLoading ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 mr-2" />
                    Create Topic
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              className="mt-3 sm:mt-0 w-full sm:w-auto flex items-center justify-center px-6 py-3 
                rounded-xl text-lg font-medium text-gray-300 bg-gray-700 hover:bg-gray-600
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
                transition-colors duration-200"
              onClick={() => {
                setShowTopicModal(false);
                setNewTopic('');
                setTopicError(null);
                setEditingTopicId(null);
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center justify-between mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Sessions</h1>
        </div>
        <div className="mt-4 sm:mt-0 sm:flex items-center space-x-4">
          <button 
            className="flex items-center justify-center bg-red-500 text-white 
              px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            onClick={() => {
              setEditingTopicId(null);
              setShowTopicModal(true);
            }}
          >
            <Tag className="h-4 w-4 mr-2" />
            <span>Manage Topics</span>
          </button>
          <RefreshButton 
            onClick={() => {
              setCurrentPage(1);
              fetchSessions();
            }}
            isLoading={isLoading}
          />
          <div className="relative w-64">
            <input
              type="text"
              className="w-full focus:ring-blue-500 focus:border-blue-500 block pr-10 
                sm:text-sm border-gray-300 rounded-lg"
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <button 
            className="flex items-center justify-center bg-green-500 text-white 
              px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            onClick={exportSessions}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span>Export Sessions</span>
          </button>
        </div>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <div className="flex space-x-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded-lg p-2 bg-white text-gray-800"
          >
            <option value="user">User</option>
            <option value="listener">Listener</option>
            <option value="time">Time</option>
            <option value="topic">Topic</option>
            <option value="repeats">Repeats</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="border rounded-lg p-2 bg-white text-gray-800"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
          <button
            onClick={() => {
              setCurrentPage(1);
              fetchSessions();
            }}
            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Sort
          </button>
        </div>
      </div>
      <div className="mt-8">
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-4 border-gray-200"></div>
              <div className="w-12 h-12 rounded-full border-4 border-red-500 border-t-transparent animate-spin absolute top-0 left-0"></div>
            </div>
          </div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : (
          <>
            <div className="hidden sm:block">{renderTable()}</div>
            <div className="sm:hidden space-y-4">{sessions.map(renderMobileCard)}</div>
            {showTopicModal && renderTopicModal()}
          </>
        )}
        <div className="mt-6 flex flex-wrap justify-center items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md text-sm ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Previous
          </button>
          {generatePageNumbers(currentPage, Math.ceil(totalSessions / sessionsPerPage)).map((pageNum, index) => (
            <button
              key={index}
              onClick={() => typeof pageNum === 'number' ? setCurrentPage(pageNum) : null}
              disabled={pageNum === '...'}
              className={`px-3 py-1 rounded-md text-sm ${
                pageNum === currentPage
                  ? 'bg-red-500 text-white'
                  : pageNum === '...'
                  ? 'bg-transparent cursor-default'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {pageNum}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalSessions / sessionsPerPage), prev + 1))}
            disabled={currentPage === Math.ceil(totalSessions / sessionsPerPage)}
            className={`px-3 py-1 rounded-md text-sm ${
              currentPage === Math.ceil(totalSessions / sessionsPerPage)
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
export default Sessions;