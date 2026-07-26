export interface SupportLookupUser {
  id: string;
  anonymousName: string;
  email: string;
  verified: boolean;
  createdAt: string;
}

export interface SupportLookupWallet {
  id?: string;
  sparkId: string;
  userId: string;
  balance: number;
  status: string;
}

export interface SupportLookupPayment {
  id?: string;
  reference: string;
  providerReference?: string;
  status: string;
  amount: number;
  currency?: string;
  userId: string;
}

export interface SupportLookupResult {
  query: string;
  users: SupportLookupUser[];
  wallets: SupportLookupWallet[];
  payments: SupportLookupPayment[];
}
