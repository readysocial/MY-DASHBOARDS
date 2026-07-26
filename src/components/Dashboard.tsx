import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, Zap, Users, Wallet } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableEmpty,
} from "@/components/ui/table";
import { TableCard } from "@/components/ui/table-card";
import { StatCard } from "@/components/ui/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { InlineAlert } from "@/components/ui/inline-alert";
import { StatusBadge, statusToneFrom } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { colors } from "@/styles/tokens";
import { API_URL } from "@/config/api";
import { getAuthHeaders, handleUnauthorized, validateToken } from "@/utils/api";
import { getDashboardAnalytics } from "@/api/admin/analytics/api";
import type {
  AnalyticsOverview,
  AnalyticsSeriesPoint,
} from "@/api/admin/analytics/types";
import { getPricingConfig } from "@/api/admin/pricing/api";
import type { PricingConfig } from "@/api/admin/pricing/types";

interface RecentSession {
  _id: string;
  user?: { anonymousName?: string | null };
  listener?: { name?: string | null } | null;
  topic?: string;
  topicRef?: { topic?: string };
  time: string;
  status: string;
}

const formatNumber = (n: number | undefined) => (n ?? 0).toLocaleString();

const formatMoney = (
  sparks: number | undefined,
  pricing: PricingConfig | null,
) => {
  if (!pricing || sparks == null) return undefined;
  const amount = sparks * pricing.pricePerSpark;
  return `≈ ${amount.toLocaleString()} ${pricing.currency}`;
};

const formatPeriodLabel = (period: string) => {
  const [y, m] = period.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString(undefined, {
    month: "short",
    year: "2-digit",
  });
};

const Dashboard: React.FC = () => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [series, setSeries] = useState<AnalyticsSeriesPoint[]>([]);
  const [pricing, setPricing] = useState<PricingConfig | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    validateToken();
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [analytics, pricingConfig, sessionsRes] = await Promise.all([
        getDashboardAnalytics(6),
        getPricingConfig().catch(() => null),
        fetch(
          `${API_URL}/sessions/platform/all?limit=10&sortBy=createdAt&sortOrder=desc`,
          {
            headers: getAuthHeaders(),
          },
        ),
      ]);

      setOverview(analytics.overview);
      setSeries(analytics.series || []);
      setPricing(pricingConfig);

      if (sessionsRes.status === 401) {
        handleUnauthorized(sessionsRes);
        return;
      }
      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        const list: RecentSession[] = Array.isArray(sessionsData)
          ? sessionsData
          : sessionsData.sessions || sessionsData.data || [];
        setRecentSessions(list.slice(0, 8));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const chartData = series.map((row) => ({
    name: formatPeriodLabel(row.period),
    sessions: row.sessions,
    purchased: row.sparksPurchased,
    redeemed: row.sparksRedeemed,
  }));

  const rateHint = pricing
    ? `1 spark = ${pricing.pricePerSpark.toLocaleString()} ${pricing.currency}`
    : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={
          rateHint
            ? `Live platform overview — last 6 months. ${rateHint}.`
            : "Live platform overview — last 6 months."
        }
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={load}
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Unspent sparks"
          value={loading ? "…" : formatNumber(overview?.totalSparksNotRedeemed)}
          secondary={
            loading
              ? undefined
              : formatMoney(overview?.totalSparksNotRedeemed, pricing)
          }
          hint="Balance held in active wallets (fiat at current rate)"
        />
        <StatCard
          label="Sparks purchased"
          value={loading ? "…" : formatNumber(overview?.totalPurchased)}
          secondary={
            loading ? undefined : formatMoney(overview?.totalPurchased, pricing)
          }
          hint="Lifetime completed top-ups (fiat at current rate)"
        />
        <StatCard
          label="Total sessions"
          value={loading ? "…" : formatNumber(overview?.totalSessions)}
          hint="All booked sessions on the platform"
        />
        <StatCard
          label="Active users (30d)"
          value={loading ? "…" : formatNumber(overview?.activeUsers30d)}
          hint="Users with a session in the last 30 days"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Activity</CardTitle>
            <CardDescription>
              Sessions booked and sparks purchased / redeemed by month
              {rateHint ? ` · ${rateHint}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] pt-0">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-rs-text-muted">
                Loading chart…
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-rs-text-muted">
                No activity in this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="sessions"
                    name="Sessions"
                    fill={colors.chart.primary}
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="purchased"
                    name="Purchased"
                    fill={colors.chart.secondary}
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="redeemed"
                    name="Redeemed"
                    fill={colors.chart.tertiary}
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spark inventory</CardTitle>
            <CardDescription>Wallet and ledger totals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InventoryRow
              icon={<Wallet className="h-4 w-4" />}
              label="Total wallets"
              value={formatNumber(overview?.totalWalletsCount)}
              loading={loading}
            />
            <InventoryRow
              icon={<Zap className="h-4 w-4" />}
              label="Active wallets"
              value={formatNumber(overview?.activeWalletsCount)}
              loading={loading}
            />
            <InventoryRow
              icon={<Zap className="h-4 w-4" />}
              label="Redeemed (sessions)"
              value={formatNumber(overview?.totalRedeemed)}
              secondary={formatMoney(overview?.totalRedeemed, pricing)}
              loading={loading}
            />
            <InventoryRow
              icon={<Users className="h-4 w-4" />}
              label="Gifted"
              value={formatNumber(overview?.totalGifted)}
              secondary={formatMoney(overview?.totalGifted, pricing)}
              loading={loading}
            />
          </CardContent>
        </Card>
      </div>

      <TableCard
        title="Recent sessions"
        description="Latest bookings across the platform"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/sessions">View all</Link>
          </Button>
        }
      >
        <Table variant="plain">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>User</TableHead>
              <TableHead>Listener</TableHead>
              <TableHead>Topic</TableHead>
              <TableHead>When</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="px-4 py-8">
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-3/4" />
                  </div>
                </TableCell>
              </TableRow>
            ) : recentSessions.length === 0 ? (
              <TableEmpty colSpan={5}>No sessions yet</TableEmpty>
            ) : (
              recentSessions.map((session) => (
                <TableRow key={session._id}>
                  <TableCell className="font-medium">
                    {session.user?.anonymousName || "Anonymous"}
                  </TableCell>
                  <TableCell>{session.listener?.name || "—"}</TableCell>
                  <TableCell className="max-w-[10rem] truncate">
                    {session.topicRef?.topic || session.topic || "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-rs-text-muted">
                    {new Date(session.time).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone={statusToneFrom(session.status)}>
                      {session.status}
                    </StatusBadge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableCard>
    </div>
  );
};

const InventoryRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  secondary?: string;
  loading: boolean;
}> = ({ icon, label, value, secondary, loading }) => (
  <div className="flex items-center justify-between gap-3 border-b border-rs-border pb-2 last:border-0 last:pb-0">
    <div className="flex min-w-0 items-center gap-2 text-rs-text-secondary">
      <span className="shrink-0 text-rs-text-muted">{icon}</span>
      <span className="truncate">{label}</span>
    </div>
    <div className="shrink-0 text-right">
      <p className="font-semibold tabular-nums text-rs-text">
        {loading ? "…" : value}
      </p>
      {secondary && !loading ? (
        <p className="text-[11px] tabular-nums text-rs-text-muted">{secondary}</p>
      ) : null}
    </div>
  </div>
);

export default Dashboard;
