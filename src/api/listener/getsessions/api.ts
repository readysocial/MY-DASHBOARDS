import { API_ENDPOINTS } from '@/config/api';
import type { 
  GetListenerSessionsResponse, 
  Session 
} from './types';

export const getListenerSessions = async (): Promise<GetListenerSessionsResponse> => {
  const token = localStorage.getItem('listenerToken');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(API_ENDPOINTS.sessions.getListenerSessions, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      // Clear token if unauthorized
      localStorage.removeItem('listenerToken');
      throw new Error('Unauthorized access - please log in again');
    }

    if (response.status === 404) {
      throw new Error('Listener not found');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch listener sessions');
    }

    const data = await response.json();
    
    // Validate the response structure
    if (!data || !Array.isArray(data.sessions)) {
      throw new Error('Invalid response format from server');
    }
    
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch listener sessions');
  }
};

// Helper function to get repeat status
export const getRepeatStatus = (session: Session) => {
  if (!session.repeats) return null;
  
  if (session.repeats.pendingAcceptance) {
    return 'pending';
  }
  
  if (session.repeats.count > 0) {
    return 'accepted';
  }
  
  return null;
};

// Helper function to check if session is a repeat
export const isRepeatSession = (session: Session) => {
  return !!session.repeatSessionId;
};

// Helper function to check if session is a parent session
export const isParentSession = (session: Session) => {
  return session.repeats && session.repeats.count > 0;
};