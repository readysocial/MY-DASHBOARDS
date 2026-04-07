import { API_ENDPOINTS } from '@/config/api';
import {
  getListenerToken,
  handleListenerUnauthorized,
  redirectToListenerLogin,
} from '@/utils/listenerAuth';
import type { ListenerProfileResponse } from './types';

export const getListenerProfile = async (listenerId: string): Promise<ListenerProfileResponse> => {
  const token = getListenerToken();
  if (!token) {
    redirectToListenerLogin('invalid');
    throw new Error('Authentication required');
  }

  const response = await fetch(API_ENDPOINTS.listeners.profile(listenerId), {
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
    throw new Error(error.message || 'Failed to fetch listener profile');
  }

  const result = await response.json();
  return result;
};
