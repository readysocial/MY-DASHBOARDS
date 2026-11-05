import { API_ENDPOINTS } from "@/config/api";
import { getAuthHeaders, handleUnauthorized } from "@/utils/api";
import type { AnalyticsResponse } from "./types";

export const getDashboardAnalytics = async (
  months: number = 6
): Promise<AnalyticsResponse> => {
  const response = await fetch(
    `${API_ENDPOINTS.admin.analytics}?months=${months}`,
    { headers: getAuthHeaders() }
  );

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
  return data as AnalyticsResponse;
};
