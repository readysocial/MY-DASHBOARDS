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
    <div className="mt-3 sm:mt-4 space-y-2">
      {isRecommended ? (
        <div className="flex items-center gap-1 sm:gap-2 text-green-600">
          <Repeat className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="text-xs sm:text-sm">Repeat session recommended</span>
        </div>
      ) : (
        <div>
          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-1 sm:gap-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 text-xs sm:text-sm py-1.5 sm:py-2"
            onClick={handleRecommendRepeat}
            disabled={isLoading}
          >
            <Repeat className="h-3 w-3 sm:h-4 sm:w-4" />
            Recommend Repeat Session
          </Button>
          {error && <p className="text-xs sm:text-sm text-red-600 mt-1">{error}</p>}
        </div>
      )}
    </div>
  );
};