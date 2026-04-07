export interface LoginRequest {
  email: string;
  password: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  _id: string;
}

export interface DayAvailability {
  dayOfWeek: string;
  times: TimeSlot[];
  _id: string;
}

export interface Listener {
  _id: string;
  name: string;
  description: string;
  gender: string;
  availability: DayAvailability[];
  phoneNumber: string;
  email: string;
  active: boolean;
}

export interface LoginResponse {
  token: string;
  listener: Listener;
} 