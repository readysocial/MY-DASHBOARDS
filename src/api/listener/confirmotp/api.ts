import { API_ENDPOINTS } from '@/config/api';
import { ConfirmOtpRequest, ConfirmOtpResponse } from './types';

export const confirmOtp = async (data: ConfirmOtpRequest): Promise<ConfirmOtpResponse> => {
  try {
    const response = await fetch(API_ENDPOINTS.listeners.confirmOtp, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || 'Failed to confirm OTP');
    }

    return responseData;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'An unexpected error occurred');
  }
};