import React, { useEffect, useState } from 'react';
import { ListenerLayout } from '@/components/listener/ListenerLayout';
import { ListenerTopicsSelector } from '@/components/listener/ListenerTopicsSelector';
import { ListenerTopicsManager } from '@/components/listener/ListenerTopicsManager';
import { PageHeader } from '@/components/ui/page-header';
import { useRouter } from 'next/router';

const TopicsPage = () => {
  const [listenerId, setListenerId] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    // Get listener data from localStorage
    const listenerDataStr = localStorage.getItem('listenerData');
    const token = localStorage.getItem('listenerToken');

    if (!token || !listenerDataStr) {
      // Redirect to login if not authenticated
      router.push('/listener/login');
      return;
    }

    try {
      const listenerData = JSON.parse(listenerDataStr);
      if (listenerData._id) {
        setListenerId(listenerData._id);
      } else {
        console.error('No listener ID found in stored data');
        router.push('/listener/login');
      }
    } catch (error) {
      console.error('Error parsing listener data:', error);
      router.push('/listener/login');
    }
  }, [router]);

  const handleTopicsUpdate = () => {
    // This will be called after successful updates from either component
    console.log('Topics updated successfully');
  };

  return (
    <ListenerLayout>
      <div className="space-y-6">
        <PageHeader
          title="Manage Your Topics"
          description="Select topics you're interested in and manage your current assignments."
        />

        {listenerId && (
          <>
            {/* Current Topics */}
            <ListenerTopicsManager
              listenerId={listenerId}
              onUpdateSuccess={handleTopicsUpdate}
            />

            {/* Topic Selection */}
            <ListenerTopicsSelector
              listenerId={listenerId}
              onUpdateSuccess={handleTopicsUpdate}
            />
          </>
        )}

        {!listenerId && (
          <div className="text-sm text-rs-text-muted">Loading...</div>
        )}
      </div>
    </ListenerLayout>
  );
};

export default TopicsPage; 