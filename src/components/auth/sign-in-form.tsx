"use client";

import { useActionState } from "react";

import Link from "next/link";

import { useFormStatus } from "react-dom";

import { signIn } from "@/app/(auth)/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="auth-button" type="submit" disabled={pending} aria-busy={pending}>
      {pending ? "Sedang Login..." : "Login"}
    </button>
  );
}

export function SignInForm() {
  const [state, formAction] = useActionState(signIn, undefined);

  return (
    <div className="auth-card">
      <div className="auth-card-header">
        <h2 className="auth-title">Selamat datang kembali</h2>
        <p className="auth-subtitle">Login untuk memantau sales funnel dan KPI.</p>
      </div>

      <form className="auth-form" action={formAction}>
        <div className="auth-input-group">
          <label className="auth-label" htmlFor="email">
            Alamat Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className="auth-input"
            placeholder="you@infomedia.io"
            required
          />
        </div>

        <div className="auth-input-group">
          <div className="auth-field-row">
            <label className="auth-label" htmlFor="password">
              Password
            </label>
            <Link className="auth-link auth-link-small" href="#">
              Lupa Password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="auth-input"
            placeholder="••••••••"
            required
            minLength={5}
          />
        </div>

        {state?.error ? (
          <p className="auth-error" role="alert" aria-live="assertive">
            {state.error}
          </p>
        ) : null}

        <SubmitButton />
      </form>

      <div className="auth-divider" />

      <p className="auth-meta-link">
        Belum punya akun?{" "}
        <Link className="auth-link" href="/signup">
          Sign Up
        </Link>
      </p>
    </div>
  );
}
