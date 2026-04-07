import { API_ENDPOINTS } from '@/config/api';
import type { ListenerProfileResponse } from './types';

export const getListenerProfile = async (listenerId: string): Promise<ListenerProfileResponse> => {
  const token = localStorage.getItem('listenerToken');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(API_ENDPOINTS.listeners.profile(listenerId), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch listener profile');
  }

  const result = await response.json();
  return result;
}; 