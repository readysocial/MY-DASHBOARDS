export type PaymentStatus =
  | "pending"
  | "completed"
  | "failed"
  | "cancelled";

export interface Payment {
  _id: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  reference: string;
  providerName: string;
  providerReference?: string;
  description?: string;
  metadata?: {
    bundleId?: string;
    sparksAmount?: number;
    client?: string;
    [key: string]: unknown;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaymentsListResponse {
  payments: Payment[];
  total: number;
  page: number;
  limit: number;
}

export interface PaymentTopupTransaction {
  _id: string;
  userId: string;
  type: string;
  status: string;
  direction: string;
  amount: number;
  description: string;
  createdAt: string;
}

export interface PaymentDetailsResponse {
  payment: Payment;
  topupTransaction: PaymentTopupTransaction | null;
  sparkCredited: boolean;
}

export interface VerifyPaymentResponse {
  message: string;
  data?: {
    payment?: Payment;
    status?: string;
    providerStatus?: string;
  };
  sparkCreditedThisCall?: boolean;
}

export interface PaymentListParams {
  userId?: string;
  status?: PaymentStatus | "";
  providerName?: string;
  reference?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
