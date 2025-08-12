// components/listener/sessions/SessionComment.tsx
import React, { useState, ChangeEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Save, Pencil, Loader2 } from 'lucide-react';
import { addSessionComment } from '@/api/listener/comment/api';

interface SessionCommentProps {
  sessionId: string;
  existingComment?: string;  // Add this prop to receive existing comment
  canEdit: boolean;          // Renamed from isEditable for clarity
  onCommentAdded: () => void;
}

export const SessionComment: React.FC<SessionCommentProps> = ({
  sessionId,
  existingComment,
  canEdit,
  onCommentAdded
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [comment, setComment] = useState(existingComment || '');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync comment state when existingComment changes (e.g., after update)
  useEffect(() => {
    if (!isEditing) {
      setComment(existingComment || '');
    }
  }, [existingComment]);

  const handleEditClick = () => {
    setIsEditing(true);
    setComment(existingComment || '');
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !canEdit) return;

    try {
      setIsLoading(true);
      setError(null);
      await addSessionComment(sessionId, { comment: comment.trim() });
      onCommentAdded();
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save comment');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render anything if there's no comment and we can't edit
  if (!existingComment && !canEdit) return null;

  return (
    <div className="mt-4 space-y-3">
      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            placeholder="Add your session notes here..."
            value={comment}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
            className="min-h-[100px] text-sm"
            disabled={isLoading}
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleAddComment}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Comment
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setComment(existingComment || '');
                setError(null);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {existingComment ? (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">{existingComment}</p>
              {canEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 text-xs text-gray-600 hover:text-gray-900"
                  onClick={handleEditClick}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit Comment
                </Button>
              )}
            </div>
          ) : (
            canEdit && (
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleEditClick}
              >
                <MessageSquare className="h-4 w-4" />
                Add Session Notes
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
};