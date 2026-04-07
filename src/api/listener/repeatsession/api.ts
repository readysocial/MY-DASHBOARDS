import { API_ENDPOINTS } from '@/config/api';
import {
  getListenerToken,
  handleListenerUnauthorized,
  redirectToListenerLogin,
} from '@/utils/listenerAuth';
import type { RelatedSessionsResponse, GetRelatedSessionsParams } from './types';

export const getRelatedSessions = async ({
  sessionId,
}: GetRelatedSessionsParams): Promise<RelatedSessionsResponse> => {
  const token = getListenerToken();
  if (!token) {
    redirectToListenerLogin('invalid');
    throw new Error('Authentication required');
  }

  try {
    const response = await fetch(
      `${API_ENDPOINTS.sessions.getRelatedSessions(sessionId)}?skip=0&limit=50`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (handleListenerUnauthorized(response)) {
      throw new Error('Authentication required');
    }

    if (response.status === 404) {
      throw new Error('Session not found');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch related sessions');
    }

    const data = await response.json();

    // Assuming the backend returns an array of sessions
    // We'll sort them by time ascending to form a timeline/thread
    const sortedSessions = data.data.sort(
      (a: any, b: any) =>
        new Date(a.time).getTime() - new Date(b.time).getTime()
    );

    // Identify base session (the one with matching repeatSessionId)
    const baseSession = sortedSessions.find(
      (s: any) => s._id === sessionId
    );

    // Remaining are related sessions
    const relatedSessions = sortedSessions.filter(
      (s: any) => s._id !== sessionId
    );

    return {
      baseSession,
      relatedSessions,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch related sessions');
  }
};