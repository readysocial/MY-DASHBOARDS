import { API_ENDPOINTS } from '@/config/api';
import {
  getListenerToken,
  handleListenerUnauthorized,
  redirectToListenerLogin,
} from '@/utils/listenerAuth';
import type { RecommendRepeatResponse } from './types';

export const recommendSessionRepeat = async (
  sessionId: string
): Promise<RecommendRepeatResponse> => {
  const token = getListenerToken();
  if (!token) {
    redirectToListenerLogin('invalid');
    throw new Error('Authentication required');
  }

  const response = await fetch(API_ENDPOINTS.sessions.recommendRepeat(sessionId), {
    method: 'PATCH',
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
    throw new Error(error.message || 'Failed to recommend session repeat');
  }

  return response.json();
};
