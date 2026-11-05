import { API_ENDPOINTS } from "@/config/api";
import { getAuthHeaders, handleUnauthorized } from "@/utils/api";
import type {
  AdjustSparksRequest,
  AdjustSparksResponse,
  SparkStats,
  TransactionListParams,
  TransactionsResponse,
  UpdateWalletStatusRequest,
  UpdateWalletStatusResponse,
  WalletDetailsResponse,
  WalletListParams,
  WalletsResponse,
} from "./types";

const buildQuery = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
};

const parseJson = async <T>(response: Response): Promise<T> => {
  if (response.status === 401) {
    handleUnauthorized(response);
    throw new Error("Unauthorized");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      (data as { message?: string }).message ||
        `Request failed (${response.status})`
    );
  }
  return data as T;
};

export const getSparkStats = async (): Promise<SparkStats> => {
  const response = await fetch(API_ENDPOINTS.admin.sparks.stats, {
    headers: getAuthHeaders(),
  });
  return parseJson<SparkStats>(response);
};

export const getWallets = async (
  params: WalletListParams = {}
): Promise<WalletsResponse> => {
  const query = buildQuery({
    userId: params.userId,
    sparkId: params.sparkId,
    status: params.status,
    minSparks: params.minSparks,
    maxSparks: params.maxSparks,
    page: params.page ?? 1,
    limit: params.limit ?? 10,
    sortBy: params.sortBy ?? "createdAt",
    sortOrder: params.sortOrder ?? "-1",
  });

  const response = await fetch(
    `${API_ENDPOINTS.admin.sparks.wallets}${query}`,
    { headers: getAuthHeaders() }
  );
  return parseJson<WalletsResponse>(response);
};

export const getWalletDetails = async (
  userId: string
): Promise<WalletDetailsResponse> => {
  const response = await fetch(
    API_ENDPOINTS.admin.sparks.walletDetails(userId),
    { headers: getAuthHeaders() }
  );
  return parseJson<WalletDetailsResponse>(response);
};

export const adjustSparks = async (
  data: AdjustSparksRequest
): Promise<AdjustSparksResponse> => {
  const response = await fetch(API_ENDPOINTS.admin.sparks.adjustSparks, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return parseJson<AdjustSparksResponse>(response);
};

export const updateWalletStatus = async (
  userId: string,
  data: UpdateWalletStatusRequest
): Promise<UpdateWalletStatusResponse> => {
  const response = await fetch(
    API_ENDPOINTS.admin.sparks.walletStatus(userId),
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  );
  return parseJson<UpdateWalletStatusResponse>(response);
};

export const getTransactions = async (
  params: TransactionListParams = {}
): Promise<TransactionsResponse> => {
  const query = buildQuery({
    userId: params.userId,
    type: params.type,
    status: params.status,
    direction: params.direction,
    startDate: params.startDate,
    endDate: params.endDate,
    page: params.page ?? 1,
    limit: params.limit ?? 10,
  });

  const response = await fetch(
    `${API_ENDPOINTS.admin.sparks.transactions}${query}`,
    { headers: getAuthHeaders() }
  );
  return parseJson<TransactionsResponse>(response);
};
