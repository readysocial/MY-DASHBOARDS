import { API_ENDPOINTS } from '@/config/api';
import { SendOtpRequest, SendOtpResponse } from './types';

export const sendOtp = async (data: SendOtpRequest): Promise<SendOtpResponse> => {
  try {
    const response = await fetch(API_ENDPOINTS.listeners.sendOtp, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || 'Failed to send OTP');
    }

    return responseData;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'An unexpected error occurred');
  }
};