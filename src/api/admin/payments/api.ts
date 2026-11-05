import { API_ENDPOINTS } from "@/config/api";
import { getAuthHeaders, handleUnauthorized } from "@/utils/api";
import type {
  PaymentDetailsResponse,
  PaymentListParams,
  PaymentsListResponse,
  VerifyPaymentResponse,
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

export const getPayments = async (
  params: PaymentListParams = {}
): Promise<PaymentsListResponse> => {
  const query = buildQuery({
    userId: params.userId,
    status: params.status,
    providerName: params.providerName,
    reference: params.reference,
    startDate: params.startDate,
    endDate: params.endDate,
    page: params.page ?? 1,
    limit: params.limit ?? 10,
  });

  const response = await fetch(
    `${API_ENDPOINTS.admin.payments.list}${query}`,
    { headers: getAuthHeaders() }
  );
  return parseJson<PaymentsListResponse>(response);
};

export const getPaymentDetails = async (
  id: string
): Promise<PaymentDetailsResponse> => {
  const response = await fetch(API_ENDPOINTS.admin.payments.details(id), {
    headers: getAuthHeaders(),
  });
  return parseJson<PaymentDetailsResponse>(response);
};

export const verifyPayment = async (
  reference: string
): Promise<VerifyPaymentResponse> => {
  const response = await fetch(
    API_ENDPOINTS.admin.payments.verify(reference),
    {
      method: "POST",
      headers: getAuthHeaders(),
    }
  );
  return parseJson<VerifyPaymentResponse>(response);
};
