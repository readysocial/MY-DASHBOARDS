import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  Calendar,
  Clock,
  User,
  Tag,
  ChevronLeft,
  ChevronRight,
  ChevronFirst,
  ChevronLast,
  ExternalLink,
  Eye,
  AlertCircle,
  Video,
} from 'lucide-react';
import { getListenerSessions } from '@/api/listener/getsessions/api';
import type { Session } from '@/api/listener/getsessions/types';
import { SessionRepeatRecommendation } from './SessionRepeatRecommendation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const ITEMS_PER_PAGE = 5;

/* ---------- helpers ---------- */
// Updated helpers to handle potentially undefined Session properties
const isParentSession = (s: Session): boolean => !!(s.repeats && typeof s.repeats.count === 'number' && s.repeats.count > 0);
const isRepeatSession   = (s: Session): boolean => !!(s.repeatSessionId); // Check for existence/truthiness

interface ListenerSessionsProps {
  listenerId: string;
}

export const ListenerSessions: React.FC<ListenerSessionsProps> = ({ listenerId }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  /* ---------- fetch ---------- */
  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      setError(null); // Reset error on new fetch
      const res = await getListenerSessions();
      // Ensure res.sessions is an array, defaulting to empty array if not
      setSessions(Array.isArray(res.sessions) ? res.sessions : []);
    } catch (e) {
      console.error("Error fetching listener sessions:", e);
      setError('Failed to fetch sessions');
      setSessions([]); // Ensure sessions is empty on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [listenerId]); // Consider if listenerId changes, we should refetch

  /* ---------- utils ---------- */
  // Updated formatters to handle potentially invalid date strings
  const fmtDate = (d: string | undefined) => {
    if (!d) return 'N/A'; // Handle undefined/null date
    const dateObj = new Date(d);
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
    }
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const fmtTime = (d: string | undefined) => {
    if (!d) return 'N/A'; // Handle undefined/null time
    const dateObj = new Date(d);
     // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
        return 'Invalid Time';
    }
    return dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Updated statusColor to handle potentially undefined status
  const statusColor = (status: Session['status'] | undefined) => {
    // Default case now also handles undefined status
    if (!status) return 'bg-gray-100 text-gray-800 border-gray-200';

    switch (status) {
      case 'pending':      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'successful':   return 'bg-green-100 text-green-800 border-green-200';
      case 'unsuccessful': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':    return 'bg-gray-100 text-gray-800 border-gray-200';
      default:             return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  /* ---------- paging ---------- */
  // Ensure totalPages calculation is safe even if sessions is unexpectedly not an array
  const safeSessionsLength = Array.isArray(sessions) ? sessions.length : 0;
  const totalPages = Math.ceil(safeSessionsLength / ITEMS_PER_PAGE);
  const startIdx   = (currentPage - 1) * ITEMS_PER_PAGE;
  // Ensure pageData is always a slice of an array
  const pageData   = Array.isArray(sessions) ? sessions.slice(startIdx, startIdx + ITEMS_PER_PAGE) : [];

  /* ---------- grouping ---------- */
  const groupByParent = (list: Session[]) => {
    const map: Record<string, Session[]> = {};

    // First, create entries for all parent sessions
    list.forEach(s => {
      if (isParentSession(s)) {
        map[s._id] = [s];
      }
    });

    // Then, associate child sessions with their parents
    list.forEach(s => {
      if (isRepeatSession(s) && s.repeatSessionId) {
        if (map[s.repeatSessionId]) {
          map[s.repeatSessionId].push(s);
        } else {
          // If parent doesn't exist in current view, create a group for the child
          map[s._id] = [s];
        }
      }
    });

    // Finally, handle standalone sessions (neither parent nor child)
    list.forEach(s => {
      // Check explicitly for neither parent nor repeat session
      if (!(isRepeatSession(s) || isParentSession(s))) {
        map[s._id] = [s];
      }
    });

    return map;
  };

  /* ---------- render ---------- */
  const renderTable = () => {
    // Ensure pageData is an array before grouping
    const groups = groupByParent(Array.isArray(pageData) ? pageData : []);
    const ids    = Object.keys(groups);

    return (
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">User</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Date & Time</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Topic</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Repeat Count</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Handle case where ids might be empty or groups is malformed */}
            {ids.length > 0 ? ids.map(groupId => {
              const sessionsInGroup = groups[groupId] || []; // Default to empty array if group key doesn't exist

              return sessionsInGroup.map((session, index) => {
                 // --- HANDLE EDGE CASES FOR SESSION FIELDS ---
                const userName = session.user?.anonymousName || 'Anonymous User';
                const sessionTime = session.time; // Pass raw time to formatter
                const sessionTopic = session.topic || 'No Topic';
                const sessionStatus = session.status; // Pass raw status to helper
                const repeatCount = (isParentSession(session) && typeof session.repeats?.count === 'number')
                                    ? session.repeats.count
                                    : 0;
                const meetingLink = session.meetingLink; // Used in conditional check below

                return (
                <tr key={`${session._id}-${index}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 border ${
                        isParentSession(session)
                          ? 'bg-purple-100 border-purple-200'
                          : isRepeatSession(session)
                            ? 'bg-blue-100 border-blue-200'
                            : 'bg-gray-100 border-gray-200'
                      }`}>
                        <User className={`h-4 w-4 ${
                          isParentSession(session)
                            ? 'text-purple-600'
                            : isRepeatSession(session)
                              ? 'text-blue-600'
                              : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        {/* Use userName variable with fallback */}
                        <div className="font-medium text-gray-900">{userName}</div>
                        <div className="text-xs text-gray-500">
                          {isRepeatSession(session) ? 'Repeat Session' : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {/* Use fmtDate and fmtTime helpers which now handle undefined/null */}
                    <div className="font-medium text-gray-900">{fmtDate(sessionTime)}</div>
                    <div className="text-sm text-gray-700">{fmtTime(sessionTime)}</div>
                  </td>
                  <td className="px-6 py-4">
                    {/* Use sessionTopic variable with fallback */}
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm bg-gray-100 text-gray-800 font-medium border border-gray-200">
                      <Tag className="h-4 w-4 mr-1.5 text-gray-500" />
                      {sessionTopic}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {/* Use statusColor helper which now handles undefined/null status */}
                    <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${statusColor(sessionStatus)}`}>
                      {sessionStatus || 'Unknown'} {/* Display status or fallback */}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {/* Use repeatCount variable */}
                    {repeatCount}
                  </td>
                  <td className="px-6 py-4 space-y-2">
                    {/* Ensure session._id exists before creating link */}
                    {session._id ? (
                      <Link href={`/listener/sessions/${session._id}/details`} passHref>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full flex items-center gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-500">Details N/A</span>
                    )}

                    {/* Handle meetingLink being null/undefined/empty string */}
                    {meetingLink && meetingLink.trim() && (
                      <a
                        href={meetingLink.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full"
                      >
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Video className="h-4 w-4" />
                          Join Meeting
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </a>
                    )}

                    {/* Ensure sessionId exists for recommendation component */}
                    {session._id ? (
                      <SessionRepeatRecommendation
                        sessionId={session._id}
                        status={session.status} // Pass raw status, component handles it
                        onRecommendationMade={fetchSessions}
                      />
                    ) : (
                      <span className="text-xs text-gray-500">Recommendation N/A</span>
                    )}
                  </td>
                </tr>
                );
              });
            }) : (
              // Render a row indicating no data for the page if ids is empty
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No sessions to display on this page.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    // Ensure totalPages is a positive number before generating pages
    if (totalPages <= 1) return [];

    const delta = 2; // Number of pages to show around current page
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];

    // Always include first page
    range.push(1);

    // Add dots if there's a gap between first page and current range
    if (currentPage - delta > 2) {
      rangeWithDots.push('...');
    }

    // Add pages around current page, ensuring they are within bounds
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    // Add dots if there's a gap between current range and last page
    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...');
    }

    // Always include last page if there's more than one page
    if (totalPages > 1) {
      range.push(totalPages);
    }

    // Combine ranges with dots
    range.forEach((page, index) => {
      // Check if we need to add dots before this page
      if (index > 0) {
        const prevItem = range[index - 1];
        // Only check for gap if both current and previous items are numbers
        if (typeof page === 'number' && typeof prevItem === 'number' && prevItem !== page - 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(page);
    });

    return rangeWithDots;
  };

  /* ---------- loading / empty / error ---------- */
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

  // Check if the overall sessions array is empty (after successful fetch)
  if (Array.isArray(sessions) && sessions.length === 0)
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sessions Found</h3>
          <p className="text-gray-600">You don't have any sessions scheduled yet.</p>
        </div>
      </Card>
    );

  /* ---------- main ---------- */
  return (
    <div className="space-y-6">
      {renderTable()}

      {/* Improved pagination - only show if there are multiple pages */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 pt-6 gap-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              variant="outline"
              className="flex items-center gap-2 font-medium min-h-[40px] px-3 py-2"
              aria-label="Go to first page"
            >
              <ChevronFirst className="h-4 w-4" />
            </Button>

            <Button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              variant="outline"
              className="flex items-center gap-2 font-medium min-h-[40px] px-3 py-2"
              aria-label="Go to previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-1">
            {generatePageNumbers().map((page, index) => (
              typeof page === 'number' ? (
                <Button
                  key={index}
                  onClick={() => setCurrentPage(page)}
                  variant={currentPage === page ? "default" : "outline"}
                  className={`min-h-[40px] px-4 py-2 font-medium ${
                    currentPage === page
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-label={`Go to page ${page}`}
                >
                  {page}
                </Button>
              ) : (
                <span
                  key={index} 
                  className="min-h-[40px] px-4 py-2 font-medium text-gray-500"
                >
                  {page}
                </span>
              )
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              className="flex items-center gap-2 font-medium min-h-[40px] px-3 py-2"
              aria-label="Go to next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              variant="outline"
              className="flex items-center gap-2 font-medium min-h-[40px] px-3 py-2"
              aria-label="Go to last page"
            >
              <ChevronLast className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};