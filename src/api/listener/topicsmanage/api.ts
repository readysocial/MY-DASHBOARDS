import { API_ENDPOINTS } from '@/config/api';
import {
  getListenerToken,
  handleListenerUnauthorized,
  redirectToListenerLogin,
} from '@/utils/listenerAuth';
import type {
  GetListenerTopicsResponse,
  DeleteTopicsRequest,
  DeleteTopicsResponse
} from './types';

export const getListenerTopics = async (listenerId: string): Promise<GetListenerTopicsResponse> => {
  const token = getListenerToken();
  if (!token) {
    redirectToListenerLogin('invalid');
    throw new Error('Authentication required');
  }

  const response = await fetch(API_ENDPOINTS.listeners.getListenerTopics(listenerId), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (handleListenerUnauthorized(response)) {
    throw new Error('Authentication required');
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch listener topics');
  }

  return response.json();
};

export const deleteListenerTopics = async (
  listenerId: string,
  topics: string[]
): Promise<DeleteTopicsResponse> => {
  const token = getListenerToken();
  if (!token) {
    redirectToListenerLogin('invalid');
    throw new Error('Authentication required');
  }

  const response = await fetch(API_ENDPOINTS.listeners.deleteListenerTopics(listenerId), {
    method: 'DELETE',
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
    throw new Error(error.message || 'Failed to delete listener topics');
  }

  return response.json();
};
