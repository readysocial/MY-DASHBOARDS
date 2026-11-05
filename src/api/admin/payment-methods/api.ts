import { API_ENDPOINTS } from "@/config/api";
import { getAuthHeaders, handleUnauthorized } from "@/utils/api";
import type {
  PaymentMethodsResponse,
  PaymentMethodsUpdate,
} from "./types";

const parseJson = async <T>(response: Response): Promise<T> => {
  if (response.status === 401) {
    handleUnauthorized(response);
    throw new Error("Unauthorized");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      (data as { message?: string }).message ||
        `Request failed (${response.status})`,
    );
  }
  return data as T;
};

export const getPaymentMethodsConfig =
  async (): Promise<PaymentMethodsResponse> => {
    const response = await fetch(API_ENDPOINTS.admin.paymentMethods, {
      headers: getAuthHeaders(),
    });
    return parseJson<PaymentMethodsResponse>(response);
  };

export const updatePaymentMethodsConfig = async (
  data: PaymentMethodsUpdate,
): Promise<PaymentMethodsResponse & { message: string }> => {
  const response = await fetch(API_ENDPOINTS.admin.paymentMethods, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return parseJson<PaymentMethodsResponse & { message: string }>(response);
};
