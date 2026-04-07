interface ReflectionQuestion {
  question: string;
  answer: string;
  _id: string;
}

interface ReflectionData {
  userReflectionData: ReflectionQuestion[];
  _id: string;
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
  __v: number;
}

interface Listener {
  _id: string;
  name: string;
  description: string;
  gender: string;
  phoneNumber: string;
  email: string;
  active: boolean;
  __v: number;
  passwordResetExpires?: string;
  passwordResetToken?: string;
}

interface Repeats {
  count: number;
  pendingAcceptance: boolean;
  _id: string;
}

export interface Session {
  _id: string;
  user: User;
  listener: Listener;
  topic: string;
  time: string;
  status: 'pending' | 'successful' | 'unsuccessful' | 'cancelled';
  reflectData: ReflectionData;
  repeats?: Repeats;
  repeatSessionId?: string;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface RelatedSessionsResponse {
  baseSession: Session;
  relatedSessions: Session[];
}

export interface GetRelatedSessionsParams {
  sessionId: string;
}