import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { InlineAlert } from "@/components/ui/inline-alert";
import { cn } from "@/lib/utils";
import { getAuthHeaders, handleUnauthorized, validateToken } from "../utils/api";
import { API_URL } from "@/config/api";
import { confirm } from "@/lib/confirm";

type Platform = "android" | "ios";

const isValidVersion = (v: string) =>
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(v);

/** Abstract “version gate” graphic — same language as Cloudflare’s domain card. */
function VersionIllustration() {
  return (
    <div
      className="relative overflow-hidden rounded-lg border border-rs-border bg-rs-page px-5 py-8"
      aria-hidden
    >
      <div className="mx-auto flex w-full max-w-[220px] flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inset-0 rounded-full bg-rs-primary/20" />
            <span className="relative m-auto h-2 w-2 rounded-full bg-rs-primary" />
          </span>
          <div className="h-2 flex-1 rounded-full bg-rs-border" />
          <div className="h-2 w-8 rounded-full bg-rs-border/70" />
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-rs-border bg-rs-surface text-rs-primary">
            <Plus className="h-3 w-3" strokeWidth={2.5} />
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-rs-border bg-rs-surface" />
          <div className="h-2 w-[58%] rounded-full bg-rs-border/80" />
          <span className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-rs-border bg-rs-surface text-rs-text-muted">
            <Plus className="h-3 w-3" strokeWidth={2.5} />
          </span>
        </div>
      </div>
    </div>
  );
}

function PlatformCard({
  label,
  description,
  current,
  value,
  loading,
  onChange,
  onSave,
}: {
  label: string;
  description: string;
  current: string;
  value: string;
  loading: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
}) {
  const trimmed = value.trim();
  const dirty = trimmed !== current;
  const valid = isValidVersion(trimmed);
  const canSave = dirty && valid && !loading;
  const showHint = dirty && !valid && trimmed.length > 0;

  return (
    <div className="flex flex-col rounded-xl border border-rs-border bg-rs-surface p-3 rs-transition hover:border-rs-text-muted/25">
      <VersionIllustration />

      <div className="flex flex-1 flex-col gap-4 px-2 pb-2 pt-4">
        <div className="space-y-1.5">
          <h3 className="text-sm font-semibold tracking-tight text-rs-text">
            {label}
          </h3>
          <p className="text-xs leading-relaxed text-rs-text-muted">
            {description}
          </p>
        </div>

        <form
          className="mt-auto space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSave) onSave();
          }}
        >
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type minimum version…"
            aria-label={`${label} minimum version`}
            className={cn(
              "h-10 font-mono text-sm",
              "focus-visible:border-rs-text-muted/40 focus-visible:ring-rs-text-muted/20",
            )}
            autoComplete="off"
            spellCheck={false}
          />

          <div
            className={cn(
              "flex min-h-8 items-center justify-between gap-3 rs-transition",
              dirty ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            <p
              className={cn(
                "text-[11px] rs-transition",
                showHint ? "text-rs-primary" : "text-rs-text-muted",
              )}
            >
              {showHint
                ? "Use x.y.z (e.g. 1.2.0)"
                : current
                  ? `Currently ${current}`
                  : "\u00a0"}
            </p>
            <Button
              type="submit"
              variant={canSave ? "default" : "outline"}
              size="sm"
              disabled={!canSave}
              tabIndex={dirty ? 0 : -1}
            >
              {loading ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

const AppVersionControl: React.FC = () => {
  useEffect(() => {
    validateToken();
  }, []);

  const [androidVersion, setAndroidVersion] = useState("");
  const [iosVersion, setIosVersion] = useState("");
  const [androidInput, setAndroidInput] = useState("");
  const [iosInput, setIosInput] = useState("");
  const [androidLoading, setAndroidLoading] = useState(false);
  const [iosLoading, setIosLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersions = async () => {
      if (!validateToken()) return;
      try {
        const response = await fetch(`${API_URL}/admin/minimum-app-version`, {
          method: "GET",
          headers: getAuthHeaders(),
        });

        if (response.status === 401) {
          return handleUnauthorized(response);
        }

        if (!response.ok) return;

        const data = await response.json();
        setAndroidVersion(data.android);
        setIosVersion(data.ios);
        setAndroidInput(data.android);
        setIosInput(data.ios);
      } catch {
        // silently fail — form inputs remain empty
      }
    };

    fetchVersions();
  }, []);

  const handleSave = async (platform: Platform) => {
    if (!validateToken()) return;

    const version = platform === "android" ? androidInput : iosInput;
    const setLoading =
      platform === "android" ? setAndroidLoading : setIosLoading;
    const platformLabel = platform === "android" ? "Android" : "iOS";

    if (!isValidVersion(version.trim())) {
      setError("Invalid version format. Use x.y.z (e.g., 1.2.0)");
      return;
    }

    const confirmed = await confirm({
      title: `Update ${platformLabel} minimum version`,
      description: `Set the minimum ${platformLabel} version to ${version.trim()}? Users on older builds will be forced to update.`,
      confirmText: "Update version",
    });
    if (!confirmed) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/admin/minimum-app-version`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ version: version.trim(), platform }),
      });

      if (response.status === 401) {
        return handleUnauthorized(response);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update version");
      }

      if (platform === "android") setAndroidVersion(version.trim());
      else setIosVersion(version.trim());

      toast.success(
        `${platformLabel} minimum version updated to ${version.trim()}`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update version",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="App Version Control"
        description="Set the minimum Android and iOS builds allowed to use the app. Older clients are forced to update."
      />

      {error ? (
        <InlineAlert variant="error" onDismiss={() => setError(null)}>
          {error}
        </InlineAlert>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <PlatformCard
          label="Android"
          description="Users on Android builds below this version must update before opening the app."
          current={androidVersion}
          value={androidInput}
          loading={androidLoading}
          onChange={setAndroidInput}
          onSave={() => handleSave("android")}
        />
        <PlatformCard
          label="iOS"
          description="Users on iOS builds below this version must update before opening the app."
          current={iosVersion}
          value={iosInput}
          loading={iosLoading}
          onChange={setIosInput}
          onSave={() => handleSave("ios")}
        />
      </div>
    </div>
  );
};

export default AppVersionControl;
