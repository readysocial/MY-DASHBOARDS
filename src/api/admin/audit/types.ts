export type AuditAction =
  | "sparks.adjust"
  | "wallet.status"
  | "session.refund"
  | "pricing.update"
  | "app_version.set";

export interface AuditLogEntry {
  _id?: string;
  action: AuditAction;
  adminId: string;
  adminEmail: string;
  targetType?: string;
  targetId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLogListParams {
  action?: AuditAction | "";
  adminId?: string;
  targetId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogListResponse {
  data: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
}
