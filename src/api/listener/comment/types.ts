import type { Session } from '../getsessions/types';

export interface AddCommentRequest {
  comment: string;
}

export interface AddCommentResponse {
  message: string;
  session: Session;
}