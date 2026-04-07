import { API_ENDPOINTS } from '@/config/api';
import type { UpdateListenerRequest, UpdateListenerResponse } from './types';

export const updateListenerProfile = async (
  listenerId: string,
  data: UpdateListenerRequest
): Promise<UpdateListenerResponse> => {
  const token = localStorage.getItem('listenerToken');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(API_ENDPOINTS.listeners.updateProfile(listenerId), {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update listener profile');
  }

  const result = await response.json();
  return result;
}; 