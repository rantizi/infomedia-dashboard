import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-rose-50 via-white to-rose-100 p-4 text-slate-900 selection:bg-rose-100 selection:text-rose-900">
      {/* Background Elements matching Landing Page */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[20%] -left-[10%] h-[500px] w-[500px] rounded-full bg-rose-200/30 blur-[100px]" />
        <div className="absolute -right-[10%] bottom-[10%] h-[600px] w-[600px] rounded-full bg-rose-100/40 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
