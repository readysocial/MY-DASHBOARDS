import React, { useEffect, useState } from 'react';
import {
  Plus,
  X,
  Edit2,
  Video,
  RefreshCw,
  Tag,
  Check,
  Trash2,
  Download,
} from 'lucide-react';
import { getAuthHeaders, handleUnauthorized, validateToken } from '../utils/api';
import { API_URL } from '@/config/api';
import { SessionMeetingLink } from '@/components/listener/SessionMeetingLink';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
  SortableTableHead,
} from '@/components/ui/table';
import { TableCard } from '@/components/ui/table-card';
import { TablePagination } from '@/components/ui/table-pagination';
import { TableCardSearch } from '@/components/ui/table-search';
import { Skeleton } from '@/components/ui/skeleton';
import { SessionStatusUpdate } from '@/components/listener/SessionStatusUpdate';
import { confirm } from '@/lib/confirm';
import { cn } from '@/lib/utils';

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
  time: string; // This is the ISO 8601 string from the backend
  meetingLink?: string;
  status: SessionStatus;
  reflectData?: ReflectData;
  repeats?: Repeats;
  repeatSessionId?: string; // Indicates this session is a repeat
  createdAt: string;
  updatedAt: string;
  isRepeated?: boolean; // Derived: true if repeatSessionId exists
  repeatCount?: number; // Derived: count from repeats object for original sessions
}
type SessionProgress = 'scheduled' | 'ongoing' | 'completed';
type SessionStatus = 'successful' | 'unsuccessful' | 'cancelled' | 'pending';

// --- SessionProgressBadge remains the same ---
/** Tiny timing hint — not a second status pill. */
const ProgressHint: React.FC<{ progress: SessionProgress }> = ({
  progress,
}) => (
  <span className="text-[11px] capitalize text-rs-text-muted">{progress}</span>
);

// Helper function to format date with proper timezone handling
const formatDateDisplay = (dateString: string) => {
  const date = new Date(dateString);
  // Format date (e.g., "Mar 6, 2025")
  const formattedDate = date.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  // Format time in 24-hour format (e.g., "18:15")
  const formattedTime = date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return { formattedDate, formattedTime };
};

