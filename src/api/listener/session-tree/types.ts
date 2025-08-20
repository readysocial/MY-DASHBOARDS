export interface FullSessionTreeResponse {
  parent: SessionTreeNode;
  children: SessionTreeNode[];
}

export interface SessionTreeNode {
  _id: string;
  topic: string;
  time: string;
  status: 'pending' | 'successful' | 'unsuccessful' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  __v: number;
  user: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    anonymousName: string;
    verified: boolean;
    createdAt: string;
    updatedAt: string;
  };
  listener: {
    _id: string;
    name: string;
    description: string;
    gender: string;
    phoneNumber: string;
    email: string;
    active: boolean;
  };
  reflectData: {
    userReflectionData: string[]; // assuming it's an array of strings
  };
  repeats?: {
    count: number;
    pendingAcceptance: boolean;
    _id: string;
  };
  repeatSessionId?: string;
  meetingLink?: string;   // ✅ ADDED
  comment?: string;       // ✅ ADDED
}