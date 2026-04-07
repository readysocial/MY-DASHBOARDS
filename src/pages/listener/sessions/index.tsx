import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ListenerLayout } from '@/components/listener/ListenerLayout';
import { ListenerSessions } from '@/components/listener/ListenerSessions';

const SessionsPage = () => {
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

  return (
    <ListenerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Sessions</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage your sessions
          </p>
        </div>

        {listenerId ? (
          <ListenerSessions listenerId={listenerId} />
        ) : (
          <div className="text-gray-500">Loading...</div>
        )}
      </div>
    </ListenerLayout>
  );
};

export default SessionsPage; 