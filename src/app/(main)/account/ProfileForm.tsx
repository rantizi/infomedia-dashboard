/* eslint-disable unicorn/filename-case */
"use client";

import { useState, type FormEvent, type ReactNode } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const divisionOptions = ["BIDDING", "MSDC", "SALES", "MARKETING", "OTHER"] as const;
export type Division = (typeof divisionOptions)[number];

const optionalField = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null));

const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Full name is required"),
  phone: optionalField,
  job_title: optionalField,
  division: z.enum(divisionOptions),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

type ProfileFormProps = {
  initialValues: ProfileFormValues;
};

export function ProfileForm({ initialValues }: ProfileFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const defaultValues: ProfileFormValues = {
    ...initialValues,
    phone: initialValues.phone ?? "",
    job_title: initialValues.job_title ?? "",
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setServerError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/account/profile", {
        method: "PUT", // API route only accepts PUT for profile updates.
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const payload = (await response.json().catch(() => null)) as { success?: boolean; error?: string } | null;

      if (!response.ok || !payload?.success) {
        setServerError(payload?.error ?? "Failed to update profile.");
        return;
      }

      setSuccessMessage("Profile updated successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      setServerError(message);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Edit how your profile appears to your team.</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {successMessage && (
            <div className="rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-800">
              {successMessage}
            </div>
          )}
          {serverError && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                {...register("full_name")}
                required
                placeholder="Your full name"
                autoComplete="name"
              />
              {errors.full_name && <p className="text-xs text-red-600">{errors.full_name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} placeholder="+62 812 3456 7890" autoComplete="tel" />
              {errors.phone && <p className="text-xs text-red-600">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_title">Job title</Label>
              <Input
                id="job_title"
                {...register("job_title")}
                placeholder="Account Executive"
                autoComplete="organization-title"
              />
              {errors.job_title && <p className="text-xs text-red-600">{errors.job_title.message}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="division">Division</Label>
              <select
                id="division"
                {...register("division")}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0"
              >
                {divisionOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.division && <p className="text-xs text-red-600">{errors.division.message}</p>}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

type AccountInfoCardProps = {
  email: string;
  role: string;
  userId: string;
  lastSignIn: string;
};

export function AccountInfoCard({ email, role, userId, lastSignIn }: AccountInfoCardProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>Read-only account metadata.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <InfoRow label="Email" value={email} />
        <InfoRow label="Role" value={role} />
        <InfoRow label="User ID" value={<code className="text-xs break-all">{userId}</code>} />
        <InfoRow label="Last sign in" value={lastSignIn} />
      </CardContent>
    </Card>
  );
}

type InfoRowProps = { label: string; value: ReactNode };

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <span className="text-sm text-slate-600">{value}</span>
    </div>
  );
}

export function ChangePasswordCard() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      const payload = (await response.json().catch(() => null)) as { success?: boolean; error?: string } | null;

      if (!response.ok || !payload?.success) {
        setError(payload?.error ?? "Failed to update password.");
        return;
      }

      setSuccess("Password updated successfully.");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (updatePasswordError) {
      const message = updatePasswordError instanceof Error ? updatePasswordError.message : "Failed to update password.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Change password</CardTitle>
        <CardDescription>Use Supabase Auth to update your password.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {success && (
          <div className="rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-800">
            {success}
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              minLength={8}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Minimum 8 characters"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-new-password">Confirm new password</Label>
            <Input
              id="confirm-new-password"
              type="password"
              minLength={8}
              value={confirmNewPassword}
              onChange={(event) => setConfirmNewPassword(event.target.value)}
              placeholder="Retype the password"
              required
            />
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Change password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default ProfileForm;
