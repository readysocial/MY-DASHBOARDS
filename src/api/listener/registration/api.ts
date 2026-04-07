import { API_URL } from '@/config/api';
import {
  ListenerRegistrationRequest,
  ListenerRegistrationResponse,
  RegistrationPrefilledData
} from './types';

/**
 * Decodes the JWT token to get pre-filled data
 */
const decodeToken = (token: string): RegistrationPrefilledData => {
  try {
    // JWT is base64 encoded in three parts: header.payload.signature
    const payload = token.split('.')[1];
    const decodedPayload = JSON.parse(atob(payload));
    
    return {
      name: decodedPayload.name,
      email: decodedPayload.email,
      invitedBy: decodedPayload.invitedBy,
      expiresAt: decodedPayload.expiresAt,
      token: token
    };
  } catch (error) {
    throw new Error('Invalid token format');
  }
};

/**
 * Gets the pre-filled registration data from token
 */
export const getRegistrationData = (token: string): RegistrationPrefilledData => {
  try {
    return decodeToken(token);
  } catch (error) {
    throw new Error('Failed to decode registration token');
  }
};

/**
 * Registers a new listener with the provided data
 */
export const registerListener = async (
  data: ListenerRegistrationRequest
): Promise<ListenerRegistrationResponse> => {
  try {
    const response = await fetch(`${API_URL}/listeners/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || 'Failed to register listener');
    }

    return responseData;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'An unexpected error occurred');
  }
}; 