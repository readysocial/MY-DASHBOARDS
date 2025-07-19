import { API_ENDPOINTS } from '@/config/api';
import type { GetListenerSessionsResponse, AddMeetingLinkResponse, AddMeetingLinkRequest } from './types';

export const getListenerSessions = async (listenerId: string): Promise<GetListenerSessionsResponse> => {
  const token = localStorage.getItem('listenerToken');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(API_ENDPOINTS.sessions.getListenerSessions(listenerId), {
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
      throw new Error('Listener not found');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch listener sessions');
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch listener sessions');
  }
}; 

export const addMeetingLink = async (sessionId: string, data: AddMeetingLinkRequest): Promise<AddMeetingLinkResponse> => {
  const token = localStorage.getItem('listenerToken');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(API_ENDPOINTS.sessions.addMeetingLink(sessionId), {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.status === 401) {
      throw new Error('Unauthorized access');
    }

    if (response.status === 404) {
      throw new Error('Session not found');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add meeting link');
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to add meeting link');
  }
};