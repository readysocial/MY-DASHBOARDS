import React, { useEffect, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { InlineAlert } from "@/components/ui/inline-alert";
import { getAuthHeaders, handleUnauthorized, validateToken } from "../utils/api";
import { API_URL } from "@/config/api";
import { confirm } from "@/lib/confirm";

const fieldLabelClass = "text-[11px] font-medium text-rs-text-muted";

function PasswordField({
  id,
  label,
  value,
  visible,
  onChange,
  onToggleVisible,
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
  onToggleVisible: () => void;
  placeholder: string;
  autoComplete: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={fieldLabelClass}>
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="pr-9 focus-visible:border-rs-text-muted/40 focus-visible:ring-rs-text-muted/20"
          required
          minLength={id === "old-password" ? undefined : 6}
        />
        <button
          type="button"
          onClick={onToggleVisible}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-rs-text-muted hover:text-rs-text rs-transition"
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

const Settings: React.FC = () => {
  useEffect(() => {
    validateToken();
  }, []);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setFormError(null);
    setPasswordFormData({
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const closeModal = () => {
    setShowChangePassword(false);
    resetForm();
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateToken()) return;

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setFormError("New passwords do not match");
      return;
    }

    if (passwordFormData.newPassword.length < 6) {
      setFormError("New password must be at least 6 characters long");
      return;
    }

    if (!passwordFormData.oldPassword) {
      setFormError("Please enter your current password");
      return;
    }

    const confirmed = await confirm({
      title: "Change password",
      description: "Are you sure you want to change your admin password?",
      confirmText: "Change password",
    });
    if (!confirmed) return;

    setLoading(true);
    setFormError(null);

    try {
      const response = await fetch(`${API_URL}/admin/change-password`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          oldPassword: passwordFormData.oldPassword,
          newPassword: passwordFormData.newPassword,
        }),
      });

      if (response.status === 401) {
        return handleUnauthorized(response);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to change password");
      }

      toast.success("Password changed successfully");
      closeModal();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to change password",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Security Settings"
        description="Manage credentials for this admin account."
      />

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <Lock className="h-4 w-4 text-rs-text-muted" />
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-rs-text">
                Account password
              </p>
              <CardDescription className="max-w-md">
                Use a strong password you don&apos;t reuse elsewhere. At least 6
                characters, with a mix of letters, numbers, and symbols.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 self-start sm:self-center"
              onClick={() => setShowChangePassword(true)}
            >
              Change password
            </Button>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={showChangePassword}
        onClose={closeModal}
        title="Change password"
        description="Enter your current password, then choose a new one."
        footer={
          <>
            <Button type="button" variant="outline" size="sm" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="change-password-form"
              size="sm"
              disabled={loading}
            >
              {loading ? "Saving…" : "Update password"}
            </Button>
          </>
        }
      >
        <form
          id="change-password-form"
          onSubmit={handlePasswordChange}
          className="space-y-4"
        >
          {formError ? (
            <InlineAlert variant="error" onDismiss={() => setFormError(null)}>
              {formError}
            </InlineAlert>
          ) : null}
          <PasswordField
            id="old-password"
            label="Current password"
            value={passwordFormData.oldPassword}
            visible={showOldPassword}
            onChange={(oldPassword) =>
              setPasswordFormData((prev) => ({ ...prev, oldPassword }))
            }
            onToggleVisible={() => setShowOldPassword((v) => !v)}
            placeholder="Current password"
            autoComplete="current-password"
          />
          <PasswordField
            id="new-password"
            label="New password"
            value={passwordFormData.newPassword}
            visible={showNewPassword}
            onChange={(newPassword) =>
              setPasswordFormData((prev) => ({ ...prev, newPassword }))
            }
            onToggleVisible={() => setShowNewPassword((v) => !v)}
            placeholder="At least 6 characters"
            autoComplete="new-password"
          />
          <PasswordField
            id="confirm-password"
            label="Confirm new password"
            value={passwordFormData.confirmPassword}
            visible={showConfirmPassword}
            onChange={(confirmPassword) =>
              setPasswordFormData((prev) => ({ ...prev, confirmPassword }))
            }
            onToggleVisible={() => setShowConfirmPassword((v) => !v)}
            placeholder="Repeat new password"
            autoComplete="new-password"
          />
        </form>
      </Modal>
    </div>
  );
};

export default Settings;
