export interface TimeSlotUpdate {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface DayAvailabilityUpdate {
  dayOfWeek: string;
  times: TimeSlotUpdate[];
}

export interface UpdateListenerRequest {
  email: string;
  description: string;
  phoneNumber: string;
  name: string;
  gender: string;
  availability: DayAvailabilityUpdate[];
}

// Reuse the response type from profile
import type { ListenerProfileResponse } from '../listenerprofile/types';
export type UpdateListenerResponse = ListenerProfileResponse; 