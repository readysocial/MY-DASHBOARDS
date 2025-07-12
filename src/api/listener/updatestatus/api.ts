import { API_ENDPOINTS } from '@/config/api';
import type { UpdateStatusRequest, UpdateStatusResponse } from './types';

export const updateSessionStatus = async (
  sessionId: string,
  data: UpdateStatusRequest
): Promise<UpdateStatusResponse> => {
  const token = localStorage.getItem('listenerToken');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(API_ENDPOINTS.sessions.updateStatus(sessionId), {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update session status');
  }

  return response.json();
}; 