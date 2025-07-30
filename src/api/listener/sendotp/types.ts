export interface SendOtpRequest {
    email: string;
  }
  
  export interface SendOtpResponse {
    success: boolean;
    message: string;
  }