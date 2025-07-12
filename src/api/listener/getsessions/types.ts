interface ReflectionData {
  userReflectionData: any[]; // You can make this more specific based on your needs
}

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  anonymousName: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Listener {
  _id: string;
  name: string;
  description: string;
  gender: string;
  phoneNumber: string;
  email: string;
  active: boolean;
}

export interface Session {
  _id: string;
  reflectData: ReflectionData;
  user: User;
  listener: Listener;
  topic: string;
  time: string;
  status: 'pending' | 'successful' | 'unsuccessful' | 'cancelled';
  meetingLink?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetListenerSessionsResponse {
  sessions: Session[];
}

export interface AddMeetingLinkResponse {
  session: Session;
}

export interface AddMeetingLinkRequest {
  meetingLink: string;
} 