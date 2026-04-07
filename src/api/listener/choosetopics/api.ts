import { API_ENDPOINTS } from '@/config/api';
import {
  getListenerToken,
  handleListenerUnauthorized,
  redirectToListenerLogin,
} from '@/utils/listenerAuth';
import type { UpdateTopicsRequest, UpdateTopicsResponse } from './types';

export const updateListenerTopics = async (
  listenerId: string,
  topics: string[]
): Promise<UpdateTopicsResponse> => {
  const token = getListenerToken();
  if (!token) {
    redirectToListenerLogin('invalid');
    throw new Error('Authentication required');
  }

  const response = await fetch(API_ENDPOINTS.listeners.updateTopics(listenerId), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ topics }),
  });

  if (handleListenerUnauthorized(response)) {
    throw new Error('Authentication required');
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update listener topics');
  }

  return response.json();
};