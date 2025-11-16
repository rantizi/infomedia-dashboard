'use client';

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type SignupFields = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type FieldErrors = Partial<Record<keyof SignupFields, string>>;

const initialState: SignupFields = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState<SignupFields>(initialState);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (state: SignupFields): FieldErrors => {
    const nextErrors: FieldErrors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!state.fullName.trim()) {
      nextErrors.fullName = "Please share your name.";
    }

    if (!emailPattern.test(state.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (state.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    if (state.password !== state.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    return nextErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);
    setStatus(null);

    const validationErrors = validate(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName.trim(),
          },
        },
      });

      if (error) {
        setServerError(error.message);
        return;
      }

      setStatus("Account created! Redirecting to your dashboard…");
      router.push("/dashboard");
    } catch (signupError) {
      const fallback =
        signupError instanceof Error
          ? signupError.message
          : "Unexpected error.";
      setServerError(fallback);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof SignupFields) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="auth-card">
      <div className="auth-card-header">
        <h2 className="auth-title">Create an account</h2>
        <p className="auth-subtitle">
          Invite your sales team and keep every funnel healthy.
        </p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-input-group">
          <label className="auth-label" htmlFor="fullName">
            Full name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            className="auth-input"
            placeholder="Jordan Salesleader"
            value={form.fullName}
            onChange={(event) => handleChange("fullName")(event.target.value)}
            autoComplete="name"
            required
          />
          {errors.fullName ? (
            <p className="auth-error-inline" role="alert">
              {errors.fullName}
            </p>
          ) : null}
        </div>

        <div className="auth-input-group">
          <label className="auth-label" htmlFor="signup-email">
            Email address
          </label>
          <input
            id="signup-email"
            name="email"
            type="email"
            className="auth-input"
            placeholder="you@infomedia.io"
            value={form.email}
            onChange={(event) => handleChange("email")(event.target.value)}
            autoComplete="email"
            required
          />
          {errors.email ? (
            <p className="auth-error-inline" role="alert">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className="auth-input-group">
          <label className="auth-label" htmlFor="signup-password">
            Password
          </label>
          <input
            id="signup-password"
            name="password"
            type="password"
            className="auth-input"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={(event) => handleChange("password")(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
          {errors.password ? (
            <p className="auth-error-inline" role="alert">
              {errors.password}
            </p>
          ) : null}
        </div>

        <div className="auth-input-group">
          <label className="auth-label" htmlFor="confirmPassword">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            className="auth-input"
            placeholder="Re-enter your password"
            value={form.confirmPassword}
            onChange={(event) =>
              handleChange("confirmPassword")(event.target.value)
            }
            autoComplete="new-password"
            minLength={8}
            required
          />
          {errors.confirmPassword ? (
            <p className="auth-error-inline" role="alert">
              {errors.confirmPassword}
            </p>
          ) : null}
        </div>

        {serverError ? (
          <p className="auth-error" role="alert" aria-live="assertive">
            {serverError}
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
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div className="auth-divider" />

      <p className="auth-meta-link">
        Already have an account?{" "}
        <Link className="auth-link" href="/login">
          Login
        </Link>
      </p>
    </div>
  );
}

