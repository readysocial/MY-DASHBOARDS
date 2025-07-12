import { API_ENDPOINTS } from '@/config/api';
import type { AddCommentRequest, AddCommentResponse } from './types';

export const addSessionComment = async (
  sessionId: string,
  data: AddCommentRequest
): Promise<AddCommentResponse> => {
  const token = localStorage.getItem('listenerToken');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(API_ENDPOINTS.sessions.addComment(sessionId), {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to add comment');
  }

  return response.json();
}; 