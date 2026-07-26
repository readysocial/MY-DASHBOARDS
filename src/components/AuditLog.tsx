import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { InlineAlert } from "@/components/ui/inline-alert";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  FilterField,
  TableFilterMenu,
} from "@/components/ui/table-filter-menu";
import { tableControlClassName } from "@/components/ui/table-search";
import { Skeleton } from "@/components/ui/skeleton";
import { validateToken } from "@/utils/api";
import { getAuditLog } from "@/api/admin/audit/api";
import type { AuditAction, AuditLogEntry } from "@/api/admin/audit/types";

const PAGE_SIZE = 20;

const ACTION_LABELS: Record<AuditAction, string> = {
  "sparks.adjust": "Sparks adjust",
  "wallet.status": "Wallet status",
  "session.refund": "Session refund",
  "pricing.update": "Pricing update",
  "app_version.set": "App version",
};

const ACTION_OPTIONS: Array<{ value: AuditAction | ""; label: string }> = [
  { value: "", label: "All actions" },
  { value: "sparks.adjust", label: ACTION_LABELS["sparks.adjust"] },
  { value: "wallet.status", label: ACTION_LABELS["wallet.status"] },
  { value: "session.refund", label: ACTION_LABELS["session.refund"] },
  { value: "pricing.update", label: ACTION_LABELS["pricing.update"] },
  { value: "app_version.set", label: ACTION_LABELS["app_version.set"] },
];

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

type AppliedFilters = {
  action: AuditAction | "";
  startDate: string;
  endDate: string;
};

const emptyFilters: AppliedFilters = {
  action: "",
  startDate: "",
  endDate: "",
};

const AuditLog: React.FC = () => {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [action, setAction] = useState<AuditAction | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [applied, setApplied] = useState<AppliedFilters>(emptyFilters);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    validateToken();
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAuditLog({
        action: applied.action || undefined,
        startDate: applied.startDate || undefined,
        endDate: applied.endDate || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setEntries(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit log");
    } finally {
      setLoading(false);
    }
  }, [applied, page, refreshKey]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (applied.action) count += 1;
    if (applied.startDate) count += 1;
    if (applied.endDate) count += 1;
    return count;
  }, [applied]);

  const applyFilters = () => {
    setApplied({ action, startDate, endDate });
    setPage(1);
  };

  const clearFilters = () => {
    setAction("");
    setStartDate("");
    setEndDate("");
    setApplied(emptyFilters);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit"
        description="Who changed sparks, wallets, refunds, pricing, and app version."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        }
      />

      {error ? (
        <InlineAlert variant="error" onDismiss={() => setError(null)}>
          {error}
        </InlineAlert>
      ) : null}

      <TableCard
        title="Activity"
        description={`${total.toLocaleString()} event${total === 1 ? "" : "s"}`}
        actions={
          <TableFilterMenu
            activeCount={activeFilterCount}
            onApply={applyFilters}
            onClear={clearFilters}
          >
            <FilterField label="Action">
              <select
                className={tableControlClassName}
                value={action}
                onChange={(e) =>
                  setAction(e.target.value as AuditAction | "")
                }
              >
                {ACTION_OPTIONS.map((opt) => (
                  <option key={opt.value || "all"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="From">
              <Input
                type="date"
                className={tableControlClassName}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </FilterField>
            <FilterField label="To">
              <Input
                type="date"
                className={tableControlClassName}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </FilterField>
          </TableFilterMenu>
        }
        footer={
          <TablePagination
            page={page}
            totalPages={totalPages}
            total={total}
            itemLabel="events"
            onPageChange={setPage}
          />
        }
      >
        {loading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <Table variant="plain">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>When</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead className="hidden md:table-cell">Target</TableHead>
                <TableHead>Summary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableEmpty colSpan={5}>No audit events yet</TableEmpty>
              ) : (
                entries.map((row) => (
                  <TableRow key={row._id || `${row.createdAt}-${row.action}`}>
                    <TableCell className="whitespace-nowrap text-rs-text-muted">
                      {formatDate(row.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium text-rs-text">
                      {ACTION_LABELS[row.action] || row.action}
                    </TableCell>
                    <TableCell className="max-w-[12rem] truncate text-sm">
                      {row.adminEmail}
                    </TableCell>
                    <TableCell className="hidden max-w-[10rem] truncate font-mono text-xs text-rs-text-muted md:table-cell">
                      {row.targetId || "—"}
                    </TableCell>
                    <TableCell className="max-w-[20rem] truncate text-sm text-rs-text-secondary">
                      {row.summary}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </TableCard>
    </div>
  );
};

export default AuditLog;
