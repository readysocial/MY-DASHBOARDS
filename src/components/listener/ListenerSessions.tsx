// ListenerSessions.tsx
import React, { useEffect, useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronFirst,
  ChevronLast,
  Eye,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableEmpty } from '@/components/ui/table';
import { TableCard } from '@/components/ui/table-card';
import { StatusBadge, statusToneFrom } from '@/components/ui/status-badge';
import { InlineAlert } from '@/components/ui/inline-alert';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

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
      <TableCard title="Sessions" description="Your booked sessions">
        <div className="space-y-2 p-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
        </div>
      </TableCard>
    );

  if (error)
    return (
      <InlineAlert variant="error" onDismiss={() => setError(null)}>
        {error}
      </InlineAlert>
    );

  if (total === 0)
    return (
      <TableCard title="Sessions" description="Your booked sessions">
        <EmptyState
          title="No Sessions Found"
          description="You don't have any sessions yet."
        />
      </TableCard>
    );

  return (
    <TableCard
      title="Sessions"
      description={`${total} session${total !== 1 ? 's' : ''} total`}
      footer={
        pageCount > 1 ? (
          <div className="flex w-full flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setPage(0)} disabled={page === 0} aria-label="Go to first page">
                <ChevronFirst size={16} strokeWidth={1.75} />
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} aria-label="Go to previous page">
                <ChevronLeft size={16} strokeWidth={1.75} />
              </Button>
            </div>
            <span className="text-xs tabular-nums text-rs-text-muted">
              Page {page + 1} of {pageCount}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={page === pageCount - 1} aria-label="Go to next page">
                <ChevronRight size={16} strokeWidth={1.75} />
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setPage(pageCount - 1)} disabled={page === pageCount - 1} aria-label="Go to last page">
                <ChevronLast size={16} strokeWidth={1.75} />
              </Button>
            </div>
          </div>
        ) : undefined
      }
    >
      <Table variant="plain">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>User</TableHead>
            <TableHead>Date &amp; Time</TableHead>
            <TableHead>Topic</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Repeats</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.length === 0 ? (
            <TableEmpty colSpan={6}>No sessions on this page</TableEmpty>
          ) : (
            rows.map((s) => {
              const userName = s.user?.anonymousName || 'Anonymous User';
              const repeatCount = Number(s.repeats?.count ?? 0);

              return (
                <TableRow key={s._id}>
                  {/* User */}
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-rs-primary-tint">
                        <User size={16} strokeWidth={1.75} className="text-rs-primary" />
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{userName}</div>
                        {isRepeat(s) && (
                          <div className="text-[11px] text-rs-text-muted">Repeat Session</div>
                        )}
                        {isParent(s) && (
                          <div className="text-[11px] text-rs-text-muted">Parent session</div>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Date & Time */}
                  <TableCell>
                    <div className="font-medium">{fmtDate(s.time)}</div>
                    <div className="text-xs text-rs-text-muted">{fmtTime(s.time)}</div>
                  </TableCell>

                  {/* Topic */}
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-rs-border bg-rs-page px-2 py-0.5 text-xs font-medium text-rs-text-secondary">
                      <Tag size={12} strokeWidth={1.75} className="text-rs-text-muted" />
                      {s.topic || 'No Topic'}
                    </span>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <StatusBadge tone={statusToneFrom(s.status || '')}>{s.status}</StatusBadge>
                  </TableCell>

                  {/* Repeat Count */}
                  <TableCell className="tabular-nums">{repeatCount}</TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href={`/listener/sessions/${s._id}/details`} passHref>
                        <Button variant="outline" size="sm" className="whitespace-nowrap">
                          <Eye size={14} strokeWidth={1.75} className="mr-1.5" />
                          View Details
                        </Button>
                      </Link>

                      {s.meetingLink?.trim() && (
                        <a
                          href={s.meetingLink.trim()}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" className="whitespace-nowrap">
                            <Video size={14} strokeWidth={1.75} className="mr-1.5" />
                            Join
                            <ExternalLink size={12} strokeWidth={1.75} className="ml-1" />
                          </Button>
                        </a>
                      )}

                      <SessionRepeatRecommendation
                        sessionId={s._id}
                        status={s.status}
                        onRecommendationMade={() => setPage(0)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      <div className="flex items-center gap-2 border-t border-rs-border px-4 py-3 text-xs text-rs-text-muted">
        <Calendar size={14} strokeWidth={1.75} />
        Meeting links appear when an admin adds them
      </div>
    </TableCard>
  );
};
