export type WalletStatus = "active" | "suspended" | "closed";

export type TransactionType =
  | "payment_topup"
  | "gift_sent"
  | "gift_received"
  | "admin_adjustment"
  | "session_paid"
  | "session_refunded";

export type TransactionStatus =
  | "pending"
  | "completed"
  | "failed"
  | "cancelled";

export type TransactionDirection = "credit" | "debit";

export interface SparkStats {
  totalSparksNotRedeemed: number;
  totalWalletsCount: number;
  activeWalletsCount: number;
  totalPurchased: number;
  totalRedeemed: number;
  totalGifted: number;
}

export interface Wallet {
  _id?: string;
  userId: string;
  sparkId: string;
  status: WalletStatus;
  sparks: number;
  allowGifts: boolean;
  allowSessionPayments: boolean;
  allowTopUps: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WalletsResponse {
  wallets: Wallet[];
  total: number;
}

export interface UserSparkStats {
  totalPurchased: number;
  totalRedeemed: number;
  totalGiftSent: number;
  totalGiftReceived: number;
  adjustmentCredit: number;
  adjustmentDebit: number;
}

export interface Transaction {
  _id: string;
  userId: string;
  category: string;
  type: TransactionType;
  status: TransactionStatus;
  direction: TransactionDirection;
  amount: number;
  balanceBefore?: number;
  balanceAfter?: number;
  description: string;
  paymentReference?: string;
  providerName?: string;
  relatedUserId?: string;
  sessionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletDetailsResponse {
  wallet: Wallet;
  stats: UserSparkStats;
  recentTransactions: Transaction[];
}

export interface AdjustSparksRequest {
  userId: string;
  amount: number;
  direction: TransactionDirection;
  reason: string;
}

export interface AdjustSparksResponse {
  message: string;
  transaction: Transaction;
}

export interface UpdateWalletStatusRequest {
  status: WalletStatus;
  reason: string;
}

export interface UpdateWalletStatusResponse {
  message: string;
  wallet: Wallet;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export interface WalletListParams {
  userId?: string;
  sparkId?: string;
  status?: WalletStatus | "";
  minSparks?: string;
  maxSparks?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "1" | "-1";
}

export interface TransactionListParams {
  userId?: string;
  type?: TransactionType | "";
  status?: TransactionStatus | "";
  direction?: TransactionDirection | "";
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
