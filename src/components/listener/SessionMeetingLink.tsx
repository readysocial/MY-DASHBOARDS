import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Video, Link as LinkIcon, Check, X, Pencil } from 'lucide-react';
import { addMeetingLink } from '@/api/admin/sessions/api';
import { cn } from '@/lib/utils';

interface SessionMeetingLinkProps {
  sessionId: string;
  initialMeetingLink?: string;
  onLinkAdded: (newLink: string) => void;
  isEditable: boolean;
}

export const SessionMeetingLink: React.FC<SessionMeetingLinkProps> = ({
  sessionId,
  initialMeetingLink,
  onLinkAdded,
  isEditable,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [meetingLink, setMeetingLink] = useState(initialMeetingLink || '');
  const [tempLink, setTempLink] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!tempLink.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await addMeetingLink(sessionId, { meetingLink: tempLink });
      const updatedLink = result.session.meetingLink || '';
      setMeetingLink(updatedLink);
      onLinkAdded(updatedLink);
      setIsEditing(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to add meeting link'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isEditable) {
    return meetingLink ? (
      <a
        href={meetingLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-rs-blue hover:underline"
      >
        <Video className="h-3.5 w-3.5" />
        Join
      </a>
    ) : (
      <span className="text-xs text-rs-text-muted">—</span>
    );
  }

  if (isEditing) {
    return (
      <div className="flex min-w-[12rem] flex-col gap-1">
        <div className="flex items-center gap-1">
          <Input
            type="url"
            placeholder="https://…"
            value={tempLink}
            onChange={(e) => setTempLink(e.target.value)}
            className="h-8 flex-1 text-xs"
            disabled={isLoading}
          />
          <Button
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleSave}
            disabled={!tempLink.trim() || isLoading}
            aria-label="Save meeting link"
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            onClick={() => {
              setIsEditing(false);
              setTempLink('');
              setError(null);
            }}
            disabled={isLoading}
            aria-label="Cancel"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        {error ? (
          <span className="text-[11px] text-rs-primary">{error}</span>
        ) : null}
      </div>
    );
  }

  if (meetingLink) {
    return (
      <div className="flex items-center gap-0.5">
        <a
          href={meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs',
            'text-rs-blue hover:bg-rs-blue-tint'
          )}
        >
          <Video className="h-3.5 w-3.5" />
          Join
        </a>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-rs-text-muted"
          onClick={() => {
            setTempLink(meetingLink);
            setIsEditing(true);
          }}
          aria-label="Edit meeting link"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-8 px-2 text-xs text-rs-text-secondary"
      onClick={() => setIsEditing(true)}
    >
      <LinkIcon className="mr-1.5 h-3.5 w-3.5" />
      Add link
    </Button>
  );
};
