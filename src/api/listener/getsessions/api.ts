import { API_ENDPOINTS } from '@/config/api';
import type { GetListenerSessionsResponse, AddMeetingLinkResponse, AddMeetingLinkRequest } from './types';

export const getListenerSessions = async (listenerId: string): Promise<GetListenerSessionsResponse> => {
  const token = localStorage.getItem('listenerToken');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(API_ENDPOINTS.sessions.getListenerSessions(listenerId), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch listener sessions');
  }

  return response.json();
}; 

export const addMeetingLink = async (sessionId: string, data: AddMeetingLinkRequest): Promise<AddMeetingLinkResponse> => {
  const token = localStorage.getItem('listenerToken');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(API_ENDPOINTS.sessions.addMeetingLink(sessionId), {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add meeting link');
  }

  return response.json();
};