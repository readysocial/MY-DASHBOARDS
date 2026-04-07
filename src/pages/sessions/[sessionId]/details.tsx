import React from 'react';
import { ListenerLayout } from '@/components/listener/ListenerLayout'; // named import
import { SessionDetails } from '@/components/listener/SessionDetails';

export default function ListenerSessionDetailsPage() {
  return (
    <ListenerLayout>
      <SessionDetails />
    </ListenerLayout>
  );
}