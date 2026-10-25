import type { Session } from '../getsessions/types';

export type SessionStatus = 'successful' | 'unsuccessful' | 'cancelled' | 'pending';

export interface UpdateStatusRequest {
  status: SessionStatus;
}

export interface UpdateStatusResponse {
  message: string;
  session: Session;
} 