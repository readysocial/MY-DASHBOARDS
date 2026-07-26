import React, { useEffect, useState, useRef } from "react";
import {
  Send,
  Search,
  X,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { InlineAlert } from "@/components/ui/inline-alert";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { tableControlClassName } from "@/components/ui/table-search";
import { cn } from "@/lib/utils";
import { getAuthHeaders, handleUnauthorized, validateToken } from "../utils/api";
import { API_URL } from "@/config/api";
import { confirm } from "@/lib/confirm";

// Listener targets ("all" and "listeners") are intentionally omitted:
// the backend doesn't deliver to listeners yet — push/email lookups throw
// and in-app rows are orphaned. Re-add once listener notifications are
// supported end-to-end.
type Target = "users" | "active_users" | "inactive_users" | "selected";

interface SelectedUser {
  id: string;
  anonymousName: string;
}

interface NotificationChannelOptions {
  inApp: boolean;
  push: boolean;
  email: boolean;
}

const isTargetSelected = (t: Target | ""): t is Target => t !== "";

const TARGET_LABELS: Record<Target, string> = {
  users: "All users",
  active_users: "Active users (sessions in last 30 days)",
  inactive_users: "Inactive users (no sessions in 30 days)",
  selected: "Selected users",
};

const TITLE_MAX = 80;
const MESSAGE_MAX = 500;

const fieldLabelClass = "text-[11px] font-medium text-rs-text-muted";
const checkboxClass =
  "h-3.5 w-3.5 rounded border-rs-border text-rs-primary focus:ring-rs-primary";

function formHint(
  target: Target | "",
  title: string,
  message: string,
  channels: NotificationChannelOptions,
  selectedCount: number
): string | null {
  if (!target) return "Choose a target audience to continue.";
  if (target === "selected" && selectedCount === 0)
    return "Select at least one user.";
  if (!title.trim()) return "Add a title.";
  if (!message.trim()) return "Add a message.";
  if (!channels.inApp && !channels.push && !channels.email)
    return "Pick at least one delivery channel.";
  return null;
}

const Notifications: React.FC = () => {
  useEffect(() => {
    validateToken();
  }, []);

  const [target, setTarget] = useState<Target | "">("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [channels, setChannels] = useState<NotificationChannelOptions>({
    inApp: true,
    push: false,
    email: false,
  });
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const [sentReceipt, setSentReceipt] = useState<{
    queuedCount: number;
    title: string;
    targetLabel: string;
    channelsLabel: string;
  } | null>(null);

  const buildChannelsLabel = (c: NotificationChannelOptions) =>
    [c.inApp && "In-app", c.push && "Push", c.email && "Email"]
      .filter(Boolean)
      .join(", ");

  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SelectedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (target === "selected") {
      fetchUsers();
    }
  }, [target]);

  const fetchUsers = async () => {
    if (!validateToken()) return;
    try {
      setIsSearching(true);
      const response = await fetch(
        `${API_URL}/users?skip=0&limit=20&sortBy=createdAt&sortOrder=desc`,
        { headers: getAuthHeaders() }
      );
      if (response.status === 401) return handleUnauthorized(response);
      if (!response.ok) return;
      const data = await response.json();
      setSearchResults(
        (data.users || []).map((u: { id: string; anonymousName?: string }) => ({
          id: u.id,
          anonymousName: u.anonymousName || "Anonymous User",
        }))
      );
    } catch {
      // silently fail
    } finally {
      setIsSearching(false);
    }
  };

  const searchUsers = async (term: string) => {
    if (!validateToken()) return;
    if (!term.trim()) {
      fetchUsers();
      return;
    }
    try {
      setIsSearching(true);
      const response = await fetch(
        `${API_URL}/users/search/anonymous-name?anonymousName=${encodeURIComponent(term)}`,
        { headers: getAuthHeaders() }
      );
      if (response.status === 401) return handleUnauthorized(response);
      if (response.status === 404) {
        setSearchResults([]);
        return;
      }
      if (!response.ok) return;
      const data = await response.json();
      const userData = data.users
        ? Array.isArray(data.users)
          ? data.users
          : [data.users]
        : [];
      setSearchResults(
        userData.map((u: { id: string; anonymousName?: string }) => ({
          id: u.id,
          anonymousName: u.anonymousName || "Anonymous User",
        }))
      );
    } catch {
      // silently fail
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchUsers(value), 300);
  };

  const toggleUser = (user: SelectedUser) => {
    setSelectedUsers((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user]
    );
  };

  const removeUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const isFormValid =
    target !== "" &&
    title.trim() &&
    message.trim() &&
    (channels.inApp || channels.push || channels.email) &&
    (target !== "selected" || selectedUsers.length > 0);

  const hint = formHint(
    target,
    title,
    message,
    channels,
    selectedUsers.length
  );

  const handleSend = async () => {
    if (!validateToken() || !isFormValid || !isTargetSelected(target)) return;

    const targetLabel =
      target === "selected"
        ? `${selectedUsers.length} selected user${selectedUsers.length > 1 ? "s" : ""}`
        : TARGET_LABELS[target].toLowerCase();

    const confirmed = await confirm({
      title: "Send bulk notification",
      description: `Send this notification to ${targetLabel}?`,
      confirmText: "Send",
      variant: "default",
    });
    if (!confirmed) return;

    setIsSending(true);
    try {
      const body: {
        title: string;
        message: string;
        channels: NotificationChannelOptions;
        target: Target;
        userIds?: string[];
      } = { title, message, channels, target };
      if (target === "selected") {
        body.userIds = selectedUsers.map((u) => u.id);
      }

      const response = await fetch(`${API_URL}/notifications/send-bulk`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });

      if (response.status === 401) return handleUnauthorized(response);

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to send notifications");
      }

      const queuedCount =
        typeof data?.queuedCount === "number" ? data.queuedCount : 0;
      const receiptTargetLabel =
        target === "selected"
          ? `${selectedUsers.length} selected user${selectedUsers.length === 1 ? "" : "s"}`
          : TARGET_LABELS[target];

      setSentReceipt({
        queuedCount,
        title,
        targetLabel: receiptTargetLabel,
        channelsLabel: buildChannelsLabel(channels),
      });

      setTitle("");
      setMessage("");
      setSelectedUsers([]);
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Failed to send notifications"
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Send in-app, push, or email notices to platform users."
      />

      {errorMessage ? (
        <InlineAlert variant="error" onDismiss={() => setErrorMessage(null)}>
          {errorMessage}
        </InlineAlert>
      ) : null}

      <Card className="max-w-2xl">
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 sm:items-center">
          <div className="min-w-0 space-y-1">
            <CardTitle>Compose</CardTitle>
            <CardDescription>
              Audience, message, then channels — preview updates as you type.
            </CardDescription>
          </div>
          <Button
            onClick={handleSend}
            disabled={isSending || !isFormValid}
            size="sm"
            className="shrink-0"
          >
            <Send className="mr-1.5 h-3.5 w-3.5" />
            {isSending ? "Sending…" : "Send"}
          </Button>
        </CardHeader>

        <CardContent className="space-y-5 p-0">
          <div className="space-y-4 p-4">
            <label className="block space-y-1.5">
              <span className={fieldLabelClass}>Target audience</span>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value as Target)}
                className={cn(tableControlClassName, "h-9 w-full text-sm")}
              >
                <option value="" disabled>
                  Select target audience
                </option>
                {Object.entries(TARGET_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            {target === "selected" ? (
              <div className="space-y-3 rounded-lg border border-rs-border bg-rs-page/40 p-3">
                <p className="text-xs font-medium text-rs-text">
                  Select users
                  <span className="ml-1 font-normal text-rs-text-muted">
                    ({selectedUsers.length} selected)
                  </span>
                </p>

                {selectedUsers.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUsers.map((user) => (
                      <Badge
                        key={user.id}
                        variant="secondary"
                        className="flex items-center gap-1 pr-1"
                      >
                        {user.anonymousName}
                        <button
                          type="button"
                          onClick={() => removeUser(user.id)}
                          className="rounded-full p-0.5 text-rs-text-muted hover:bg-rs-surface hover:text-rs-text"
                          aria-label={`Remove ${user.anonymousName}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : null}

                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-rs-text-muted" />
                  <Input
                    placeholder="Search by name…"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="h-8 pl-8 text-xs"
                  />
                </div>

                <div className="max-h-52 overflow-y-auto rounded-md border border-rs-border bg-rs-surface divide-y divide-rs-border">
                  {isSearching ? (
                    <p className="p-3 text-center text-xs text-rs-text-muted">
                      Searching…
                    </p>
                  ) : searchResults.length === 0 ? (
                    <EmptyState
                      className="py-6"
                      title="No users found"
                      description="Try a different search term."
                    />
                  ) : (
                    searchResults.map((user) => (
                      <label
                        key={user.id}
                        className="flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-rs-page"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.some((u) => u.id === user.id)}
                          onChange={() => toggleUser(user)}
                          className={checkboxClass}
                        />
                        <span className="text-sm text-rs-text">
                          {user.anonymousName}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            ) : null}

            <label className="block space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className={fieldLabelClass}>Title</span>
                <span className="text-[11px] tabular-nums text-rs-text-muted">
                  {title.length}/{TITLE_MAX}
                </span>
              </div>
              <Input
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value.slice(0, TITLE_MAX))
                }
                placeholder="Notification title"
                className="h-9 text-sm"
                maxLength={TITLE_MAX}
              />
            </label>

            <label className="block space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className={fieldLabelClass}>Message</span>
                <span className="text-[11px] tabular-nums text-rs-text-muted">
                  {message.length}/{MESSAGE_MAX}
                </span>
              </div>
              <textarea
                value={message}
                onChange={(e) =>
                  setMessage(e.target.value.slice(0, MESSAGE_MAX))
                }
                rows={4}
                maxLength={MESSAGE_MAX}
                placeholder="Write your notification message…"
                className="w-full resize-y rounded-md border border-rs-border bg-rs-surface px-3 py-2 text-sm text-rs-text placeholder:text-rs-text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </label>

            <fieldset className="space-y-2">
              <legend className={fieldLabelClass}>Delivery channels</legend>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["inApp", "In-app"],
                    ["push", "Push"],
                    ["email", "Email"],
                  ] as const
                ).map(([key, label]) => {
                  const active = channels[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        setChannels((prev) => ({
                          ...prev,
                          [key]: !prev[key],
                        }))
                      }
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium rs-transition",
                        active
                          ? "border-rs-text bg-rs-text text-rs-surface"
                          : "border-rs-border bg-rs-surface text-rs-text-secondary hover:border-rs-text-muted hover:text-rs-text"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>

          <div className="border-t border-rs-border bg-rs-page/50 px-4 py-3">
            <p className={cn(fieldLabelClass, "mb-2")}>Preview</p>
            <div className="rounded-lg border border-rs-border bg-rs-surface px-3 py-3">
              {title.trim() || message.trim() ? (
                <>
                  <p className="text-sm font-medium text-rs-text">
                    {title.trim() || "Untitled"}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-xs text-rs-text-secondary">
                    {message.trim() || "Message preview will appear here."}
                  </p>
                  <p className="mt-2 text-[11px] text-rs-text-muted">
                    {buildChannelsLabel(channels) || "No channels selected"}
                    {target
                      ? ` · ${
                          target === "selected"
                            ? `${selectedUsers.length} user${
                                selectedUsers.length === 1 ? "" : "s"
                              }`
                            : TARGET_LABELS[target]
                        }`
                      : ""}
                  </p>
                </>
              ) : (
                <p className="text-xs text-rs-text-muted">
                  Start typing a title and message to preview the notification.
                </p>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-rs-text-muted">
                {hint ?? "Ready to send."}
              </p>
              <Button
                onClick={handleSend}
                disabled={isSending || !isFormValid}
                size="sm"
              >
                <Send className="mr-1.5 h-3.5 w-3.5" />
                {isSending ? "Sending…" : "Send notification"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={Boolean(sentReceipt)}
        onClose={() => setSentReceipt(null)}
        title={
          sentReceipt?.queuedCount === 0
            ? "No recipients matched"
            : "Notification sent"
        }
        description={
          sentReceipt?.queuedCount === 0
            ? "The audience filter matched 0 users. Adjust the target and try again."
            : `Queued for ${sentReceipt?.queuedCount.toLocaleString()} recipient${
                sentReceipt?.queuedCount === 1 ? "" : "s"
              }.`
        }
        footer={
          <Button type="button" size="sm" onClick={() => setSentReceipt(null)}>
            Done
          </Button>
        }
      >
        {sentReceipt ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-rs-text-muted">
              {sentReceipt.queuedCount === 0 ? (
                <AlertTriangle className="h-4 w-4 text-rs-warning" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-rs-success" />
              )}
              <span className="text-xs">Delivery summary</span>
            </div>
            <dl className="space-y-1.5 rounded-lg border border-rs-border px-3 py-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-rs-text-muted">Audience</dt>
                <dd className="text-right font-medium text-rs-text">
                  {sentReceipt.targetLabel}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-rs-text-muted">Title</dt>
                <dd className="text-right font-medium text-rs-text">
                  {sentReceipt.title}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-rs-text-muted">Channels</dt>
                <dd className="text-right font-medium text-rs-text">
                  {sentReceipt.channelsLabel}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default Notifications;
