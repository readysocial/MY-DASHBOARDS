import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Zap, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHeader,
  TableRow,
  SortableTableHead,
  TableHead,
} from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { TablePagination } from "@/components/ui/table-pagination";
import { tableControlClassName } from "@/components/ui/table-search";
import {
  FilterField,
  TableFilterMenu,
} from "@/components/ui/table-filter-menu";
import { StatusBadge, statusToneFrom } from "@/components/ui/status-badge";
import { confirm } from "@/lib/confirm";
import { validateToken } from "@/utils/api";
import {
  adjustSparks,
  getSparkStats,
  getTransactions,
  getWalletDetails,
  getWallets,
  updateWalletStatus,
} from "@/api/admin/sparks/api";
import type {
  SparkStats,
  Transaction,
  TransactionDirection,
  TransactionStatus,
  TransactionType,
  UserSparkStats,
  Wallet as WalletType,
  WalletStatus,
} from "@/api/admin/sparks/types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const TRANSACTION_TYPES: TransactionType[] = [
  "payment_topup",
  "gift_sent",
  "gift_received",
  "admin_adjustment",
  "session_paid",
  "session_refunded",
];

const formatNumber = (value: number | undefined) =>
  (value ?? 0).toLocaleString();

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleString() : "—";


const Sparks: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    validateToken();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sparks"
        description="Manage wallets, balances, and the transaction ledger."
        icon={<Zap strokeWidth={1.75} />}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="wallets">Wallets</TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="wallets" className="mt-4">
          <WalletsTab />
        </TabsContent>
        <TabsContent value="ledger" className="mt-4">
          <LedgerTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const OverviewTab: React.FC = () => {
  const [stats, setStats] = useState<SparkStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSparkStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const cards = [
    {
      title: "Sparks not redeemed",
      value: stats?.totalSparksNotRedeemed,
      description: "Total balance across active wallets",
    },
    {
      title: "Total wallets",
      value: stats?.totalWalletsCount,
      description: "All wallets created",
    },
    {
      title: "Active wallets",
      value: stats?.activeWalletsCount,
      description: "Active with sparks > 0",
    },
    {
      title: "Total purchased",
      value: stats?.totalPurchased,
      description: "Completed top-ups",
    },
    {
      title: "Total redeemed",
      value: stats?.totalRedeemed,
      description: "Spent on sessions",
    },
    {
      title: "Total gifted",
      value: stats?.totalGifted,
      description: "Gifts sent between users",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={loadStats} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-rs-border bg-rs-primary-tint px-4 py-3 text-sm text-rs-text">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <StatCard
            key={card.title}
            label={card.title}
            value={loading ? "…" : formatNumber(card.value)}
            hint={card.description}
          />
        ))}
      </div>
    </div>
  );
};

