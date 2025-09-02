import { API_ENDPOINTS } from '@/config/api';
import type { UpdateTopicsRequest, UpdateTopicsResponse } from './types';

export const updateListenerTopics = async (
  listenerId: string,
  topics: string[]
): Promise<UpdateTopicsResponse> => {
  const token = localStorage.getItem('listenerToken');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(API_ENDPOINTS.listeners.updateTopics(listenerId), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ topics }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update listener topics');
  }

  return response.json();
};