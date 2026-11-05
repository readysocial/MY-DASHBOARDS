import { API_ENDPOINTS } from "@/config/api";
import { getAuthHeaders, handleUnauthorized } from "@/utils/api";
import type { SupportLookupResult } from "./types";

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

export const supportLookup = async (
  q: string
): Promise<SupportLookupResult> => {
  const url = `${API_ENDPOINTS.admin.supportLookup}?q=${encodeURIComponent(q.trim())}`;
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });
  return parseJson<SupportLookupResult>(response);
};