const WalletsTab: React.FC = () => {
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState("");
  const [sparkId, setSparkId] = useState("");
  const [status, setStatus] = useState<WalletStatus | "">("");
  const [minSparks, setMinSparks] = useState("");
  const [maxSparks, setMaxSparks] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"1" | "-1">("-1");

  const [applied, setApplied] = useState({
    userId: "",
    sparkId: "",
    status: "" as WalletStatus | "",
    minSparks: "",
    maxSparks: "",
    sortBy: "createdAt",
    sortOrder: "-1" as "1" | "-1",
  });

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadWallets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWallets({
        userId: applied.userId || undefined,
        sparkId: applied.sparkId || undefined,
        status: applied.status || undefined,
        minSparks: applied.minSparks || undefined,
        maxSparks: applied.maxSparks || undefined,
        page,
        limit: PAGE_SIZE,
        sortBy: applied.sortBy,
        sortOrder: applied.sortOrder,
      });
      setWallets(data.wallets || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load wallets");
    } finally {
      setLoading(false);
    }
  }, [applied, page, refreshKey]);

  useEffect(() => {
    loadWallets();
  }, [loadWallets]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const applyFilters = () => {
    setApplied({
      userId,
      sparkId,
      status,
      minSparks,
      maxSparks,
      sortBy,
      sortOrder,
    });
    setPage(1);
  };

  const clearFilters = () => {
    setUserId("");
    setSparkId("");
    setStatus("");
    setMinSparks("");
    setMaxSparks("");
    setSortBy("createdAt");
    setSortOrder("-1");
    setApplied({
      userId: "",
      sparkId: "",
      status: "",
      minSparks: "",
      maxSparks: "",
      sortBy: "createdAt",
      sortOrder: "-1",
    });
    setPage(1);
  };

  const handleSort = (column: string) => {
    const nextOrder: "1" | "-1" =
      applied.sortBy === column && applied.sortOrder === "-1" ? "1" : "-1";
    setSortBy(column);
    setSortOrder(nextOrder);
    setApplied((prev) => ({
      ...prev,
      sortBy: column,
      sortOrder: nextOrder,
    }));
    setPage(1);
  };

  const uiSortOrder = applied.sortOrder === "1" ? "asc" : "desc";

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (applied.userId) count += 1;
    if (applied.sparkId) count += 1;
    if (applied.status) count += 1;
    if (applied.minSparks) count += 1;
    if (applied.maxSparks) count += 1;
    return count;
  }, [applied]);

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-xl border border-rs-border bg-rs-surface px-4 py-3 text-sm text-rs-text">
          {error}
        </div>
      ) : null}

      <TableCard
        title="Wallets"
        description={`${total} wallet${total === 1 ? "" : "s"}`}
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
                  className="h-8 text-xs"
                  placeholder="Exact or partial ID"
                />
              </FilterField>
              <FilterField label="Spark ID">
                <Input
                  value={sparkId}
                  onChange={(e) => setSparkId(e.target.value)}
                  className="h-8 text-xs"
                  placeholder="Prefix"
                />
              </FilterField>
              <FilterField label="Status">
                <select
                  className={cn(tableControlClassName, "w-full")}
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as WalletStatus | "")
                  }
                >
                  <option value="">All statuses</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="closed">Closed</option>
                </select>
              </FilterField>
              <div className="grid grid-cols-2 gap-2">
                <FilterField label="Min balance">
                  <Input
                    type="number"
                    value={minSparks}
                    onChange={(e) => setMinSparks(e.target.value)}
                    className="h-8 text-xs"
                    placeholder="0"
                  />
                </FilterField>
                <FilterField label="Max balance">
                  <Input
                    type="number"
                    value={maxSparks}
                    onChange={(e) => setMaxSparks(e.target.value)}
                    className="h-8 text-xs"
                    placeholder="—"
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
              aria-label="Refresh wallets"
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
            itemLabel="wallets"
            onPageChange={setPage}
          />
        }
      >
        <div className="hidden md:block">
          <Table variant="plain">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Spark ID</TableHead>
                <TableHead>User ID</TableHead>
                <SortableTableHead
                  column="sparks"
                  sortBy={applied.sortBy}
                  sortOrder={uiSortOrder}
                  onSort={handleSort}
                >
                  Balance
                </SortableTableHead>
                <TableHead>Status</TableHead>
                <SortableTableHead
                  column="createdAt"
                  sortBy={applied.sortBy}
                  sortOrder={uiSortOrder}
                  onSort={handleSort}
                >
                  Created
                </SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableEmpty colSpan={5}>Loading wallets…</TableEmpty>
              ) : wallets.length === 0 ? (
                <TableEmpty colSpan={5}>No wallets found</TableEmpty>
              ) : (
                wallets.map((wallet) => (
                  <TableRow
                    key={wallet.userId}
                    className="cursor-pointer"
                    onClick={() => setSelectedUserId(wallet.userId)}
                  >
                    <TableCell className="font-mono text-xs text-rs-text">
                      {wallet.sparkId}
                    </TableCell>
                    <TableCell className="max-w-[10rem] truncate font-mono text-xs">
                      {wallet.userId}
                    </TableCell>
                    <TableCell className="font-medium text-rs-text">
                      {formatNumber(wallet.sparks)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={statusToneFrom(wallet.status)}>
                        {wallet.status}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-rs-text-muted">
                      {formatDate(wallet.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="divide-y divide-rs-border md:hidden">
          {loading ? (
            <p className="p-4 text-center text-sm text-rs-text-muted">
              Loading wallets…
            </p>
          ) : wallets.length === 0 ? (
            <p className="p-4 text-center text-sm text-rs-text-muted">
              No wallets found
            </p>
          ) : (
            wallets.map((wallet) => (
              <button
                key={wallet.userId}
                type="button"
                className="w-full p-3 text-left rs-transition hover:bg-rs-page"
                onClick={() => setSelectedUserId(wallet.userId)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-rs-text-muted">
                      {wallet.sparkId}
                    </p>
                    <p className="mt-1 font-medium text-rs-text">
                      {formatNumber(wallet.sparks)} sparks
                    </p>
                    <p className="mt-0.5 truncate font-mono text-xs text-rs-text-muted">
                      {wallet.userId}
                    </p>
                  </div>
                  <StatusBadge tone={statusToneFrom(wallet.status)}>
                    {wallet.status}
                  </StatusBadge>
                </div>
              </button>
            ))
          )}
        </div>
      </TableCard>

      {selectedUserId && (
        <WalletDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onUpdated={() => {
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
};

interface WalletDetailModalProps {
  userId: string;
  onClose: () => void;
  onUpdated: () => void;
}

const WalletDetailModal: React.FC<WalletDetailModalProps> = ({
  userId,
  onClose,
  onUpdated,
}) => {
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [stats, setStats] = useState<UserSparkStats | null>(null);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdjust, setShowAdjust] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  const loadDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWalletDetails(userId);
      setWallet(data.wallet);
      setStats(data.stats);
      setRecent(data.recentTransactions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load wallet");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b px-6 py-4 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-gray-900">Wallet details</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <p className="text-gray-500">Loading…</p>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : wallet ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <DetailField label="Spark ID" value={wallet.sparkId} mono />
                <DetailField label="User ID" value={wallet.userId} mono />
                <DetailField
                  label="Balance"
                  value={`${formatNumber(wallet.sparks)} sparks`}
                />
                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Status
                  </label>
                  <div className="mt-1">
                    <StatusBadge tone={statusToneFrom(wallet.status)}>
                      {wallet.status}
                    </StatusBadge>
                  </div>
                </div>
                <DetailField
                  label="Created"
                  value={formatDate(wallet.createdAt)}
                />
                <DetailField
                  label="Updated"
                  value={formatDate(wallet.updatedAt)}
                />
              </div>

              {stats && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">
                    Lifetime stats
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <StatChip label="Purchased" value={stats.totalPurchased} />
                    <StatChip label="Redeemed" value={stats.totalRedeemed} />
                    <StatChip label="Gift sent" value={stats.totalGiftSent} />
                    <StatChip
                      label="Gift received"
                      value={stats.totalGiftReceived}
                    />
                    <StatChip
                      label="Adj. credit"
                      value={stats.adjustmentCredit}
                    />
                    <StatChip
                      label="Adj. debit"
                      value={stats.adjustmentDebit}
                    />
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">
                  Recent transactions
                </h3>
                {recent.length === 0 ? (
                  <p className="text-sm text-gray-500">No recent transactions.</p>
                ) : (
                  <ul className="space-y-2">
                    {recent.map((tx) => (
                      <li
                        key={tx._id}
                        className="border rounded-lg p-3 bg-gray-50 text-sm"
                      >
                        <div className="flex justify-between gap-2">
                          <span className="font-medium">{tx.type}</span>
                          <span
                            className={
                              tx.direction === "credit"
                                ? "text-green-700 font-semibold"
                                : "text-red-700 font-semibold"
                            }
                          >
                            {tx.direction === "credit" ? "+" : "-"}
                            {formatNumber(tx.amount)}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-1">{tx.description}</p>
                        <div className="flex gap-2 mt-1 text-xs text-gray-500">
                          <StatusBadge tone={statusToneFrom(tx.status)}>
                            {tx.status}
                          </StatusBadge>
                          <span>{formatDate(tx.createdAt)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Button size="sm" onClick={() => setShowAdjust(true)}>
                  Adjust sparks
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowStatus(true)}
                >
                  Change status
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {showAdjust && wallet && (
        <AdjustSparksForm
          userId={wallet.userId}
          currentBalance={wallet.sparks}
          onClose={() => setShowAdjust(false)}
          onSuccess={async () => {
            setShowAdjust(false);
            await loadDetails();
            onUpdated();
          }}
        />
      )}

      {showStatus && wallet && (
        <ChangeStatusForm
          userId={wallet.userId}
          currentStatus={wallet.status}
          onClose={() => setShowStatus(false)}
          onSuccess={async () => {
            setShowStatus(false);
            await loadDetails();
            onUpdated();
          }}
        />
      )}
    </div>
  );
};

const DetailField: React.FC<{
  label: string;
  value: string;
  mono?: boolean;
}> = ({ label, value, mono }) => (
  <div>
    <label className="text-sm font-semibold text-gray-700">{label}</label>
    <p
      className={`mt-1 text-black font-medium text-sm break-all ${mono ? "font-mono text-xs" : ""}`}
    >
      {value}
    </p>
  </div>
);

const StatChip: React.FC<{ label: string; value: number }> = ({
  label,
  value,
}) => (
  <div className="rounded-lg border bg-gray-50 px-3 py-2">
    <p className="text-xs text-gray-500">{label}</p>
    <p className="font-semibold text-gray-900">{formatNumber(value)}</p>
  </div>
);

const AdjustSparksForm: React.FC<{
  userId: string;
  currentBalance: number;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ userId, currentBalance, onClose, onSuccess }) => {
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<TransactionDirection>("credit");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(amount);
    if (!parsed || parsed <= 0) {
      setError("Amount must be a positive number");
      return;
    }
    if (!reason.trim()) {
      setError("Reason is required");
      return;
    }

    const ok = await confirm({
      title: `${direction === "credit" ? "Credit" : "Debit"} ${parsed} sparks?`,
      description: `This will ${direction} ${parsed} sparks for this wallet (current balance: ${currentBalance}). Reason: ${reason}`,
      confirmText: direction === "credit" ? "Credit" : "Debit",
      variant: direction === "debit" ? "destructive" : "default",
    });
    if (!ok) return;

    try {
      setSubmitting(true);
      setError(null);
      await adjustSparks({
        userId,
        amount: parsed,
        direction,
        reason: reason.trim(),
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Adjustment failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4"
      >
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold">Adjust sparks</h3>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-700">Direction</label>
          <select
            className="mt-1 w-full h-9 rounded-md border border-input px-3 text-sm"
            value={direction}
            onChange={(e) =>
              setDirection(e.target.value as TransactionDirection)
            }
          >
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Amount</label>
          <Input
            type="number"
            min="1"
            step="1"
            className="mt-1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Reason</label>
          <Input
            className="mt-1"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Support compensation…"
            required
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Submit"}
          </Button>
        </div>
      </form>
    </div>
  );
};

const ChangeStatusForm: React.FC<{
  userId: string;
  currentStatus: WalletStatus;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ userId, currentStatus, onClose, onSuccess }) => {
  const [status, setStatus] = useState<WalletStatus>(currentStatus);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === currentStatus) {
      setError("Choose a different status");
      return;
    }
    if (!reason.trim()) {
      setError("Reason is required");
      return;
    }

    const destructive = status === "suspended" || status === "closed";
    const ok = await confirm({
      title: `Set wallet to ${status}?`,
      description: `Current status: ${currentStatus}. Reason: ${reason}`,
      confirmText: "Update status",
      variant: destructive ? "destructive" : "default",
    });
    if (!ok) return;

    try {
      setSubmitting(true);
      setError(null);
      await updateWalletStatus(userId, {
        status,
        reason: reason.trim(),
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4"
      >
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold">Change wallet status</h3>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <p className="text-sm text-gray-500">
          Current status:{" "}
          <span className="font-medium text-gray-800">{currentStatus}</span>
        </p>

        <div>
          <label className="text-sm font-medium text-gray-700">New status</label>
          <select
            className="mt-1 w-full h-9 rounded-md border border-input px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as WalletStatus)}
          >
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Reason</label>
          <Input
            className="mt-1"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is status changing?"
            required
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Update"}
          </Button>
        </div>
      </form>
    </div>
  );
};

const LedgerTab: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState("");
  const [type, setType] = useState<TransactionType | "">("");
  const [status, setStatus] = useState<TransactionStatus | "">("");
  const [direction, setDirection] = useState<TransactionDirection | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [applied, setApplied] = useState({
    userId: "",
    type: "" as TransactionType | "",
    status: "" as TransactionStatus | "",
    direction: "" as TransactionDirection | "",
    startDate: "",
    endDate: "",
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTransactions({
        userId: applied.userId || undefined,
        type: applied.type || undefined,
        status: applied.status || undefined,
        direction: applied.direction || undefined,
        startDate: applied.startDate || undefined,
        endDate: applied.endDate || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setTransactions(data.transactions || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load transactions"
      );
    } finally {
      setLoading(false);
    }
  }, [applied, page, refreshKey]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const applyFilters = () => {
    setApplied({
      userId,
      type,
      status,
      direction,
      startDate,
      endDate,
    });
    setPage(1);
  };

  const clearFilters = () => {
    setUserId("");
    setType("");
    setStatus("");
    setDirection("");
    setStartDate("");
    setEndDate("");
    setApplied({
      userId: "",
      type: "",
      status: "",
      direction: "",
      startDate: "",
      endDate: "",
    });
    setPage(1);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (applied.userId) count += 1;
    if (applied.type) count += 1;
    if (applied.status) count += 1;
    if (applied.direction) count += 1;
    if (applied.startDate) count += 1;
    if (applied.endDate) count += 1;
    return count;
  }, [applied]);

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-xl border border-rs-border bg-rs-surface px-4 py-3 text-sm text-rs-text">
          {error}
        </div>
      ) : null}

      <TableCard
        title="Transaction ledger"
        description={`${total} transaction${total === 1 ? "" : "s"}`}
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
                  className="h-8 text-xs"
                  placeholder="User ID"
                />
              </FilterField>
              <FilterField label="Type">
                <select
                  className={cn(tableControlClassName, "w-full")}
                  value={type}
                  onChange={(e) =>
                    setType(e.target.value as TransactionType | "")
                  }
                >
                  <option value="">All types</option>
                  {TRANSACTION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </FilterField>
              <FilterField label="Status">
                <select
                  className={cn(tableControlClassName, "w-full")}
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as TransactionStatus | "")
                  }
                >
                  <option value="">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </FilterField>
              <FilterField label="Direction">
                <select
                  className={cn(tableControlClassName, "w-full")}
                  value={direction}
                  onChange={(e) =>
                    setDirection(e.target.value as TransactionDirection | "")
                  }
                >
                  <option value="">All directions</option>
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </select>
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
              aria-label="Refresh transactions"
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
            itemLabel="transactions"
            onPageChange={setPage}
          />
        }
      >
        <div className="hidden md:block">
          <Table variant="plain">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableEmpty colSpan={7}>Loading transactions…</TableEmpty>
              ) : transactions.length === 0 ? (
                <TableEmpty colSpan={7}>No transactions found</TableEmpty>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx._id}>
                    <TableCell className="whitespace-nowrap text-xs text-rs-text-muted">
                      {formatDate(tx.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium text-rs-text">
                      {tx.type}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          tx.direction === "credit"
                            ? "text-rs-success"
                            : "text-rs-text-muted"
                        }
                      >
                        {tx.direction}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-rs-text">
                      {formatNumber(tx.amount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={statusToneFrom(tx.status)}>
                        {tx.status}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="max-w-[8rem] truncate font-mono text-xs">
                      {tx.userId}
                    </TableCell>
                    <TableCell className="max-w-[12rem] truncate text-xs">
                      {tx.description}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="divide-y divide-rs-border md:hidden">
          {loading ? (
            <p className="p-4 text-center text-sm text-rs-text-muted">
              Loading transactions…
            </p>
          ) : transactions.length === 0 ? (
            <p className="p-4 text-center text-sm text-rs-text-muted">
              No transactions found
            </p>
          ) : (
            transactions.map((tx) => (
              <div key={tx._id} className="space-y-1 p-3">
                <div className="flex justify-between gap-2">
                  <span className="text-sm font-medium text-rs-text">
                    {tx.type}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      tx.direction === "credit"
                        ? "text-rs-success"
                        : "text-rs-text-muted"
                    }`}
                  >
                    {tx.direction === "credit" ? "+" : "-"}
                    {formatNumber(tx.amount)}
                  </span>
                </div>
                <p className="text-sm text-rs-text-secondary">{tx.description}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-rs-text-muted">
                  <StatusBadge tone={statusToneFrom(tx.status)}>
                    {tx.status}
                  </StatusBadge>
                  <span>{formatDate(tx.createdAt)}</span>
                  <span className="truncate font-mono">{tx.userId}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </TableCard>
    </div>
  );
};

export default Sparks;
