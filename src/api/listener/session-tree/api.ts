import { API_ENDPOINTS } from '@/config/api';
import type { FullSessionTreeResponse } from './types';

export const getFullSessionTree = async (
  sessionId: string,
  token: string
): Promise<FullSessionTreeResponse> => {
  const endpoint = API_ENDPOINTS.sessions.fullTree(sessionId);

  const res = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    let errorMessage = 'Failed to fetch session tree';
    try {
      const error = await res.json();
      errorMessage = error.message || errorMessage;
    } catch (e) {
      // fallback
    }
    throw new Error(errorMessage);
  }

  return res.json();
};