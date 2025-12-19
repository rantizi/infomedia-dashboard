"use client";

import { useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MESSAGE_STYLES: Record<"success" | "error", string> = {
  success: "rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-800",
  error: "rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700",
};

export const InlineError = ({ message }: { message?: string }) =>
  message ? <p className="text-xs text-red-600">{message}</p> : null;

export const MessageBanner = ({ message, variant }: { message: string | null; variant: "success" | "error" }) =>
  message ? <div className={MESSAGE_STYLES[variant]}>{message}</div> : null;

const InfoRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2">
    <span className="text-sm font-medium text-slate-700">{label}</span>
    <span className="text-sm text-slate-600">{value}</span>
  </div>
);

export function AccountInfoCard({
  email,
  role,
  userId,
  lastSignIn,
}: {
  email: string;
  role: string;
  userId: string;
  lastSignIn: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Akun</CardTitle>
        <CardDescription>Informasi akun hanya-baca.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <InfoRow label="Email" value={email} />
        <InfoRow label="Peran" value={role} />
        <InfoRow label="User ID" value={<code className="text-xs break-all">{userId}</code>} />
        <InfoRow label="Login terakhir" value={lastSignIn} />
      </CardContent>
    </Card>
  );
}

const updatePassword = async (newPassword: string): Promise<string | null> => {
  try {
    const response = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    });

    const payload = (await response.json().catch(() => null)) as { success?: boolean; error?: string } | null;
    return !response.ok || !payload?.success ? (payload?.error ?? "Gagal memperbarui Password.") : null;
  } catch (updatePasswordError) {
    return updatePasswordError instanceof Error ? updatePasswordError.message : "Gagal memperbarui Password.";
  }
};

export function ChangePasswordCard() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  const resetPasswordAlerts = () => {
    setError(null);
    setSuccess(null);
  };
  const clearPasswordValues = () => {
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isEditingPassword) return;

    resetPasswordAlerts();

    const validationMessage =
      newPassword.length < 8
        ? "Password minimal 8 karakter."
        : newPassword !== confirmNewPassword
          ? "Password tidak sama."
          : null;
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setIsSubmitting(true);
    const updateError = await updatePassword(newPassword);
    setIsSubmitting(false);

    if (updateError) {
      setError(updateError);
      return;
    }

    setSuccess("Password berhasil diperbarui.");
    clearPasswordValues();
    setIsEditingPassword(false);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Ubah Password</CardTitle>
        <CardDescription>Gunakan Supabase Auth untuk memperbarui Password Anda.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <MessageBanner message={success} variant="success" />
        <MessageBanner message={error} variant="error" />

        <form className="space-y-3" onSubmit={handleSubmit}>
          {[
            {
              id: "new-password",
              label: "Password baru",
              value: newPassword,
              onChange: setNewPassword,
              placeholder: "Minimal 8 karakter",
            },
            {
              id: "confirm-new-password",
              label: "Konfirmasi Password baru",
              value: confirmNewPassword,
              onChange: setConfirmNewPassword,
              placeholder: "Ketik ulang Password",
            },
          ].map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>{field.label}</Label>
              <Input
                id={field.id}
                type="password"
                minLength={8}
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
                placeholder={field.placeholder}
                required
                disabled={!isEditingPassword}
              />
            </div>
          ))}

          {isEditingPassword ? (
            <div className="flex justify-end gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => {
                  clearPasswordValues();
                  resetPasswordAlerts();
                  setIsEditingPassword(false);
                }}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} variant="success">
                {isSubmitting ? "Memperbarui..." : "Simpan Perubahan"}
              </Button>
            </div>
          ) : (
            <div className="flex justify-end pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetPasswordAlerts();
                  clearPasswordValues();
                  setIsEditingPassword(true);
                }}
              >
                Ubah Password
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
