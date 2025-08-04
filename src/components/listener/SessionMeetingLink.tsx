import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Video, Link as LinkIcon, Check, X } from 'lucide-react';
import { addMeetingLink } from '@/api/admin/sessions/api'; // <-- admin endpoint

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
      setError(err instanceof Error ? err.message : 'Failed to add meeting link');
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------- READ-ONLY ---------- */
  if (!isEditable)
    return meetingLink ? (
      <div className="flex items-center gap-1 sm:gap-2 text-gray-600">
        <Video className="h-3 w-3 sm:h-4 sm:w-4" />
        <a
          href={meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs sm:text-sm text-purple-600 hover:text-purple-800 underline"
        >
          Join Meeting
        </a>
      </div>
    ) : null;

  /* ---------- EDIT MODE ---------- */
  return (
    <div className="mt-3 sm:mt-4 space-y-2">
      {isEditing ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
          <Input
  type="url"
  placeholder="https://meet.google.com/abc-defg-hjk"
  value={tempLink}
  onChange={(e) => setTempLink(e.target.value)}
  className="flex-1 text-xs sm:text-sm font-medium text-gray-900 placeholder-gray-500 py-1.5 sm:py-2"
  disabled={isLoading}

            />
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!tempLink.trim() || isLoading}
              className="bg-green-600 hover:bg-green-700 py-1.5 sm:py-2"
            >
              <Check className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setTempLink('');
                setError(null);
              }}
              disabled={isLoading}
              className="py-1.5 sm:py-2"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
          {error && <p className="text-xs sm:text-sm text-red-600">{error}</p>}
        </div>
      ) : meetingLink ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2">
        <Video className="h-3 w-3 sm:h-4 sm:w-4 text-purple-700" />
                  <a
                    href={meetingLink}
                target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm font-bold text-purple-700 hover:text-purple-900 underline"
                 >
                 Join Meeting
  </a>
</div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setTempLink(meetingLink);
              setIsEditing(true);
            }}
            className="text-xs sm:text-sm font-bold text-gray-900 py-1.5 sm:py-2"
          >
            Edit Link
          </Button>
        </div>
      ) : (
        <Button
        size="sm"
        variant="outline"
        onClick={() => setIsEditing(true)}
        className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-bold text-gray-800 py-1.5 sm:py-2"
      >
        <LinkIcon className="h-3 w-3 sm:h-4 sm:w-4" />
        Add Meeting Link
      </Button>
      )}
    </div>
  );
};