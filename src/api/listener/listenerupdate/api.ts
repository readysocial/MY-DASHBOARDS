import { API_ENDPOINTS } from '@/config/api';
import {
  getListenerToken,
  handleListenerUnauthorized,
  redirectToListenerLogin,
} from '@/utils/listenerAuth';
import type { UpdateListenerRequest, UpdateListenerResponse } from './types';

export const updateListenerProfile = async (
  listenerId: string,
  data: UpdateListenerRequest
): Promise<UpdateListenerResponse> => {
  const token = getListenerToken();
  if (!token) {
    redirectToListenerLogin('invalid');
    throw new Error('Authentication required');
  }

  const response = await fetch(API_ENDPOINTS.listeners.updateProfile(listenerId), {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (handleListenerUnauthorized(response)) {
    throw new Error('Authentication required');
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update listener profile');
  }

  const result = await response.json();
  return result;
};
