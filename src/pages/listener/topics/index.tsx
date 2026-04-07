import React, { useEffect, useState } from 'react';
import { ListenerLayout } from '@/components/listener/ListenerLayout';
import { ListenerTopicsSelector } from '@/components/listener/ListenerTopicsSelector';
import { ListenerTopicsManager } from '@/components/listener/ListenerTopicsManager';
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
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Your Topics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Select topics you're interested in and manage your current assignments.
          </p>
        </div>

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
          <div className="text-gray-500">Loading...</div>
        )}
      </div>
    </ListenerLayout>
  );
};

export default TopicsPage; 