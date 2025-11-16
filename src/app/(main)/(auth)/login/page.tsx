'use client';

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type LoginFields = {
  email: string;
  password: string;
};

const initialState: LoginFields = {
  email: "",
  password: "",
};

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<LoginFields>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus(null);

    // Abort early if form is blank so we do not trigger a Supabase call.
    if (!form.email || !form.password) {
      setError("Please enter both your email and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the browser-safe Supabase client. This helper only reads the
      // NEXT_PUBLIC env vars so it is safe to run inside client components.
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      setStatus("Welcome back! Redirecting to your dashboard…");
      router.push("/dashboard");
    } catch (formError) {
      const fallback =
        formError instanceof Error ? formError.message : "Unexpected error.";
      setError(fallback);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof LoginFields) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="auth-card">
      <div className="auth-card-header">
        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-subtitle">
          Sign in to monitor the sales funnel and KPIs.
        </p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
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
            value={form.email}
            onChange={(event) => handleChange("email")(event.target.value)}
            required
          />
        </div>

        <div className="auth-input-group">
          <div className="auth-field-row">
            <label className="auth-label" htmlFor="password">
              Password
            </label>
            <Link className="auth-link auth-link-small" href="#">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="auth-input"
            placeholder="••••••••"
            value={form.password}
            onChange={(event) => handleChange("password")(event.target.value)}
            required
            minLength={6}
          />
        </div>

        {error ? (
          <p className="auth-error" role="alert" aria-live="assertive">
            {error}
          </p>
        ) : null}

        {status ? (
          <p className="auth-hint" aria-live="polite">
            {status}
          </p>
        ) : null}

        <button
          className="auth-button"
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? "Signing you in..." : "Sign in"}
        </button>
      </form>

      <div className="auth-divider" />

      <p className="auth-meta-link">
        Don&rsquo;t have an account?{" "}
        <Link className="auth-link" href="/signup">
          Sign up
        </Link>
      </p>
    </div>
  );
}

