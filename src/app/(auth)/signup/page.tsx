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
type SignupStatus = "idle" | "submitting" | "success" | "error";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="text-xs text-rose-600">{message}</span>;
}

function StatusBanner({ status, errorMessage }: { status: SignupStatus; errorMessage: string | null }) {
  if (errorMessage) {
    return (
      <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</div>
    );
  }

  if (status === "success") {
    return (
      <div className="rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-800">
        Periksa Email Anda untuk verifikasi akun. Akses ke area terbatas harus memeriksa <code>email_verified</code>.
      </div>
    );
  }

  return null;
}

export default function SignupPage() {
  const [status, setStatus] = useState<SignupStatus>("idle");
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
    <div className="w-full max-w-xl rounded-3xl border border-white/40 bg-white/60 p-8 shadow-xl shadow-rose-100/50 backdrop-blur-md sm:p-10">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Buat akun Anda</h1>
        <p className="mt-2 text-sm text-slate-600">
          Bergabunglah dengan Dashboard. Kami akan mengirim Email verifikasi sebelum Anda dapat mengakses konten yang
          terlindungi.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              {...register("email")}
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-full border border-slate-200 bg-white/50 px-4 py-2.5 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
              placeholder="you@example.com"
            />
            <FieldError message={errors.email?.message} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input
              {...register("password")}
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-full border border-slate-200 bg-white/50 px-4 py-2.5 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
              placeholder="Minimal 8 karakter"
            />
            <FieldError message={errors.password?.message} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Nama lengkap</label>
            <input
              {...register("full_name")}
              type="text"
              autoComplete="name"
              required
              className="w-full rounded-full border border-slate-200 bg-white/50 px-4 py-2.5 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
              placeholder="Nama lengkap Anda"
            />
            <FieldError message={errors.full_name?.message} />
          </div>

          {/* Layout Fix: Phone and Job Title aligned side-by-side with equal height */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Nomor telepon (opsional)</label>
            <input
              {...register("phone")}
              type="tel"
              autoComplete="tel"
              className="w-full rounded-full border border-slate-200 bg-white/50 px-4 py-2.5 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
              placeholder="+62 812 3456 7890"
            />
            <FieldError message={errors.phone?.message} />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Jabatan (opsional)</label>
            <input
              {...register("job_title")}
              type="text"
              className="w-full rounded-full border border-slate-200 bg-white/50 px-4 py-2.5 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
              placeholder="Account Executive"
            />
            <FieldError message={errors.job_title?.message} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Divisi</label>
            <div className="relative">
              <select
                {...register("division")}
                required
                className="w-full appearance-none rounded-full border border-slate-200 bg-white/50 px-4 py-2.5 text-sm text-slate-900 transition-all focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
              >
                {divisionOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
            <FieldError message={errors.division?.message} />
          </div>
        </div>

        <StatusBanner errorMessage={errorMessage} status={status} />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition-all hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-rose-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Sedang Sign Up..." : "Sign Up"}
        </button>
      </form>

      <div className="my-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400">ATAU</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <p className="text-center text-sm text-slate-600">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium text-rose-600 hover:text-rose-700 hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}
