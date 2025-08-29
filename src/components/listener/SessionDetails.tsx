// src/components/listener/SessionDetails.tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getFullSessionTree } from '@/api/listener/session-tree/api';
import { addSessionComment } from '@/api/listener/comment/api';
import type { FullSessionTreeResponse, SessionTreeNode } from '@/api/listener/session-tree/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Tag,
  Repeat,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Link2,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

export const SessionDetails: React.FC = () => {
  const router = useRouter();
  const { sessionId } = router.query;

  const [data, setData] = useState<FullSessionTreeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChildren, setShowChildren] = useState(true);

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

  useEffect(() => { fetchTree(); }, [sessionId]);

  if (loading) return <SkeletonLoader />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  const { parent, children } = data;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <Link href="/listener/sessions">
        <Button variant="outline" size="sm" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Sessions
        </Button>
      </Link>

      <h1 className="text-4xl font-extrabold mb-8 text-gray-800 border-b pb-2 border-gray-200">
        Session Details
      </h1>

      <SessionCardWithNotes session={parent} title="Parent Session" onSave={fetchTree} />

      {children.length > 0 && (
        <section className="mt-10">
          <Button
            variant="ghost"
            onClick={() => setShowChildren(!showChildren)}
            className="flex items-center gap-2 text-lg font-semibold mb-4"
          >
            <Repeat className="h-5 w-5" /> Repeat Sessions ({children.length})
            {showChildren ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>

          {showChildren && (
            <div className="space-y-6">
              {children.map((child) => (
                <SessionCardWithNotes key={child._id} session={child} title="Repeat Session" onSave={fetchTree} />
              ))}
            </div>
          )}
        </section>
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
      toast({ description: 'Note saved!' });
      setEditing(false);
      onSave();
    } catch (e: any) {
      toast({ description: e.message || 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) =>
    navigator.clipboard
      .writeText(text)
      .then(() => toast({ description: 'Copied!' }))
      .catch(() => toast({ description: 'Copy failed', variant: 'destructive' }));

  return (
    <div className="border rounded-xl p-6 shadow-sm bg-white">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        <StatusBadge status={session.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
        <InfoRow icon={<User />} label="User">
          <span className="text-gray-700">{session.user.anonymousName}</span>
        </InfoRow>

        <InfoRow icon={<Calendar />} label="Date">
          <span className="text-gray-700">
            {new Date(session.time).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </InfoRow>

        <InfoRow icon={<Clock />} label="Time">
          <span className="text-gray-700">
            {new Date(session.time).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </InfoRow>

        <InfoRow icon={<Tag />} label="Topic">
          <Badge variant="secondary" className="font-normal px-2 py-1">{session.topic}</Badge>
        </InfoRow>

        {session.meetingLink && (
          <InfoRow icon={<Link2 />} label="Meeting Link">
            <button
              onClick={() => copyToClipboard(session.meetingLink!)}
              className="text-blue-600 hover:text-blue-800 underline truncate text-left max-w-xs"
            >
              {session.meetingLink}
            </button>
          </InfoRow>
        )}

        {/* HIGH-CONTRAST NOTES */}
        <InfoRow icon={<MessageSquare />} label="Notes" full>
          <div className="bg-gray-100 rounded-lg p-4 w-full">
            {editing ? (
              <div className="space-y-3">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 outline-none text-gray-900 text-base bg-white"
                  placeholder="Add a note…"
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(false)}
                    className="border-gray-400 text-gray-600 hover:bg-gray-200"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-gray-900 font-bold text-lg leading-relaxed">
                  {session.comment || 'No note yet.'}
                </p>
                {canEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(true)}
                    className="border-blue-500 text-blue-600 hover:bg-blue-50"
                  >
                    Edit Note
                  </Button>
                )}
              </div>
            )}
          </div>
        </InfoRow>

        {session.reflectData?.userReflectionData?.length && (
          <InfoRow icon={<MessageSquare />} label="Reflection" full>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              {session.reflectData.userReflectionData.map((r, i) => (
                <li key={i} className="text-sm">
                  <strong>{r.question}</strong>: {r.answer}
                </li>
              ))}
            </ul>
          </InfoRow>
        )}
      </div>
    </div>
  );
};

const InfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  full?: boolean;
}> = ({ icon, label, children, full = false }) => (
  <div className={`flex items-start gap-3 ${full ? 'col-span-1 md:col-span-2' : ''}`}>
    <span className="text-gray-500 mt-1">{icon}</span>
    <div>
      <span className="block text-gray-500 text-xs font-medium uppercase tracking-wide">{label}</span>
      {children}
    </div>
  </div>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const classes: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    successful: 'bg-green-100 text-green-800 border-green-200',
    unsuccessful: 'bg-red-100 text-red-800 border-red-200',
    cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  const display = {
    pending: 'Pending',
    successful: 'Successful',
    unsuccessful: 'Unsuccessful',
    cancelled: 'Cancelled',
  }[status] || 'Unknown';
  return (
    <Badge className={`${classes[status] || 'bg-gray-100 text-gray-800'} capitalize border px-2 py-1 text-xs`}>
      {display}
    </Badge>
  );
};

const SkeletonLoader = () => (
  <div className="p-6 max-w-5xl mx-auto space-y-6">
    <Skeleton className="h-10 w-40" />
    <Skeleton className="h-40 w-full rounded-xl" />
    <Skeleton className="h-10 w-48" />
    <Skeleton className="h-40 w-full rounded-xl" />
  </div>
);

const ErrorState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-64 text-center px-4">
    <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
    <h2 className="text-xl font-semibold text-gray-800 mb-2">Something Went Wrong</h2>
    <p className="text-gray-600 mb-4 max-w-md">{message}</p>
    <Button variant="outline" onClick={() => window.location.reload()}>
      Retry
    </Button>
  </div>
);