// Alternative function if you want to display UTC time instead of local time
const formatDateDisplayUTC = (dateString: string) => {
  const date = new Date(dateString);
  // Format UTC date
  const formattedDate = date.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });
  // Format UTC time
  const formattedTime = date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC'
  });
  return { formattedDate, formattedTime };
};

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
        const validSessions = data.sessions.filter((session: Session) =>
          session && session._id && session.status && session.user
        );
        // Process sessions: add isRepeated and repeatCount fields
        const processedSessions = validSessions.map((session: Session) => {
          if (session.repeatSessionId) {
            return {
              ...session,
              isRepeated: true,
              repeatCount: undefined
            };
          } else if (session.repeats && session.repeats.count !== undefined) {
            return {
              ...session,
              isRepeated: false,
              repeatCount: session.repeats.count
            };
          } else {
            return {
              ...session,
              isRepeated: false,
              repeatCount: 0
            };
          }
        });
        const sortedSessions = [...processedSessions].sort((a, b) => {
          let compareA, compareB;
          switch (sortBy) {
            case 'user':
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
              compareA = a.repeatCount !== undefined ? a.repeatCount : (a.repeats?.count || 0);
              compareB = b.repeatCount !== undefined ? b.repeatCount : (b.repeats?.count || 0);
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
      if (!session || !session.user) return false;
      const searchTermLower = searchTerm.toLowerCase();
      const userAnonymousName = session.user.anonymousName != null ?
        String(session.user.anonymousName) : '';
      const listenerName = session.listener?.name || '';
      // Format the date for search, including date and time
      const sessionDate = new Date(session.time);
      const formattedDateTime = sessionDate.toLocaleString([], {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace(',', '');
      const topicName = session.topicRef?.topic || session.topic || '';
      return (
        userAnonymousName.toLowerCase().includes(searchTermLower) ||
        listenerName.toLowerCase().includes(searchTermLower) ||
        formattedDateTime.includes(searchTerm) ||
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

  // Topic management handlers (unchanged)
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

  const handleDeleteTopic = async (topicId: string) => {
    const confirmed = await confirm({
      title: 'Delete Topic',
      description: 'Are you sure you want to delete this topic? This action cannot be undone.',
      confirmText: 'Delete',
    });
    if (!confirmed) return;
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

  const renderMobileCard = (session: Session) => {
    if (!session.user) {
      return null;
    }
    const { formattedDate, formattedTime } = formatDateDisplay(session.time);
    const topic = session.topicRef?.topic || session.topic;
    return (
      <div
        key={session._id}
        className="space-y-3 rounded-lg border border-rs-border bg-rs-surface p-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium text-rs-text">
              {session.user.anonymousName ?? 'Anonymous User'}
            </p>
            <p className="truncate text-xs text-rs-text-muted">
              {session.listener?.name ?? 'No listener'}
              {session.isRepeated
                ? ' · Repeated'
                : session.repeatCount
                  ? ` · ${session.repeatCount} repeats`
                  : ''}
            </p>
          </div>
          <ProgressHint progress={getSessionProgress(session.time)} />
        </div>
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <div>
            <p className="text-rs-text">{formattedDate}</p>
            <p className="text-xs text-rs-text-muted">{formattedTime}</p>
          </div>
          <p className="max-w-[50%] truncate text-right text-rs-text-secondary">
            {topic}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rs-border pt-3">
          <SessionMeetingLink
            sessionId={session._id}
            initialMeetingLink={session.meetingLink}
            onLinkAdded={(newLink) => {
              setSessions((prev) =>
                prev.map((s) =>
                  s._id === session._id ? { ...s, meetingLink: newLink } : s
                )
              );
            }}
            isEditable={true}
          />
          <SessionStatusUpdate
            sessionId={session._id}
            currentStatus={session.status}
            sessionTime={session.time}
            onStatusUpdated={(newStatus) => {
              setSessions((prev) =>
                prev.map((s) =>
                  s._id === session._id ? { ...s, status: newStatus } : s
                )
              );
            }}
          />
        </div>
      </div>
    );
  };

  const totalPages = Math.max(1, Math.ceil(totalSessions / sessionsPerPage));

  const sessionsCardActions = (
    <TableCardSearch
      value={searchTerm}
      onChange={(value) => {
        setSearchTerm(value);
        setCurrentPage(1);
      }}
      aria-label="Search sessions"
    />
  );

  const renderSessionsPanel = () => {
    const rows = filteredSessions.filter((session) => session.user);

    return (
      <TableCard
        title="All sessions"
        description={`${totalSessions} booking${totalSessions === 1 ? '' : 's'}`}
        actions={sessionsCardActions}
        footer={
          <TablePagination
            page={currentPage}
            totalPages={totalPages}
            total={totalSessions}
            itemLabel="sessions"
            onPageChange={setCurrentPage}
          />
        }
      >
        <div className="hidden sm:block">
          <Table variant="plain">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <SortableTableHead
                  column="user"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                >
                  Session
                </SortableTableHead>
                <SortableTableHead
                  column="time"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                >
                  When
                </SortableTableHead>
                <SortableTableHead
                  column="topic"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                >
                  Topic
                </SortableTableHead>
                <TableHead>Status</TableHead>
                <TableHead>Meeting</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableEmpty colSpan={5}>No sessions found</TableEmpty>
              ) : (
                rows.map((session) => {
                  const { formattedDate, formattedTime } = formatDateDisplay(
                    session.time
                  );
                  const metaBits = [
                    session.listener?.name,
                    session.isRepeated
                      ? 'Repeated'
                      : session.repeatCount
                        ? `${session.repeatCount} repeats`
                        : null,
                  ].filter(Boolean);

                  return (
                    <TableRow key={session._id}>
                      <TableCell className="max-w-[14rem]">
                        <p className="truncate font-medium text-rs-text">
                          {session.user.anonymousName ?? 'Anonymous User'}
                        </p>
                        <p className="truncate text-xs text-rs-text-muted">
                          {metaBits.length > 0
                            ? metaBits.join(' · ')
                            : 'No listener'}
                        </p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <p className="text-sm text-rs-text">{formattedDate}</p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-rs-text-muted">
                            {formattedTime}
                          </span>
                          <span className="text-rs-border">·</span>
                          <ProgressHint
                            progress={getSessionProgress(session.time)}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[12rem]">
                        <span className="line-clamp-1 text-sm text-rs-text">
                          {session.topicRef?.topic || session.topic}
                        </span>
                      </TableCell>
                      <TableCell>
                        <SessionStatusUpdate
                          sessionId={session._id}
                          currentStatus={session.status}
                          sessionTime={session.time}
                          onStatusUpdated={(newStatus) => {
                            setSessions((prev) =>
                              prev.map((s) =>
                                s._id === session._id
                                  ? { ...s, status: newStatus }
                                  : s
                              )
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <SessionMeetingLink
                          sessionId={session._id}
                          initialMeetingLink={session.meetingLink}
                          onLinkAdded={(newLink) => {
                            setSessions((prev) =>
                              prev.map((s) =>
                                s._id === session._id
                                  ? { ...s, meetingLink: newLink }
                                  : s
                              )
                            );
                          }}
                          isEditable={true}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <div className="space-y-2 p-3 sm:hidden">
          {rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-rs-text-muted">
              No sessions found
            </p>
          ) : (
            rows.map(renderMobileCard)
          )}
        </div>
      </TableCard>
    );
  };

  // --- renderTopicModal function remains the same ---
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
    <div className="space-y-6">
      <PageHeader
        title="Sessions"
        description="Review bookings, meeting links, and session outcomes."
        icon={<Video strokeWidth={1.75} />}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCurrentPage(1);
                fetchSessions();
              }}
              disabled={isLoading}
            >
              <RefreshCw
                className={cn('mr-2 h-3.5 w-3.5', isLoading && 'animate-spin')}
              />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportSessions}>
              <Download className="mr-2 h-3.5 w-3.5" />
              Export
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingTopicId(null);
                setShowTopicModal(true);
              }}
            >
              <Tag className="mr-2 h-3.5 w-3.5" />
              Manage Topics
            </Button>
          </>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rs-border bg-rs-surface px-4 py-8 text-center text-sm text-rs-text">
          {error}
        </div>
      ) : (
        renderSessionsPanel()
      )}

      {showTopicModal && renderTopicModal()}
    </div>
  );
};

export default Sessions;