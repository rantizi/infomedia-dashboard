import type { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
};

/**
 * Shared layout for the auth route group. Provides a soft, welcoming canvas
 * and a split-screen presentation so every auth page feels consistent.
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-root">
      <div className="auth-center" aria-live="polite">
        {children}
      </div>
    </div>
  );
}

