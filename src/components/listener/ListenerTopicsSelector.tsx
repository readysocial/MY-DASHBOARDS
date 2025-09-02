import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tag, Check } from 'lucide-react';
import { getTopics } from '@/api/listener/generaltopics/api';
import { updateListenerTopics } from '@/api/listener/choosetopics/api';
import type { Topic } from '@/api/listener/generaltopics/types';

interface ListenerTopicsSelectorProps {
  listenerId: string;
  onUpdateSuccess?: () => void;
}

export const ListenerTopicsSelector = ({ listenerId, onUpdateSuccess }: ListenerTopicsSelectorProps) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await getTopics();
        setTopics(response.topics);
      } catch (error) {
        setError('Failed to fetch topics');
        console.error('Failed to fetch topics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopics();
  }, []);

  const handleTopicClick = (topicId: string) => {
    setSelectedTopics(prev => {
      if (prev.includes(topicId)) {
        return prev.filter(id => id !== topicId);
      } else {
        return [...prev, topicId];
      }
    });
    // Clear any existing messages when making new selections
    setSuccessMessage(null);
    setError(null);
  };

  const handleSave = async () => {
    if (selectedTopics.length === 0) {
      setError('Please select at least one topic');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await updateListenerTopics(listenerId, selectedTopics);
      setSuccessMessage('Topics updated successfully!');
      onUpdateSuccess?.();
    } catch (error) {
      setError('Failed to update topics');
      console.error('Failed to update topics:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-gray-500">Loading topics...</div>;
  }

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Choose Your Topics</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Select the topics you'd like to listen to</p>
        </div>
        <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
      </div>

      {error && (
        <div className="mb-4 p-2 sm:p-3 bg-red-50 text-xs sm:text-sm text-red-600 rounded-md">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-2 sm:p-3 bg-green-50 text-xs sm:text-sm text-green-600 rounded-md flex items-center gap-2">
          <Check className="h-3 w-3 sm:h-4 sm:w-4" />
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {topics.map((topic) => (
          <div
            key={topic._id}
            onClick={() => handleTopicClick(topic._id)}
            className={`
              flex items-center p-3 sm:p-4 rounded-lg cursor-pointer transition-all
              ${selectedTopics.includes(topic._id)
                ? 'bg-purple-100 border-2 border-purple-500 shadow-sm'
                : 'bg-gray-50 border-2 border-transparent hover:border-purple-200 hover:shadow-sm'
              }
            `}
          >
            <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
              <div className={`
                h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center relative
                ${selectedTopics.includes(topic._id) ? 'bg-purple-200' : 'bg-purple-100'}
              `}>
                <Tag className={`
                  h-4 w-4 sm:h-5 sm:w-5
                  ${selectedTopics.includes(topic._id) ? 'text-purple-700' : 'text-purple-600'}
                `} />
                {selectedTopics.includes(topic._id) && (
                  <div className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 bg-purple-500 rounded-full flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-medium text-gray-900 capitalize">{topic.topic}</h3>
                <p className="text-xs sm:text-sm text-gray-500">
                  {topic.count} sessions
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs sm:text-sm text-gray-500">
          {selectedTopics.length} topic{selectedTopics.length !== 1 ? 's' : ''} selected
        </p>
        <Button
          onClick={handleSave}
          disabled={isSaving || selectedTopics.length === 0}
          size="sm"
          className={`
            ${selectedTopics.length > 0 ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-300'}
            text-white flex items-center gap-2 text-xs sm:text-sm py-1.5 sm:py-2
          `}
        >
          {isSaving ? 'Saving...' : 'Save Topics'}
          {!isSaving && selectedTopics.length > 0 && <Check className="h-3 w-3 sm:h-4 sm:w-4" />}
        </Button>
      </div>
    </Card>
  );
}; 