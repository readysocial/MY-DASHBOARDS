import { API_ENDPOINTS } from '@/config/api';
import type { RecommendRepeatResponse } from './types';

export const recommendSessionRepeat = async (
  sessionId: string
): Promise<RecommendRepeatResponse> => {
  const token = localStorage.getItem('listenerToken');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(API_ENDPOINTS.sessions.recommendRepeat(sessionId), {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to recommend session repeat');
  }

  return response.json();
}; 