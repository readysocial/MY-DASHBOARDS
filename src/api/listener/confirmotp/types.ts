export interface ConfirmOtpRequest {
    email: string;
    otp: string;
  }
  
  export interface ConfirmOtpResponse {
    token: string;
  }