import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ListenerLayout } from '@/components/listener/ListenerLayout';
import { ListenerSessions } from '@/components/listener/ListenerSessions';
import { PageHeader } from '@/components/ui/page-header';

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
        <PageHeader
          title="Your Sessions"
          description="View and manage your sessions"
        />

        {listenerId ? (
          <ListenerSessions listenerId={listenerId} />
        ) : (
          <div className="text-sm text-rs-text-muted">Loading...</div>
        )}
      </div>
    </ListenerLayout>
  );
};

export default SessionsPage; 