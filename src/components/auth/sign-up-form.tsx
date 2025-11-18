"use client";

import { useActionState } from "react";

import Link from "next/link";

import { useFormStatus } from "react-dom";

import { signUp } from "@/app/(auth)/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="auth-button" type="submit" disabled={pending} aria-busy={pending}>
      {pending ? "Creating account..." : "Sign up"}
    </button>
  );
}

export function SignUpForm() {
  const [state, formAction] = useActionState(signUp, undefined);

  return (
    <div className="auth-card">
      <div className="auth-card-header">
        <h2 className="auth-title">Create an account</h2>
        <p className="auth-subtitle">Sign up to start tracking your sales funnel.</p>
      </div>

      <form className="auth-form" action={formAction}>
        <div className="auth-input-group">
          <label className="auth-label" htmlFor="email">
            Email address
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
          <label className="auth-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            className="auth-input"
            placeholder="••••••••"
            required
            minLength={6}
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
        Already have an account?{" "}
        <Link className="auth-link" href="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
