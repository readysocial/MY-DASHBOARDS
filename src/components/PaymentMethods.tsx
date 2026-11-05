import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { InlineAlert } from "@/components/ui/inline-alert";
import { confirm } from "@/lib/confirm";
import { validateToken } from "@/utils/api";
import {
  getPaymentMethodsConfig,
  updatePaymentMethodsConfig,
} from "@/api/admin/payment-methods/api";
import type {
  PaymentMethodCatalogEntry,
  PaymentMethodsConfig,
  PaymentPlatform,
} from "@/api/admin/payment-methods/types";

const PLATFORM_LABELS: Record<PaymentPlatform, string> = {
  android: "Android",
  ios: "iOS",
  web: "Website",
};

const PLATFORM_HINTS: Record<PaymentPlatform, string> = {
  android: "Checked when an Android user taps Top up.",
  ios: "iOS users top up on the web from Settings. This list is ready for future builds.",
  web: "Shown as the provider list on readysocial.live/spark-bundle.",
};

const FALLBACK_HINT: Record<PaymentPlatform, string> = {
  android: "the website",
  ios: "the website",
  web: "Paystack",
};

const sameConfig = (
  a: PaymentMethodsConfig | null,
  b: PaymentMethodsConfig | null,
) => JSON.stringify(a) === JSON.stringify(b);

const PaymentMethods: React.FC = () => {
  const [config, setConfig] = useState<PaymentMethodsConfig | null>(null);
  const [saved, setSaved] = useState<PaymentMethodsConfig | null>(null);
  const [catalog, setCatalog] = useState<PaymentMethodCatalogEntry[]>([]);
  const [platforms, setPlatforms] = useState<PaymentPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    validateToken();
  }, []);

  const applyResponse = useCallback(
    (response: {
      paymentMethods: PaymentMethodsConfig;
      platforms: PaymentPlatform[];
      catalog: PaymentMethodCatalogEntry[];
    }) => {
      setConfig(response.paymentMethods);
      setSaved(response.paymentMethods);
      setPlatforms(response.platforms);
      setCatalog(response.catalog);
    },
    [],
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      applyResponse(await getPaymentMethodsConfig());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load payment methods",
      );
    } finally {
      setLoading(false);
    }
  }, [applyResponse]);

  useEffect(() => {
    load();
  }, [load]);

  const updatePlatform = (
    platform: PaymentPlatform,
    next: PaymentMethodsConfig[PaymentPlatform],
  ) => {
    setConfig((current) =>
      current ? { ...current, [platform]: next } : current,
    );
  };

  const move = (platform: PaymentPlatform, index: number, direction: -1 | 1) => {
    if (!config) return;
    const next = [...config[platform]];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    updatePlatform(platform, next);
  };

  const remove = (platform: PaymentPlatform, index: number) => {
    if (!config) return;
    updatePlatform(
      platform,
      config[platform].filter((_, i) => i !== index),
    );
  };

  const add = (platform: PaymentPlatform, id: PaymentMethodCatalogEntry["id"]) => {
    if (!config || config[platform].includes(id)) return;
    updatePlatform(platform, [...config[platform], id]);
  };

  const dirty = !sameConfig(config, saved);

  const handleSave = async () => {
    if (!config) return;

    const ok = await confirm({
      title: "Update payment methods?",
      description:
        "This changes the default method for new top-ups and the provider list on the website. Existing payment links are not affected.",
      confirmText: "Save",
      variant: "default",
    });
    if (!ok) return;

    try {
      setSaving(true);
      setError(null);
      const response = await updatePaymentMethodsConfig({
        paymentMethods: config,
      });
      applyResponse(response);
      toast.success("Payment methods updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setConfig(saved);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Methods"
        description="Choose the payment method order for each platform. The first enabled method is the default."
      />

      {error ? (
        <InlineAlert variant="error" onDismiss={() => setError(null)}>
          {error}
        </InlineAlert>
      ) : null}

      {loading || !config ? (
        <p className="text-sm text-rs-text-muted">Loading…</p>
      ) : (
        <div className="space-y-5">
          {platforms.map((platform) => {
            const enabled = config[platform];
            const available = catalog.filter(
              (method) =>
                !enabled.includes(method.id) &&
                !(platform === "web" && method.id === "web"),
            );

            return (
              <section
                key={platform}
                className="rounded-xl border border-rs-border bg-rs-surface p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-rs-text">
                      {PLATFORM_LABELS[platform]}
                    </h2>
                    <p className="mt-1 text-xs text-rs-text-muted">
                      {PLATFORM_HINTS[platform]}
                    </p>
                  </div>
                  <span className="rounded-full border border-rs-border px-2.5 py-1 text-[11px] text-rs-text-muted">
                    {enabled.length} enabled
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  {enabled.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-rs-border px-3 py-4 text-xs text-rs-text-muted">
                      No methods configured. Users will be directed to{" "}
                      {FALLBACK_HINT[platform]}.
                    </p>
                  ) : (
                    enabled.map((id, index) => {
                      const method = catalog.find((item) => item.id === id);
                      return (
                        <div
                          key={id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-rs-border px-3 py-2.5"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rs-page text-[11px] font-semibold text-rs-text-secondary">
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-sm font-medium text-rs-text">
                                  {method?.label ?? id}
                                </span>
                                {index === 0 ? (
                                  <span className="rounded-full bg-rs-blue/10 px-2 py-0.5 text-[10px] font-semibold text-rs-blue">
                                    Default
                                  </span>
                                ) : null}
                                <span className="rounded-full border border-rs-border px-2 py-0.5 text-[10px] text-rs-text-muted">
                                  {method?.kind === "website"
                                    ? "Website"
                                    : "Provider"}
                                </span>
                              </div>
                              {method?.description ? (
                                <p className="mt-0.5 truncate text-xs text-rs-text-muted">
                                  {method.description}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-0.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label={`Move ${method?.label ?? id} up`}
                              disabled={index === 0}
                              onClick={() => move(platform, index, -1)}
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label={`Move ${method?.label ?? id} down`}
                              disabled={index === enabled.length - 1}
                              onClick={() => move(platform, index, 1)}
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-rs-text-muted hover:text-rs-primary"
                              aria-label={`Remove ${method?.label ?? id}`}
                              onClick={() => remove(platform, index)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {available.length > 0 ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-rs-text-muted">Add:</span>
                    {available.map((method) => (
                      <Button
                        key={method.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => add(platform, method.id)}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        {method.label}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={handleSave}
              disabled={!dirty || saving}
              size="sm"
            >
              {saving ? "Saving…" : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={reset}
              disabled={!dirty || saving}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Reset
            </Button>
            {dirty ? (
              <span className="text-xs text-rs-text-muted">
                Unsaved changes
              </span>
            ) : null}
          </div>

          <p className="text-xs text-rs-text-muted">
            If a mobile platform has no methods, users are directed to the
            website. On the website, the fallback provider is Paystack. The
            website cannot use the website method.
          </p>
        </div>
      )}
    </div>
  );
};

export default PaymentMethods;
