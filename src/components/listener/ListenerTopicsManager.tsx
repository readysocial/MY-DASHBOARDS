import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tag, Check, X, Trash2 } from 'lucide-react';
import { getListenerTopics, deleteListenerTopics } from '@/api/listener/topicsmanage/api';
import type { GetListenerTopicsResponse } from '@/api/listener/topicsmanage/types';
import { confirm } from '@/lib/confirm';

interface ListenerTopicsManagerProps {
  listenerId: string;
  onUpdateSuccess?: () => void;
}

export const ListenerTopicsManager = ({ listenerId, onUpdateSuccess }: ListenerTopicsManagerProps) => {
  const [topics, setTopics] = useState<GetListenerTopicsResponse['topics']>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchTopics = async () => {
    try {
      const response = await getListenerTopics(listenerId);
      setTopics(response.topics);
      setError(null);
    } catch (error) {
      setError('Failed to fetch your topics');
      console.error('Failed to fetch topics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [listenerId]);

  const handleDeleteTopic = async (topicId: string) => {
    const confirmed = await confirm({
      title: 'Remove Topic',
      description: 'Are you sure you want to remove this topic from the listener?',
      confirmText: 'Remove',
    });
    if (!confirmed) return;

    setIsDeleting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await deleteListenerTopics(listenerId, [topicId]);
      setSuccessMessage('Topic removed successfully');
      // Refresh the topics list
      await fetchTopics();
      onUpdateSuccess?.();
    } catch (error) {
      setError('Failed to remove topic');
      console.error('Failed to delete topic:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="text-gray-500">Loading your topics...</div>;
  }

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Your Topics</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            These are the topics you're currently assigned to
          </p>
        </div>
        <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
      </div>

      {error && (
        <div className="mb-4 p-2 sm:p-3 bg-red-50 text-xs sm:text-sm text-red-600 rounded-md flex items-center gap-2">
          <X className="h-3 w-3 sm:h-4 sm:w-4" />
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-2 sm:p-3 bg-green-50 text-xs sm:text-sm text-green-600 rounded-md flex items-center gap-2">
          <Check className="h-3 w-3 sm:h-4 sm:w-4" />
          {successMessage}
        </div>
      )}

      {topics.length === 0 ? (
        <div className="text-center py-6 sm:py-8 text-gray-500">
          <p className="text-sm sm:text-base">You haven't been assigned any topics yet.</p>
          <p className="text-xs sm:text-sm mt-1">Visit the Topics page to select your interests.</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {topics.map((topicAssignment) => (
            <div
              key={topicAssignment._id}
              className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-medium text-gray-900 capitalize">
                    {topicAssignment.topic.topic}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {topicAssignment.topic.count} sessions available
                  </p>
                </div>
              </div>
              <Button
                onClick={() => handleDeleteTopic(topicAssignment.topic._id)}
                disabled={isDeleting}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1.5 sm:p-2"
              >
                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="sr-only">Remove topic</span>
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}; 