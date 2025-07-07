import { Listener } from '../types';

// Request type for token validation
export interface ValidateTokenRequest {
  token: string;
}

// Response when validating token
export interface ValidateTokenResponse {
  isValid: boolean;
  data?: {
    name: string;
    email: string;
    invitedBy: string;
    expiresAt: number;
    token: string;
  };
  error?: string;
}

// Time slot interface
export interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

// Availability schedule interface
export interface DayAvailability {
  dayOfWeek: string;
  times: TimeSlot[];
}

// Main registration request interface
export interface ListenerRegistrationRequest {
  token: string;
  password: string;
  description: string;
  gender: 'male' | 'female' | 'other';
  phoneNumber: string;
  availability: DayAvailability[];
}

// Registration success response
export interface ListenerRegistrationResponse {
  message: string;
  listener: Listener;
}

// Registration error response
export interface ListenerRegistrationError {
  message: string;
  errors?: {
    [key: string]: string;
  };
}

// Pre-filled data from token
export interface RegistrationPrefilledData {
  name: string;
  email: string;
  invitedBy: string;
  expiresAt: number;
  token: string;
} 