// ListenerSessions.tsx
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronFirst,
  ChevronLast,
  Eye,
  AlertCircle,
  Video,
  ExternalLink,
  User,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getListenerSessions } from '@/api/listener/getsessions/api';
import type { Session } from '@/api/listener/getsessions/types';
import { SessionRepeatRecommendation } from './SessionRepeatRecommendation';

/* ---------- helpers ---------- */
const isParent = (s: Session): boolean => Number(s.repeats?.count) > 0;
const isRepeat = (s: Session): boolean => !!s.repeatSessionId;

const fmtDate = (d?: string) => {
  if (!d) return 'N/A';
  const date = new Date(d);
  return isNaN(date.getTime())
    ? 'Invalid Date'
    : date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
};

const fmtTime = (d?: string) => {
  if (!d) return 'N/A';
  const date = new Date(d);
  return isNaN(date.getTime())
    ? 'Invalid Time'
    : date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const statusBadge = (st?: Session['status']) => {
  const base = 'px-3 py-1.5 rounded-full text-xs font-medium border';
  switch (st) {
    case 'pending':
      return `${base} bg-yellow-100 text-yellow-800 border-yellow-200`;
    case 'successful':
      return `${base} bg-green-100 text-green-800 border-green-200`;
    case 'unsuccessful':
      return `${base} bg-red-100 text-red-800 border-red-200`;
    case 'cancelled':
      return `${base} bg-gray-100 text-gray-800 border-gray-200`;
    default:
      return `${base} bg-gray-100 text-gray-800 border-gray-200`;
  }
};

/* ---------- component ---------- */
const ITEMS_PER_PAGE = 5;

export const ListenerSessions: React.FC<{ listenerId: string }> = ({ listenerId }) => {
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<Session[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---------- server-side pagination ---------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getListenerSessions({
          skip: page * ITEMS_PER_PAGE,
          limit: ITEMS_PER_PAGE,
        });
        if (!cancelled) {
          setRows(res.sessions);
          setTotal(res.total);
        }
      } catch (e) {
        if (!cancelled) {
          setError((e as Error)?.message || 'Failed to fetch sessions');
          setRows([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [listenerId, page]);

  const pageCount = Math.ceil(total / ITEMS_PER_PAGE);

  /* ---------- render ---------- */
  if (loading)
    return (
      <Card className="p-6">
        <div className="flex h-64 items-center justify-center text-gray-700">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
            <span className="text-sm font-medium">Loading sessions...</span>
          </div>
        </div>
      </Card>
    );

  if (error)
    return (
      <Card className="p-6">
        <div className="flex items-start gap-3 text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <span className="font-medium">Error</span>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        </div>
      </Card>
    );

  if (total === 0)
    return (
      <Card className="p-8 text-center">
        <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-lg font-semibold text-gray-900">No Sessions Found</h3>
        <p className="text-gray-600">You don’t have any sessions yet.</p>
      </Card>
    );

  return (
    <div className="space-y-6">
      {/* ---------- table container ---------- */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                User
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                Date & Time
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                Topic
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                Repeats
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 bg-white">
            {rows.map((s) => {
              const userName = s.user?.anonymousName || 'Anonymous User';
              const repeatCount = Number(s.repeats?.count ?? 0);

              return (
                <tr key={s._id}>
                  {/* User */}
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div
                        className={`mr-3 flex h-9 w-9 items-center justify-center rounded-full border ${
                          isParent(s)
                            ? 'bg-purple-100 border-purple-200'
                            : isRepeat(s)
                            ? 'bg-blue-100 border-blue-200'
                            : 'bg-gray-100 border-gray-200'
                        }`}
                      >
                        <User
                          className={`h-5 w-5 ${
                            isParent(s) ? 'text-purple-600' : isRepeat(s) ? 'text-blue-600' : 'text-gray-600'
                          }`}
                        />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{userName}</div>
                        {isRepeat(s) && (
                          <div className="mt-1 text-xs text-gray-500">🔁 Repeat Session</div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Date & Time */}
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{fmtDate(s.time)}</div>
                    <div className="mt-1 text-sm text-gray-700">{fmtTime(s.time)}</div>
                  </td>

                  {/* Topic */}
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-800">
                      <Tag className="mr-1.5 h-4 w-4 text-gray-500" />
                      {s.topic || 'No Topic'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={statusBadge(s.status)}>{s.status}</span>
                  </td>

                  {/* Repeat Count */}
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <span className="font-bold text-gray-900">{repeatCount}</span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      <Link href={`/listener/sessions/${s._id}/details`} passHref>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2 font-bold"
                          style={{
                            transition: 'none',
                            backgroundColor: 'transparent',
                            borderColor: '#D1D5DB',
                            color: '#374151',
                          }}
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                      </Link>

                      {s.meetingLink?.trim() && (
                        <a
                          href={s.meetingLink.trim()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full"
                        >
                          <Button
                            size="sm"
                            className="w-full justify-start gap-2 font-bold"
                            style={{
                              transition: 'none',
                              backgroundColor: '#3B82F6',
                              color: 'white',
                              borderColor: '#3B82F6',
                            }}
                          >
                            <Video className="h-4 w-4" />
                            Join Meeting
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </a>
                      )}

                      <SessionRepeatRecommendation
                        sessionId={s._id}
                        status={s.status}
                        onRecommendationMade={() => setPage(0)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ---------- pagination ---------- */}
      {pageCount > 1 && (
        <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-6 sm:flex-row">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              onClick={() => setPage(0)}
              disabled={page === 0}
              aria-label="Go to first page"
              className="h-8 w-8 p-0 font-bold text-gray-900 hover:text-gray-800"
              style={{
                transition: 'all 0.2s ease',
                backgroundColor: 'transparent',
                borderColor: '#E5E7EB',
                color: '#1F2937', // <-- DARKER CHEVRON COLOR
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#D1D5DB')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E5E7EB')}
            >
              <ChevronFirst className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              aria-label="Go to previous page"
              className="h-8 w-8 p-0 font-bold text-gray-900 hover:text-gray-800"
              style={{
                transition: 'all 0.2s ease',
                backgroundColor: 'transparent',
                borderColor: '#E5E7EB',
                color: '#1F2937', // <-- DARKER CHEVRON COLOR
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#D1D5DB')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E5E7EB')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          <span className="text-sm font-bold text-gray-900">
            Page {page + 1} of {pageCount}
          </span>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={page === pageCount - 1}
              aria-label="Go to next page"
              className="h-8 w-8 p-0 font-bold text-gray-900 hover:text-gray-800"
              style={{
                transition: 'all 0.2s ease',
                backgroundColor: 'transparent',
                borderColor: '#E5E7EB',
                color: '#1F2937', // <-- DARKER CHEVRON COLOR
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#D1D5DB')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E5E7EB')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(pageCount - 1)}
              disabled={page === pageCount - 1}
              aria-label="Go to last page"
              className="h-8 w-8 p-0 font-bold text-gray-900 hover:text-gray-800"
              style={{
                transition: 'all 0.2s ease',
                backgroundColor: 'transparent',
                borderColor: '#E5E7EB',
                color: '#1F2937', // <-- DARKER CHEVRON COLOR
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#D1D5DB')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E5E7EB')}
            >
              <ChevronLast className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};