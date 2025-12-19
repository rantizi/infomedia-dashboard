"use client";

import { useActionState } from "react";

import Link from "next/link";

import { useFormStatus } from "react-dom";

import { signIn } from "@/app/(auth)/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      className="w-full rounded-full bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition-all hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-rose-300 disabled:cursor-not-allowed disabled:opacity-70"
      type="submit"
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? "Sedang Login..." : "Login"}
    </button>
  );
}

export function SignInForm() {
  const [state, formAction] = useActionState(signIn, undefined);

  return (
    <div className="w-full rounded-3xl border border-white/40 bg-white/60 p-8 shadow-xl shadow-rose-100/50 backdrop-blur-md sm:p-10">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Selamat datang kembali</h2>
        <p className="mt-2 text-sm text-slate-600">Login untuk memantau sales funnel dan KPI.</p>
      </div>

      <form className="space-y-6" action={formAction}>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="email">
            Alamat Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className="w-full rounded-full border border-slate-200 bg-white/50 px-4 py-2.5 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
            placeholder="you@infomedia.io"
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700" htmlFor="password">
              Password
            </label>
            <Link className="text-sm font-medium text-rose-600 hover:text-rose-700 hover:underline" href="#">
              Lupa Password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="w-full rounded-full border border-slate-200 bg-white/50 px-4 py-2.5 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
            placeholder="********"
            required
            minLength={5}
          />
        </div>

        {state?.error ? (
          <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-600" role="alert" aria-live="assertive">
            {state.error}
          </p>
        ) : null}

        <SubmitButton />
      </form>

      <div className="my-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400">ATAU</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <p className="text-center text-sm text-slate-600">
        Belum punya akun?{" "}
        <Link className="font-medium text-rose-600 hover:text-rose-700 hover:underline" href="/signup">
          Sign Up
        </Link>
      </p>
    </div>
  );
}
