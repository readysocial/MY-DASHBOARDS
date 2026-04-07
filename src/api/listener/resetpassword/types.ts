export interface ResetPasswordRequest {
    token: string;
    password: string;
  }
  
  export interface ResetPasswordResponse {
    success: boolean;
    message: string;
  }