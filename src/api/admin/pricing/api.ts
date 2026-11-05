import { API_ENDPOINTS } from "@/config/api";
import { getAuthHeaders, handleUnauthorized } from "@/utils/api";
import type { PricingConfig, PricingConfigUpdate } from "./types";

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

export const getPricingConfig = async (): Promise<PricingConfig> => {
  const response = await fetch(API_ENDPOINTS.admin.pricing, {
    headers: getAuthHeaders(),
  });
  return parseJson<PricingConfig>(response);
};

export const updatePricingConfig = async (
  data: PricingConfigUpdate
): Promise<{ message: string; config: PricingConfig }> => {
  const response = await fetch(API_ENDPOINTS.admin.pricing, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return parseJson(response);
};
