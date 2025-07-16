import { API_ENDPOINTS } from '@/config/api';
import type { RelatedSessionsResponse, GetRelatedSessionsParams } from './types';

export const getRelatedSessions = async ({ sessionId }: GetRelatedSessionsParams): Promise<RelatedSessionsResponse> => {
  const token = localStorage.getItem('listenerToken');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(API_ENDPOINTS.sessions.getRelatedSessions(sessionId), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      throw new Error('Unauthorized access');
    }

    if (response.status === 404) {
      throw new Error('Session not found');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch related sessions');
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch related sessions');
  }
}; 