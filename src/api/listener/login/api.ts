import { API_ENDPOINTS } from '@/config/api';
import type { LoginRequest, LoginResponse } from './types';

export const loginListener = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await fetch(API_ENDPOINTS.listeners.login, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to login');
  }

  const result = await response.json();
  return result;
}; 