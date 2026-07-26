import { API_ENDPOINTS } from "@/config/api";
import { getAuthHeaders, handleUnauthorized } from "@/utils/api";
import type { ListenerPerformanceResult } from "./types";

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

export const getListenerPerformance = async (params?: {
  from?: string;
  to?: string;
}): Promise<ListenerPerformanceResult> => {
  const search = new URLSearchParams();
  if (params?.from) search.set("from", params.from);
  if (params?.to) search.set("to", params.to);
  const qs = search.toString();
  const url = qs
    ? `${API_ENDPOINTS.admin.listenersPerformance}?${qs}`
    : API_ENDPOINTS.admin.listenersPerformance;

  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });
  return parseJson<ListenerPerformanceResult>(response);
};
