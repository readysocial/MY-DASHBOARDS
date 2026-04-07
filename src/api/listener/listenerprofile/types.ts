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

export interface ListenerProfile {
  _id: string;
  name: string;
  description: string;
  gender: string;
  availability: DayAvailability[];
  phoneNumber: string;
  email: string;
  active: boolean;
}

export interface ListenerProfileResponse {
  listener: ListenerProfile;
} 