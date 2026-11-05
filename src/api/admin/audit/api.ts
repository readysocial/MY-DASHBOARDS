import { API_ENDPOINTS } from "@/config/api";
import { getAuthHeaders, handleUnauthorized } from "@/utils/api";
import type { AuditLogListParams, AuditLogListResponse } from "./types";

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

export const getAuditLog = async (
  params: AuditLogListParams = {}
): Promise<AuditLogListResponse> => {
  const query = buildQuery({
    action: params.action || undefined,
    adminId: params.adminId,
    targetId: params.targetId,
    startDate: params.startDate,
    endDate: params.endDate,
    page: params.page,
    limit: params.limit,
  });
  const response = await fetch(`${API_ENDPOINTS.admin.auditLog}${query}`, {
    headers: getAuthHeaders(),
  });
  return parseJson<AuditLogListResponse>(response);
};
