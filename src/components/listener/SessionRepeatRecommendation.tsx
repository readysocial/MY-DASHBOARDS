import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Repeat } from 'lucide-react';
import { recommendSessionRepeat } from '@/api/listener/recommendrepeat/api';
import type { SessionStatus } from '@/api/listener/updatestatus/types';

interface SessionRepeatRecommendationProps {
  sessionId: string;
  status: SessionStatus;
  onRecommendationMade: () => void;
}

export const SessionRepeatRecommendation: React.FC<SessionRepeatRecommendationProps> = ({
  sessionId,
  status,
  onRecommendationMade
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecommended, setIsRecommended] = useState(false);

  const handleRecommendRepeat = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await recommendSessionRepeat(sessionId);
      setIsRecommended(true);
      onRecommendationMade();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to recommend repeat');
    } finally {
      setIsLoading(false);
    }
  };

  // Only show for successful sessions
  if (status !== 'successful') {
    return null;
  }

  return (
    <div>
      {isRecommended ? (
        <div className="flex items-center gap-1.5 text-xs text-rs-success">
          <Repeat size={14} strokeWidth={1.75} />
          <span>Recommended</span>
        </div>
      ) : (
        <div>
          <Button
            size="sm"
            variant="ghost"
            className="whitespace-nowrap"
            onClick={handleRecommendRepeat}
            disabled={isLoading}
          >
            <Repeat size={14} strokeWidth={1.75} className="mr-1.5" />
            {isLoading ? 'Saving…' : 'Repeat'}
          </Button>
          {error && <p className="mt-1 text-xs text-rs-primary">{error}</p>}
        </div>
      )}
    </div>
  );
};