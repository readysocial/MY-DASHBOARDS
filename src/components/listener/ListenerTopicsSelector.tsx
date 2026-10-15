import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tag, Check } from 'lucide-react';
import { getTopics } from '@/api/listener/generaltopics/api';
import { updateListenerTopics } from '@/api/listener/choosetopics/api';
import type { Topic } from '@/api/listener/generaltopics/types';
import { InlineAlert } from '@/components/ui/inline-alert';
import { cn } from '@/lib/utils';

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
    return <div className="text-sm text-rs-text-muted">Loading topics...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0 space-y-1">
          <CardTitle>Choose Your Topics</CardTitle>
          <CardDescription>Select the topics you&apos;d like to listen to</CardDescription>
        </div>
        <Tag size={16} strokeWidth={1.75} className="shrink-0 text-rs-text-muted" />
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <InlineAlert variant="error" onDismiss={() => setError(null)}>
            {error}
          </InlineAlert>
        )}

        {successMessage && (
          <InlineAlert variant="success" onDismiss={() => setSuccessMessage(null)}>
            {successMessage}
          </InlineAlert>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => {
            const selected = selectedTopics.includes(topic._id);
            return (
              <button
                key={topic._id}
                type="button"
                onClick={() => handleTopicClick(topic._id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 text-left rs-transition",
                  selected
                    ? "border-rs-primary bg-rs-primary-tint"
                    : "border-rs-border bg-rs-surface hover:bg-rs-page",
                )}
              >
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-rs-primary-tint">
                  <Tag size={16} strokeWidth={1.75} className="text-rs-primary" />
                  {selected && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rs-primary">
                      <Check size={10} strokeWidth={2.5} className="text-white" />
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium capitalize text-rs-text">{topic.topic}</span>
                  <span className="block text-xs tabular-nums text-rs-text-muted">
                    {topic.count} sessions
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-rs-border pt-3">
          <p className="text-xs tabular-nums text-rs-text-muted">
            {selectedTopics.length} topic{selectedTopics.length !== 1 ? 's' : ''} selected
          </p>
          <Button
            onClick={handleSave}
            disabled={isSaving || selectedTopics.length === 0}
            size="sm"
          >
            {isSaving ? 'Saving...' : 'Save Topics'}
            {!isSaving && selectedTopics.length > 0 && <Check size={14} strokeWidth={2} className="ml-1.5" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
