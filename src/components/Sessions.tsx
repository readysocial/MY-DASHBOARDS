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
import { Modal } from '@/components/ui/modal';
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
import { SessionStatusUpdate, SessionPaymentCell } from '@/components/listener/SessionStatusUpdate';
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
  paymentStatus?: string;
  sessionCost?: number;
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rs-border pt-3">
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
          <div className="flex flex-wrap items-start gap-3">
            <SessionStatusUpdate
              sessionId={session._id}
              currentStatus={session.status}
              sessionTime={session.time}
              paymentStatus={session.paymentStatus}
              onStatusUpdated={(newStatus, nextPaymentStatus) => {
                setSessions((prev) =>
                  prev.map((s) =>
                    s._id === session._id
                      ? {
                          ...s,
                          status: newStatus,
                          ...(nextPaymentStatus
                            ? { paymentStatus: nextPaymentStatus }
                            : {}),
                        }
                      : s
                  )
                );
              }}
            />
            <SessionPaymentCell
              sessionId={session._id}
              currentStatus={session.status}
              paymentStatus={session.paymentStatus}
              onPaymentUpdated={(nextPaymentStatus) => {
                setSessions((prev) =>
                  prev.map((s) =>
                    s._id === session._id
                      ? { ...s, paymentStatus: nextPaymentStatus }
                      : s
                  )
                );
              }}
            />
          </div>
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
                <TableHead>Payment</TableHead>
                <TableHead>Meeting</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableEmpty colSpan={6}>No sessions found</TableEmpty>
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
                          paymentStatus={session.paymentStatus}
                          onStatusUpdated={(newStatus, nextPaymentStatus) => {
                            setSessions((prev) =>
                              prev.map((s) =>
                                s._id === session._id
                                  ? {
                                      ...s,
                                      status: newStatus,
                                      ...(nextPaymentStatus
                                        ? {
                                            paymentStatus: nextPaymentStatus,
                                          }
                                        : {}),
                                    }
                                  : s
                              )
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <SessionPaymentCell
                          sessionId={session._id}
                          currentStatus={session.status}
                          paymentStatus={session.paymentStatus}
                          onPaymentUpdated={(nextPaymentStatus) => {
                            setSessions((prev) =>
                              prev.map((s) =>
                                s._id === session._id
                                  ? { ...s, paymentStatus: nextPaymentStatus }
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

  const closeTopicModal = () => {
    setShowTopicModal(false);
    setNewTopic('');
    setTopicError(null);
    setEditingTopicId(null);
    setEditingTopicName('');
  };

  // --- renderTopicModal ---
  const renderTopicModal = () => (
    <Modal
      open={showTopicModal}
      onClose={closeTopicModal}
      title="Manage topics"
      description="Create and edit session topics used across the platform."
      className="max-w-xl"
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={closeTopicModal}>
            Close
          </Button>
          {!editingTopicId ? (
            <Button
              type="button"
              size="sm"
              onClick={handleCreateTopic}
              disabled={isTopicOperationLoading || !newTopic.trim()}
            >
              {isTopicOperationLoading ? (
                <>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Create topic
                </>
              )}
            </Button>
          ) : null}
        </>
      }
    >
      <div className="space-y-5">
        <div className="space-y-1.5">
          <label
            htmlFor="topic-name"
            className="text-[11px] font-medium text-rs-text-muted"
          >
            {editingTopicId ? 'Edit topic name' : 'New topic'}
          </label>
          <Input
            id="topic-name"
            value={editingTopicId ? editingTopicName : newTopic}
            placeholder={
              editingTopicId
                ? 'Updated topic name'
                : 'e.g. Career Development, Mental Health'
            }
            className="focus-visible:border-rs-text-muted/40 focus-visible:ring-rs-text-muted/20"
            onChange={(e) => {
              if (editingTopicId) setEditingTopicName(e.target.value);
              else setNewTopic(e.target.value);
              setTopicError(null);
            }}
            onKeyDown={(e) => {
              if (e.key !== 'Enter' || isTopicOperationLoading) return;
              if (editingTopicId) {
                handleEditTopic(editingTopicId, editingTopicName);
              } else {
                handleCreateTopic();
              }
            }}
          />
          {topicError ? (
            <p className="text-[11px] text-rs-primary">{topicError}</p>
          ) : (
            <p className="text-[11px] text-rs-text-muted">
              {editingTopicId
                ? 'Updating renames this topic on all sessions that use it.'
                : 'Use a clear name so users can find relevant sessions.'}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-medium text-rs-text-muted">
            Existing topics
          </p>
          {isLoadingTopics ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-4 w-4 animate-spin text-rs-text-muted" />
            </div>
          ) : existingTopics.length === 0 ? (
            <p className="rounded-lg border border-dashed border-rs-border px-3 py-6 text-center text-xs text-rs-text-muted">
              No topics yet. Create the first one above.
            </p>
          ) : (
            <ul className="divide-y divide-rs-border rounded-lg border border-rs-border">
              {existingTopics.map((topic) => (
                <li
                  key={topic._id}
                  className="flex items-center gap-2 px-3 py-2.5"
                >
                  {editingTopicId === topic._id ? (
                    <>
                      <Input
                        value={editingTopicName}
                        onChange={(e) => setEditingTopicName(e.target.value)}
                        className="h-8 flex-1 focus-visible:border-rs-text-muted/40 focus-visible:ring-rs-text-muted/20"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !isTopicOperationLoading) {
                            handleEditTopic(topic._id, editingTopicName);
                          }
                          if (e.key === 'Escape') {
                            setEditingTopicId(null);
                            setEditingTopicName('');
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-rs-success"
                        disabled={isTopicOperationLoading}
                        onClick={() =>
                          handleEditTopic(topic._id, editingTopicName)
                        }
                        aria-label="Save topic"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-rs-text-muted"
                        onClick={() => {
                          setEditingTopicId(null);
                          setEditingTopicName('');
                        }}
                        aria-label="Cancel edit"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Tag
                        className="h-3.5 w-3.5 shrink-0 text-rs-text-muted"
                        strokeWidth={1.75}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-rs-text">
                          {topic.topic}
                        </p>
                        {topic.count > 0 ? (
                          <p className="text-[11px] text-rs-text-muted">
                            {topic.count} session
                            {topic.count !== 1 ? 's' : ''}
                          </p>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-rs-text-muted"
                        disabled={isTopicOperationLoading}
                        onClick={() => {
                          setEditingTopicId(topic._id);
                          setEditingTopicName(topic.topic);
                        }}
                        aria-label={`Edit ${topic.topic}`}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-rs-text-muted hover:text-rs-primary"
                        disabled={isTopicOperationLoading}
                        onClick={() => handleDeleteTopic(topic._id)}
                        aria-label={`Delete ${topic.topic}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
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

      {renderTopicModal()}
    </div>
  );
};

export default Sessions;