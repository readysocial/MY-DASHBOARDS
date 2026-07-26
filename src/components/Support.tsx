import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { InlineAlert } from "@/components/ui/inline-alert";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge, statusToneFrom } from "@/components/ui/status-badge";
import { validateToken } from "@/utils/api";
import { supportLookup } from "@/api/admin/support/api";
import type { SupportLookupResult } from "@/api/admin/support/types";

const Support: React.FC = () => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SupportLookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    validateToken();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) {
      setError("Enter a Spark ID, anonymous name, or payment reference.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSearched(true);
      const data = await supportLookup(q);
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  };

  const hasAny =
    result &&
    (result.users.length > 0 ||
      result.wallets.length > 0 ||
      result.payments.length > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support"
        description="Look up a user by Spark ID, anonymous name, or payment reference."
      />

      <form
        onSubmit={handleSearch}
        className="flex max-w-xl flex-col gap-3 sm:flex-row sm:items-center"
      >
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Spark ID, anonymous name, or payment ref…"
          className="flex-1"
          autoFocus
        />
        <Button type="submit" disabled={loading} size="sm">
          {loading ? "Searching…" : "Search"}
        </Button>
      </form>

      {error ? (
        <InlineAlert variant="error" onDismiss={() => setError(null)}>
          {error}
        </InlineAlert>
      ) : null}

      {searched && !loading && !error && !hasAny && (
        <EmptyState
          title="No matches"
          description={`Nothing found for “${result?.query ?? query}”.`}
        />
      )}

      {result && hasAny && (
        <div className="space-y-4">
          {result.users.length > 0 && (
            <ResultSection
              title="Users"
              description="Anonymous name matches"
              actionHref="/users"
              actionLabel="Open Users"
            >
              <ul className="divide-y divide-rs-border">
                {result.users.map((u) => (
                  <li
                    key={u.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-rs-text">
                        {u.anonymousName || "Anonymous"}
                      </p>
                      <p className="truncate text-xs text-rs-text-muted">
                        {u.email}
                      </p>
                    </div>
                    <StatusBadge tone={u.verified ? "success" : "neutral"}>
                      {u.verified ? "Verified" : "Unverified"}
                    </StatusBadge>
                  </li>
                ))}
              </ul>
            </ResultSection>
          )}

          {result.wallets.length > 0 && (
            <ResultSection
              title="Wallets"
              description="Spark ID matches"
              actionHref="/sparks"
              actionLabel="Open Sparks"
            >
              <ul className="divide-y divide-rs-border">
                {result.wallets.map((w) => (
                  <li
                    key={w.sparkId}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium tabular-nums text-rs-text">
                        {w.sparkId}
                      </p>
                      <p className="truncate text-xs text-rs-text-muted">
                        User {w.userId} · {w.balance.toLocaleString()} sparks
                      </p>
                    </div>
                    <StatusBadge tone={statusToneFrom(w.status)}>
                      {w.status}
                    </StatusBadge>
                  </li>
                ))}
              </ul>
            </ResultSection>
          )}

          {result.payments.length > 0 && (
            <ResultSection
              title="Payments"
              description="Reference matches"
              actionHref="/payments"
              actionLabel="Open Payments"
            >
              <ul className="divide-y divide-rs-border">
                {result.payments.map((p) => (
                  <li
                    key={p.id || p.reference}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium tabular-nums text-rs-text">
                        {p.reference}
                      </p>
                      <p className="truncate text-xs text-rs-text-muted">
                        {p.currency || "NGN"} {p.amount.toLocaleString()}
                        {p.providerReference
                          ? ` · ${p.providerReference}`
                          : ""}
                      </p>
                    </div>
                    <StatusBadge tone={statusToneFrom(p.status)}>
                      {p.status}
                    </StatusBadge>
                  </li>
                ))}
              </ul>
            </ResultSection>
          )}
        </div>
      )}
    </div>
  );
};

const ResultSection: React.FC<{
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
  children: React.ReactNode;
}> = ({ title, description, actionHref, actionLabel, children }) => (
  <div className="rounded-xl border border-rs-border bg-rs-surface p-5">
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold text-rs-text">{title}</h2>
        <p className="mt-0.5 text-xs text-rs-text-muted">{description}</p>
      </div>
      <Button asChild variant="outline" size="sm">
        <Link href={actionHref}>{actionLabel}</Link>
      </Button>
    </div>
    {children}
  </div>
);

export default Support;
