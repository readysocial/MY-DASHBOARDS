import React, { useCallback, useEffect, useState } from "react";
import { Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { confirm } from "@/lib/confirm";
import { validateToken } from "@/utils/api";
import {
  getPricingConfig,
  updatePricingConfig,
} from "@/api/admin/pricing/api";
import type { PricingConfig } from "@/api/admin/pricing/types";

const Pricing: React.FC = () => {
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [pricePerSpark, setPricePerSpark] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [sessionCost, setSessionCost] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    validateToken();
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const pricing = await getPricingConfig();
      setConfig(pricing);
      setPricePerSpark(String(pricing.pricePerSpark));
      setCurrency(pricing.currency);
      setSessionCost(String(pricing.sessionCost));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pricing");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dirty =
    config != null &&
    (Number(pricePerSpark) !== config.pricePerSpark ||
      currency.toUpperCase() !== config.currency.toUpperCase() ||
      Number(sessionCost) !== config.sessionCost);

  const handleSave = async () => {
    const price = Number(pricePerSpark);
    const cost = Number(sessionCost);
    if (!Number.isFinite(price) || price <= 0) {
      setError("Price per spark must be a positive number");
      return;
    }
    if (!Number.isInteger(cost) || cost < 1) {
      setError("Session cost must be a positive integer");
      return;
    }
    if (!currency.trim()) {
      setError("Currency is required");
      return;
    }

    const ok = await confirm({
      title: "Update platform pricing?",
      description: `Price: ${price} ${currency.toUpperCase()} per spark · Session cost: ${cost} spark(s). This affects new top-ups and bookings.`,
      confirmText: "Save",
      variant: "default",
    });
    if (!ok) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const result = await updatePricingConfig({
        pricePerSpark: price,
        currency: currency.trim().toUpperCase(),
        sessionCost: cost,
      });
      setConfig(result.config);
      setPricePerSpark(String(result.config.pricePerSpark));
      setCurrency(result.config.currency);
      setSessionCost(String(result.config.sessionCost));
      setSuccess("Pricing updated.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Pricing"
        description="Spark conversion rate and session cost."
        icon={<Tag strokeWidth={1.75} />}
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="max-w-lg rounded-xl border border-rs-border bg-rs-surface p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-rs-text">
            Conversion & session cost
          </h2>
          <p className="mt-1 text-xs text-rs-text-muted">
            Used for fiat top-ups and booking debits.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-rs-text-muted">Loading…</p>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (dirty && !saving) void handleSave();
            }}
          >
            <div>
              <label className="text-xs font-medium text-rs-text-secondary">
                Price per spark
              </label>
              <Input
                type="number"
                min="1"
                step="1"
                className="mt-1"
                value={pricePerSpark}
                onChange={(e) => setPricePerSpark(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-rs-text-secondary">
                Currency
              </label>
              <Input
                className="mt-1"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-rs-text-secondary">
                Session cost (sparks)
              </label>
              <Input
                type="number"
                min="1"
                step="1"
                className="mt-1"
                value={sessionCost}
                onChange={(e) => setSessionCost(e.target.value)}
              />
            </div>
            {config?.updatedAt && (
              <p className="text-[11px] text-rs-text-muted">
                Last updated {new Date(config.updatedAt).toLocaleString()}
              </p>
            )}
            <Button type="submit" disabled={!dirty || saving} size="sm">
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Pricing;
