import React, { useState, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Save } from 'lucide-react';
import { addSessionComment } from '@/api/listener/comment/api';

interface SessionCommentProps {
  sessionId: string;
  onCommentAdded: () => void;
  isEditable: boolean;
}

export const SessionComment: React.FC<SessionCommentProps> = ({
  sessionId,
  onCommentAdded,
  isEditable
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddComment = async () => {
    if (!comment.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      await addSessionComment(sessionId, { comment: comment.trim() });
      onCommentAdded();
      setIsEditing(false);
      setComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isEditable) {
    return null;
  }

  return (
    <div className="mt-3 sm:mt-4 space-y-2">
      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            placeholder="Add your session notes here..."
            value={comment}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
            className="min-h-[100px] text-xs sm:text-sm"
            disabled={isLoading}
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleAddComment}
              disabled={!comment.trim() || isLoading}
              className="bg-purple-600 hover:bg-purple-700 text-xs sm:text-sm py-1.5 sm:py-2"
            >
              <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Save Comment
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setComment('');
                setError(null);
              }}
              disabled={isLoading}
              className="text-xs sm:text-sm py-1.5 sm:py-2"
            >
              Cancel
            </Button>
          </div>
          {error && <p className="text-xs sm:text-sm text-red-600">{error}</p>}
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-1.5 sm:py-2"
          onClick={() => setIsEditing(true)}
        >
          <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
          Add Session Notes
        </Button>
      )}
    </div>
  );
}; 