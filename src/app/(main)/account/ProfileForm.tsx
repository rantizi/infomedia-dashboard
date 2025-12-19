/* eslint-disable unicorn/filename-case */
"use client";
import { useMemo, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { AccountInfoCard, ChangePasswordCard, InlineError, MessageBanner } from "./account-cards";

export { AccountInfoCard, ChangePasswordCard };

const divisionOptions = ["BIDDING", "MSDC", "SALES", "MARKETING", "OTHER"] as const;
export type Division = (typeof divisionOptions)[number];
const optionalField = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null));

const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Nama lengkap wajib diisi"),
  phone: optionalField,
  job_title: optionalField,
  division: z.enum(divisionOptions),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

const normalizeProfileValues = (values: ProfileFormValues): ProfileFormValues => ({
  ...values,
  phone: values.phone ?? "",
  job_title: values.job_title ?? "",
});

export function ProfileForm({ initialValues }: { initialValues: ProfileFormValues }) {
  const normalizedInitialValues = useMemo(() => normalizeProfileValues(initialValues), [initialValues]);
  const formKey = useMemo(() => JSON.stringify(normalizedInitialValues), [normalizedInitialValues]);
  return <ProfileFormInner key={formKey} initialValues={normalizedInitialValues} />;
}

function ProfileFormInner({ initialValues }: { initialValues: ProfileFormValues }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: initialValues,
  });

  const handleCancelProfileEdit = () => {
    reset(initialValues);
    setIsEditingProfile(false);
    setServerError(null);
    setSuccessMessage(null);
  };

  const onSubmit = async (values: ProfileFormValues) => {
    if (!isEditingProfile) return;

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
        setServerError(payload?.error ?? "Gagal memperbarui profil.");
        return;
      }

      const normalizedValues = normalizeProfileValues(values);
      reset(normalizedValues);
      setIsEditingProfile(false);
      setSuccessMessage("Profil berhasil diperbarui.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan.";
      setServerError(message);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Profil</CardTitle>
        <CardDescription>Ubah tampilan profil Anda untuk tim.</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <MessageBanner message={successMessage} variant="success" />
          <MessageBanner message={serverError} variant="error" />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="full_name">Nama lengkap</Label>
              <Input
                id="full_name"
                {...register("full_name")}
                required
                placeholder="Nama lengkap Anda"
                autoComplete="name"
                disabled={!isEditingProfile}
              />
              <InlineError message={errors.full_name?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Nomor telepon</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="+62 812 3456 7890"
                autoComplete="tel"
                disabled={!isEditingProfile}
              />
              <InlineError message={errors.phone?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_title">Jabatan</Label>
              <Input
                id="job_title"
                {...register("job_title")}
                placeholder="Account Executive"
                autoComplete="organization-title"
                disabled={!isEditingProfile}
              />
              <InlineError message={errors.job_title?.message} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="division">Divisi</Label>
              <select
                id="division"
                {...register("division")}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:opacity-70"
                disabled={!isEditingProfile}
              >
                {divisionOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <InlineError message={errors.division?.message} />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          {isEditingProfile ? (
            <>
              <Button type="button" variant="outline" onClick={handleCancelProfileEdit} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} variant="success">
                {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditingProfile(true);
                setServerError(null);
                setSuccessMessage(null);
              }}
            >
              Ubah Profil
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}

export default ProfileForm;
