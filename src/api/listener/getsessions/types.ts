

export interface GetListenerSessionsResponse {
  sessions: Session[];
}

export interface AddMeetingLinkResponse {
  session: Session;
}

export interface AddMeetingLinkRequest {
  meetingLink: string;
} 


export interface ReflectionQuestion {
  question: string;
  answer: string;
  _id: string;
}

export interface ReflectionData {
  userReflectionData: ReflectionQuestion[];
  _id: string;
}

export interface User {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  anonymousName: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface Listener {
  _id: string;
  name: string;
  description: string;
  gender: string;
  phoneNumber: string;
  email: string;
  active: boolean;
  __v: number;
}

export interface Repeats {
  count: number;
  pendingAcceptance: boolean;
  _id: string;
}

export interface TopicRef {
  _id: string;
  topic: string;
  count: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface Session {
  _id: string;
  user: User;
  listener: Listener;
  topic: string;
  topicRef?: TopicRef;
  time: string;
  meetingLink?: string;
  status: 'pending' | 'successful' | 'unsuccessful' | 'cancelled';
  comment?: string;
  reflectData?: ReflectionData;
  repeats?: Repeats;
  repeatSessionId?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}




export interface GetListenerSessionsResponse {
  sessions: Session[];
  total: number;   // ← Added
  skip: number;    // ← Added
  limit: number;   // ← Added
}