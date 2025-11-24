"use client";

import { useState } from "react";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { createBrowserClient } from "@/lib/supabaseClient";

const divisionEnum = z.enum(["BIDDING", "MSDC", "SALES", "MARKETING", "OTHER"]);
type Division = z.infer<typeof divisionEnum>;

const optionalField = z
  .string()
  .trim()
  .optional()
  .transform((val) => (val === "" ? undefined : val));

const signupSchema = z.object({
  email: z.string().email("Masukkan Email yang valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  full_name: z.string().trim().min(1, "Nama lengkap wajib diisi"),
  phone: optionalField,
  job_title: optionalField,
  division: divisionEnum,
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { division: "BIDDING" },
  });

  // Lint: keep handler readable without refactor for now.
  // eslint-disable-next-line complexity
  const onSubmit = async (values: SignupFormValues) => {
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          // Configure this redirect URL in your Supabase Auth settings.
          emailRedirectTo: process.env.NEXT_PUBLIC_APP_BASE_URL,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setStatus("error");
        return;
      }

      const userId = data.user?.id;
      if (!userId) {
        setErrorMessage("User berhasil dibuat tetapi tidak ada user id yang diterima dari Supabase.");
        setStatus("error");
        return;
      }

      const response = await fetch("/api/profile/mirror", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          email: values.email,
          full_name: values.full_name,
          phone: values.phone ?? null,
          job_title: values.job_title ?? null,
          division: values.division,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setErrorMessage(payload?.error ?? "Gagal menyinkronkan profil.");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan.";
      setErrorMessage(message);
      setStatus("error");
    }
  };

  const divisionOptions: Division[] = ["BIDDING", "MSDC", "SALES", "MARKETING", "OTHER"];
  const isSubmitting = status === "submitting";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
        <div className="mb-6 space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Buat akun Anda</h1>
          <p className="text-sm text-slate-600">
            Bergabunglah dengan Dashboard. Kami akan mengirim Email verifikasi sebelum Anda dapat mengakses konten yang
            terlindungi.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
              Email
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0"
                placeholder="you@example.com"
              />
              {errors.email && <span className="text-xs text-red-600">{errors.email.message}</span>}
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
              Password
              <input
                {...register("password")}
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0"
                placeholder="Minimal 8 karakter"
              />
              {errors.password && <span className="text-xs text-red-600">{errors.password.message}</span>}
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
              Nama lengkap
              <input
                {...register("full_name")}
                type="text"
                autoComplete="name"
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0"
                placeholder="Nama lengkap Anda"
              />
              {errors.full_name && <span className="text-xs text-red-600">{errors.full_name.message}</span>}
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Nomor telepon (opsional)
              <input
                {...register("phone")}
                type="tel"
                autoComplete="tel"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0"
                placeholder="+62 812 3456 7890"
              />
              {errors.phone && <span className="text-xs text-red-600">{errors.phone.message}</span>}
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Jabatan (opsional)
              <input
                {...register("job_title")}
                type="text"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0"
                placeholder="Account Executive"
              />
              {errors.job_title && <span className="text-xs text-red-600">{errors.job_title.message}</span>}
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
              Divisi
              <select
                {...register("division")}
                required
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0"
              >
                {divisionOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.division && <span className="text-xs text-red-600">{errors.division.message}</span>}
            </label>
          </div>

          {errorMessage && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {/* Protected routes should gate access on email_verified when the user returns after email confirmation. */}
          {status === "success" && (
            <div className="rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-800">
              Periksa Email Anda untuk verifikasi akun. Akses ke area terbatas harus memeriksa{" "}
              <code>email_verified</code>.
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-600 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-green-300 dark:bg-green-600 dark:hover:bg-green-500"
          >
            {isSubmitting ? "Sedang Sign Up..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-slate-900 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
