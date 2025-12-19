import type { ReactNode } from "react";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type StatusTone = "info" | "warning" | "danger" | "muted";

const statusToneClasses = new Map<StatusTone, string>([
  [
    "info",
    "border-sky-200/70 bg-white/80 text-slate-900 dark:border-sky-900/50 dark:bg-slate-900/60 dark:text-slate-50",
  ],
  [
    "warning",
    "border-amber-200/80 bg-amber-50/80 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-100",
  ],
  [
    "danger",
    "border-rose-200/70 bg-rose-50/80 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/60 dark:text-rose-100",
  ],
  [
    "muted",
    "border-slate-200/70 bg-white/80 text-slate-900 dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-50",
  ],
]);

export function StatusPanel({
  icon: Icon,
  title,
  description,
  tone = "info",
  actions,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: StatusTone;
  actions?: ReactNode;
}) {
  const toneClass = statusToneClasses.get(tone) ?? statusToneClasses.get("info") ?? "";

  return (
    <div className={cn("flex items-start gap-4 rounded-2xl border p-5 shadow-md shadow-slate-900/10", toneClass)}>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/70 text-slate-800 shadow-inner shadow-white/50 dark:bg-slate-950/60 dark:text-slate-50">
        <Icon className="h-5 w-5" />
      </div>
      <div className="space-y-2">
        <div className="text-base font-semibold">{title}</div>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{description}</p>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export function GlassSection({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative rounded-3xl border border-slate-200/60 bg-white/90 p-6 shadow-lg shadow-slate-900/10 dark:border-slate-800/60 dark:bg-slate-900/80",
        className,
      )}
    >
      <div className="relative">{children}</div>
    </div>
  );
}
