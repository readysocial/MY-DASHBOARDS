import { API_ENDPOINTS } from '@/config/api';
import { ValidateResetTokenRequest, ValidateResetTokenResponse } from './types';

export const validateResetToken = async (data: ValidateResetTokenRequest): Promise<ValidateResetTokenResponse> => {
  try {
    const response = await fetch(API_ENDPOINTS.listeners.validateResetToken, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || 'Failed to validate reset token');
    }

    return responseData;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'An unexpected error occurred');
  }
};