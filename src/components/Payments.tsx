import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
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
import { StatusBadge, statusToneFrom } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { confirm } from "@/lib/confirm";
import { cn } from "@/lib/utils";
import { validateToken } from "@/utils/api";
import {
  getPaymentDetails,
  getPayments,
  verifyPayment,
} from "@/api/admin/payments/api";
import type {
  Payment,
  PaymentDetailsResponse,
  PaymentStatus,
} from "@/api/admin/payments/types";

const PAGE_SIZE = 10;

const formatNumber = (value: number | undefined) =>
  (value ?? 0).toLocaleString();

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

const formatProvider = (name?: string) => {
  if (!name) return "—";
  return name.charAt(0).toUpperCase() + name.slice(1);
};

function TruncateMono({ value, max = 14 }: { value: string; max?: number }) {
  const display =
    value.length > max ? `${value.slice(0, max - 4)}…${value.slice(-4)}` : value;
  return (
    <span
      className="font-mono text-xs tabular-nums text-rs-text"
      title={value}
    >
      {display}
    </span>
  );
}

type AppliedFilters = {
  userId: string;
  status: PaymentStatus | "";
  providerName: string;
  reference: string;
  startDate: string;
  endDate: string;
};

const emptyFilters: AppliedFilters = {
  userId: "",
  status: "",
  providerName: "",
  reference: "",
  startDate: "",
  endDate: "",
};

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState<PaymentStatus | "">("");
  const [providerName, setProviderName] = useState("");
  const [reference, setReference] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [applied, setApplied] = useState<AppliedFilters>(emptyFilters);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    validateToken();
  }, []);

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPayments({
        userId: applied.userId || undefined,
        status: applied.status || undefined,
        providerName: applied.providerName || undefined,
        reference: applied.reference || undefined,
        startDate: applied.startDate || undefined,
        endDate: applied.endDate || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setPayments(data.payments || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [applied, page, refreshKey]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (applied.userId) count += 1;
    if (applied.status) count += 1;
    if (applied.providerName) count += 1;
    if (applied.reference) count += 1;
    if (applied.startDate) count += 1;
    if (applied.endDate) count += 1;
    return count;
  }, [applied]);

  const applyFilters = () => {
    setApplied({
      userId,
      status,
      providerName,
      reference,
      startDate,
      endDate,
    });
    setPage(1);
  };

  const clearFilters = () => {
    setUserId("");
    setStatus("");
    setProviderName("");
    setReference("");
    setStartDate("");
    setEndDate("");
    setApplied(emptyFilters);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Top-up oversight, reference lookup, and provider verify / reconcile."
      />

      {error ? (
        <div className="rounded-lg border border-rs-primary/20 bg-rs-primary-tint px-3 py-2.5 text-sm text-rs-text-secondary">
          {error}
        </div>
      ) : null}

      <TableCard
        title="All payments"
        description={`${formatNumber(total)} payment${total === 1 ? "" : "s"}`}
        actions={
          <>
            <TableFilterMenu
              activeCount={activeFilterCount}
              onApply={applyFilters}
              onClear={clearFilters}
            >
              <FilterField label="User ID">
                <Input
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="h-8 text-xs font-mono"
                  placeholder="User ID"
                />
              </FilterField>
              <FilterField label="Reference">
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="h-8 text-xs font-mono"
                  placeholder="Payment or provider ref"
                />
              </FilterField>
              <FilterField label="Status">
                <select
                  className={cn(tableControlClassName, "w-full")}
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as PaymentStatus | "")
                  }
                >
                  <option value="">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </FilterField>
              <FilterField label="Provider">
                <Input
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  className="h-8 text-xs"
                  placeholder="paystack"
                />
              </FilterField>
              <div className="grid grid-cols-2 gap-2">
                <FilterField label="From">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                </FilterField>
                <FilterField label="To">
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-8 text-xs"
                  />
                </FilterField>
              </div>
            </TableFilterMenu>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setRefreshKey((k) => k + 1)}
              disabled={loading}
              aria-label="Refresh payments"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", loading && "animate-spin")}
              />
            </Button>
          </>
        }
        footer={
          <TablePagination
            page={page}
            totalPages={totalPages}
            total={total}
            itemLabel="payments"
            onPageChange={setPage}
          />
        }
      >
        <div className="hidden md:block">
          <Table variant="plain">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Reference</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Sparks</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : payments.length === 0 ? (
                <TableEmpty colSpan={7}>No payments found</TableEmpty>
              ) : (
                payments.map((payment) => (
                  <TableRow
                    key={payment._id}
                    className="cursor-pointer"
                    onClick={() => setSelectedId(payment._id)}
                  >
                    <TableCell>
                      <TruncateMono value={payment.reference} max={18} />
                    </TableCell>
                    <TableCell>
                      <TruncateMono value={payment.userId} max={14} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-rs-text">
                      {formatNumber(payment.amount)}{" "}
                      <span className="text-rs-text-muted">
                        {payment.currency}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {payment.metadata?.sparksAmount != null
                        ? formatNumber(payment.metadata.sparksAmount)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={statusToneFrom(payment.status)}>
                        {payment.status}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-rs-text-secondary">
                      {formatProvider(payment.providerName)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-rs-text-muted">
                      {formatDate(payment.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="divide-y divide-rs-border md:hidden">
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-rs-text-muted">
              No payments found
            </p>
          ) : (
            payments.map((payment) => (
              <button
                key={payment._id}
                type="button"
                className="flex w-full flex-col gap-2 px-4 py-3 text-left rs-transition hover:bg-rs-page/60"
                onClick={() => setSelectedId(payment._id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <TruncateMono value={payment.reference} max={20} />
                  <StatusBadge tone={statusToneFrom(payment.status)}>
                    {payment.status}
                  </StatusBadge>
                </div>
                <p className="text-sm font-medium tabular-nums text-rs-text">
                  {formatNumber(payment.amount)} {payment.currency}
                </p>
                <p className="text-[11px] text-rs-text-muted">
                  {formatProvider(payment.providerName)} ·{" "}
                  {formatDate(payment.createdAt)}
                </p>
              </button>
            ))
          )}
        </div>
      </TableCard>

      <PaymentDetailModal
        paymentId={selectedId}
        onClose={() => setSelectedId(null)}
        onUpdated={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
};

const PaymentDetailModal: React.FC<{
  paymentId: string | null;
  onClose: () => void;
  onUpdated: () => void;
}> = ({ paymentId, onClose, onUpdated }) => {
  const [details, setDetails] = useState<PaymentDetailsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const load = useCallback(async () => {
    if (!paymentId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getPaymentDetails(paymentId);
      setDetails(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payment");
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    if (!paymentId) {
      setDetails(null);
      setError(null);
      return;
    }
    load();
  }, [paymentId, load]);

  const handleVerify = async () => {
    if (!details?.payment) return;
    const ok = await confirm({
      title: "Verify / reconcile payment?",
      description: `Check the provider for ${details.payment.reference} and credit sparks if the payment succeeded.`,
      confirmText: "Verify",
    });
    if (!ok) return;

    try {
      setVerifying(true);
      setError(null);
      await verifyPayment(details.payment.reference);
      await load();
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verify failed");
    } finally {
      setVerifying(false);
    }
  };

  const payment = details?.payment;
  const canVerify =
    payment &&
    (payment.status === "pending" || payment.status === "failed");

  return (
    <Modal
      open={!!paymentId}
      onClose={onClose}
      title="Payment details"
      description={
        payment ? formatProvider(payment.providerName) : "Loading payment…"
      }
      className="max-w-xl"
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          {canVerify ? (
            <Button
              type="button"
              size="sm"
              onClick={handleVerify}
              disabled={verifying}
            >
              {verifying ? "Verifying…" : "Verify / reconcile"}
            </Button>
          ) : null}
        </>
      }
    >
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-rs-primary/20 bg-rs-primary-tint px-3 py-2.5 text-sm text-rs-text-secondary">
          {error}
        </div>
      ) : payment ? (
        <div className="space-y-4">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
            <DetailField label="Reference" value={payment.reference} mono />
            <DetailField label="User ID" value={payment.userId} mono />
            <DetailField
              label="Amount"
              value={`${formatNumber(payment.amount)} ${payment.currency}`}
            />
            <DetailField
              label="Sparks (metadata)"
              value={
                payment.metadata?.sparksAmount != null
                  ? formatNumber(payment.metadata.sparksAmount)
                  : "—"
              }
            />
            <div className="space-y-1">
              <dt className="text-[11px] font-medium text-rs-text-muted">
                Status
              </dt>
              <dd>
                <StatusBadge tone={statusToneFrom(payment.status)}>
                  {payment.status}
                </StatusBadge>
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-[11px] font-medium text-rs-text-muted">
                Sparks credited
              </dt>
              <dd>
                <StatusBadge
                  tone={details?.sparkCredited ? "success" : "warning"}
                >
                  {details?.sparkCredited ? "Yes" : "No"}
                </StatusBadge>
              </dd>
            </div>
            <DetailField
              label="Provider"
              value={formatProvider(payment.providerName)}
            />
            <DetailField
              label="Provider ref"
              value={payment.providerReference || "—"}
              mono
            />
            <DetailField label="Created" value={formatDate(payment.createdAt)} />
            <DetailField label="Updated" value={formatDate(payment.updatedAt)} />
          </dl>

          {details?.topupTransaction ? (
            <div className="rounded-lg border border-rs-border bg-rs-page px-3 py-2.5 text-sm">
              <p className="text-[11px] font-medium text-rs-text-muted">
                Linked top-up
              </p>
              <p className="mt-1 text-rs-text">
                {details.topupTransaction.type} ·{" "}
                {formatNumber(details.topupTransaction.amount)} sparks ·{" "}
                {details.topupTransaction.status}
              </p>
              <p className="mt-0.5 text-xs text-rs-text-muted">
                {details.topupTransaction.description}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
};

const DetailField: React.FC<{
  label: string;
  value: string;
  mono?: boolean;
}> = ({ label, value, mono }) => (
  <div className="space-y-1">
    <dt className="text-[11px] font-medium text-rs-text-muted">{label}</dt>
    <dd
      className={cn(
        "break-all text-sm text-rs-text",
        mono && "font-mono text-xs tabular-nums",
      )}
    >
      {value}
    </dd>
  </div>
);

export default Payments;
