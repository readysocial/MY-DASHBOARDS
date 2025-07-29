export interface ValidateResetTokenRequest {
    token: string;
  }
  
  export interface ValidateResetTokenResponse {
    success: boolean;
    message: string;
  }