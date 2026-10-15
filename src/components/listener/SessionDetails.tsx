// src/components/listener/SessionDetails.tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getFullSessionTree } from '@/api/listener/session-tree/api';
import { addSessionComment } from '@/api/listener/comment/api';
import { getRelatedSessions } from '@/api/listener/repeatsession/api';
import type { FullSessionTreeResponse, SessionTreeNode } from '@/api/listener/session-tree/types';
import type { RelatedSessionsResponse } from '@/api/listener/repeatsession/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { PageError } from '@/components/ui/page-error';
import { StatusBadge, statusToneFrom } from '@/components/ui/status-badge';
import { TableCard } from '@/components/ui/table-card';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Tag,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Link2,
  AlertTriangle,
  MessageCircle,
} from 'lucide-react';
import Link from 'next/link';

const THREAD_ITEMS_PER_PAGE = 10;

export const SessionDetails: React.FC = () => {
  const router = useRouter();
  const { sessionId } = router.query;

  const [data, setData] = useState<FullSessionTreeResponse | null>(null);
  const [relatedData, setRelatedData] = useState<RelatedSessionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(true);
  const [visibleThreadCount, setVisibleThreadCount] = useState(THREAD_ITEMS_PER_PAGE);

  const fetchTree = async () => {
    if (!sessionId || typeof sessionId !== 'string') return;
    try {
      const token = localStorage.getItem('listenerToken');
      if (!token) throw new Error('No token');
      const res = await getFullSessionTree(sessionId, token);
      setData(res);
    } catch (e: any) {
      setError(e.message || 'Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedSessions = async () => {
    if (!sessionId || typeof sessionId !== 'string') return;
    try {
      const res = await getRelatedSessions({ sessionId });
      setRelatedData(res);
    } catch (e: any) {
      console.error('Failed to load related sessions:', e);
    }
  };

  useEffect(() => { 
    fetchTree(); 
    fetchRelatedSessions();
  }, [sessionId]);

  const handleLoadMore = () => {
    setVisibleThreadCount(prev => prev + THREAD_ITEMS_PER_PAGE);
  };

  if (loading)
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  if (error) return <PageError message={error} onRetry={() => window.location.reload()} />;
  if (!data) return null;

  const { parent, children } = data;

  // Show all related sessions for threaded view (not just those with comments)
  const allRelatedSessions = relatedData?.relatedSessions || [];
  
  // Sort related sessions chronologically
  const sortedRelatedSessions = [...allRelatedSessions].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
  );
  
  // Combine parent and related sessions for threading
  const allThreadSessions = [parent, ...sortedRelatedSessions];
  
  // Determine which sessions to show based on visible count
  const visibleSessions = allThreadSessions.slice(0, visibleThreadCount);
  const hasMoreSessions = visibleThreadCount < allThreadSessions.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Session Details"
        description="Review booking, notes, and follow-ups."
        actions={
          <Link href="/listener/sessions" passHref>
            <Button variant="outline" size="sm">
              <ArrowLeft size={14} strokeWidth={1.75} className="mr-1.5" />
              Back to Sessions
            </Button>
          </Link>
        }
      />

      <SessionCardWithNotes session={parent} title="Parent Session" onSave={fetchTree} />

      {/* Related Sessions Threaded View Section */}
      {allRelatedSessions.length > 0 && (
        <TableCard
          title={`Session Thread (${allRelatedSessions.length + 1})`}
          description="Parent and follow-up sessions in chronological order"
          actions={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              aria-expanded={showComments}
            >
              <MessageCircle size={14} strokeWidth={1.75} className="mr-1.5" />
              {showComments ? 'Hide' : 'Show'}
              {showComments ? <ChevronUp size={14} strokeWidth={1.75} className="ml-1.5" /> : <ChevronDown size={14} strokeWidth={1.75} className="ml-1.5" />}
            </Button>
          }
        >
          {showComments ? (
            <div className="grid grid-cols-1 gap-2 p-3 md:grid-cols-2">
              {visibleSessions.map((session, index) => (
                <div
                  key={session._id}
                  className="rounded-lg border border-rs-border bg-rs-surface p-3"
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-rs-primary-tint">
                        <User size={14} strokeWidth={1.75} className="text-rs-primary" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-rs-text">
                          {session.user.anonymousName}
                          {index === 0 && <span className="ml-1 text-[11px] font-normal text-rs-text-muted">· Parent</span>}
                        </p>
                        <p className="text-[11px] tabular-nums text-rs-text-muted">
                          {new Date(session.time).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })} at {new Date(session.time).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <StatusBadge tone={statusToneFrom(session.status)}>
                      {session.status}
                    </StatusBadge>
                  </div>

                  <p className="line-clamp-3 rounded-md bg-rs-page px-2.5 py-1.5 text-[13px] leading-relaxed text-rs-text-secondary">
                    {session.comment || 'No comment'}
                  </p>
                </div>
              ))}

              {hasMoreSessions && (
                <div className="flex justify-center pt-1">
                  <Button onClick={handleLoadMore} variant="outline" size="sm">
                    Load More
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <EmptyState title="Thread hidden" description="Toggle Show to view the session thread." />
          )}
        </TableCard>
      )}
    </div>
  );
};

/* ------------------------------------------------- */
interface CardProps {
  session: SessionTreeNode;
  title: string;
  onSave: () => void;
}

const SessionCardWithNotes: React.FC<CardProps> = ({ session, title, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [comment, setComment] = useState(session.comment ?? '');
  const [saving, setSaving] = useState(false);

  const canEdit = session.status !== 'pending';

  const handleSave = async () => {
    setSaving(true);
    try {
      await addSessionComment(session._id, { comment });
      toast.success('Note saved!');
      setEditing(false);
      onSave();
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) =>
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success('Copied!'))
      .catch(() => toast.error('Copy failed'));

  const reflections = session.reflectData?.userReflectionData ?? [];

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0 space-y-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {new Date(session.time).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
            {' · '}
            {new Date(session.time).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </CardDescription>
        </div>
        <StatusBadge tone={statusToneFrom(session.status)}>{session.status}</StatusBadge>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        {/* Compact meta strip — 4 cells, no dead whitespace */}
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-rs-border bg-rs-border lg:grid-cols-4">
          <MetaCell icon={<User size={14} strokeWidth={1.75} />} label="User" value={session.user.anonymousName} />
          <MetaCell
            icon={<Calendar size={14} strokeWidth={1.75} />}
            label="Date"
            value={new Date(session.time).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            tabular
          />
          <MetaCell
            icon={<Clock size={14} strokeWidth={1.75} />}
            label="Time"
            value={new Date(session.time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            tabular
          />
          <div className="bg-rs-surface px-3 py-2.5">
            <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-rs-text-muted">
              <Tag size={14} strokeWidth={1.75} /> Topic
            </dt>
            <dd className="mt-1">
              <Badge variant="secondary" className="font-normal">{session.topic}</Badge>
            </dd>
          </div>
        </dl>

        {/* Notes + side panel — fills width instead of stacking full-width rows */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
          <div className="rounded-lg border border-rs-border bg-rs-surface px-3 py-2.5 lg:col-span-3">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-rs-text-muted">
              <MessageSquare size={14} strokeWidth={1.75} /> Notes
            </p>
            {editing ? (
              <div className="mt-1.5 space-y-2">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-rs-border bg-rs-surface p-2 text-sm text-rs-text outline-none rs-focus-ring"
                  placeholder="Add a note…"
                />
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving…' : 'Save'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                <p className="min-w-0 flex-1 text-sm leading-relaxed text-rs-text-secondary">
                  {session.comment || 'No note yet.'}
                </p>
                {canEdit && (
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="shrink-0">
                    Edit Note
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3 lg:col-span-2">
            {session.meetingLink ? (
              <div className="rounded-lg border border-rs-border bg-rs-surface px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-rs-text-muted">
                  <Link2 size={14} strokeWidth={1.75} /> Meeting Link
                </p>
                <button
                  onClick={() => copyToClipboard(session.meetingLink!)}
                  className="mt-1 block max-w-full truncate text-left text-sm text-rs-blue hover:underline"
                >
                  {session.meetingLink}
                </button>
              </div>
            ) : null}
            {reflections.length > 0 ? (
              <div className="rounded-lg border border-rs-border bg-rs-surface px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-rs-text-muted">
                  <MessageSquare size={14} strokeWidth={1.75} /> Reflection
                </p>
                <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-rs-text-secondary">
                  {reflections.map((r, i) => (
                    <li key={i}>
                      <strong className="font-medium text-rs-text">{r.question}</strong>: {r.answer}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-rs-border px-3 py-2.5 text-xs text-rs-text-muted">
                No reflection submitted for this session.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MetaCell: React.FC<{ icon: React.ReactNode; label: string; value: string; tabular?: boolean }> = ({
  icon,
  label,
  value,
  tabular,
}) => (
  <div className="bg-rs-surface px-3 py-2.5">
    <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-rs-text-muted">
      <span className="shrink-0">{icon}</span> {label}
    </dt>
    <dd className={`mt-1 truncate text-sm font-medium text-rs-text ${tabular ? 'tabular-nums' : ''}`} title={value}>
      {value}
    </dd>
  </div>
);

const InfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  full?: boolean;
}> = ({ icon, label, children, full = false }) => (
  <div className={`flex items-start gap-2.5 ${full ? 'col-span-1 md:col-span-2' : ''}`}>
    <span className="mt-0.5 shrink-0 text-rs-text-muted">{icon}</span>
    <div className="min-w-0 flex-1">
      <span className="block text-[11px] font-medium uppercase tracking-wide text-rs-text-muted">{label}</span>
      <div className="mt-0.5">{children}</div>
    </div>
  </div>
);

const SkeletonLoader = () => (
  <div className="space-y-3">
    <Skeleton className="h-10 w-full rounded-xl" />
    <Skeleton className="h-40 w-full rounded-xl" />
  </div>
);

const ErrorState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex h-64 flex-col items-center justify-center px-4 text-center">
    <AlertTriangle size={32} strokeWidth={1.75} className="mb-3 text-rs-primary" />
    <h2 className="text-sm font-medium text-rs-text">Something Went Wrong</h2>
    <p className="mb-4 mt-1 max-w-md text-sm text-rs-text-muted">{message}</p>
    <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
      Retry
    </Button>
  </div>
);
