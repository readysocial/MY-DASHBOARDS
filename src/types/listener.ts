// Existing interfaces
export interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  _id?: string;
}

export interface DayAvailability {
  dayOfWeek: string;
  times: TimeSlot[];
  _id?: string;
}

export interface Listener {
  _id?: string;
  name: string;
  description: string;
  gender: 'male' | 'female' | 'other';
  availability: {
    dayOfWeek: string;
    times: {
      startTime: string;
      endTime: string;
      isAvailable: boolean;
      _id?: string;
    }[];
    _id?: string;
  }[];
  email: string;
  phoneNumber: string;
  active?: boolean;
}

export interface FormErrors {
  name?: string;
  description?: string;
  gender?: string;
  availability?: string;
  email?: string;  
  phoneNumber?: string;
}

export interface ApiResponse {
  listener: Listener;
}

// Add the Message interface
export interface Message {
  _id: string;
  subject: string;
  content: string;
  priority: 'normal' | 'urgent';
  createdAt: string;
  status: 'sent' | 'failed' | 'pending';
}