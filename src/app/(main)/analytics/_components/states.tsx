"use client";

import Link from "next/link";

import { AlertTriangle, FileQuestion, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StateProps = {
  message: string;
  title?: string;
  className?: string;
};

const BlobIllustration = ({ id }: { id: string }) => (
  <svg className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 opacity-70" viewBox="0 0 200 200">
    <defs>
      <linearGradient id={`${id}-gradient`} x1="0%" x2="100%" y1="0%" y2="100%">
        <stop offset="0%" stopColor="rgba(99,102,241,0.4)" />
        <stop offset="50%" stopColor="rgba(56,189,248,0.35)" />
        <stop offset="100%" stopColor="rgba(16,185,129,0.4)" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#${id}-gradient)`}
      d="M43.7,-59.4C57.7,-54.8,70.1,-48.2,78,-37.2C85.8,-26.3,89,-10.9,88.2,4.6C87.4,20.1,82.6,35.7,73.6,48.1C64.6,60.5,51.4,69.6,37.3,76.6C23.1,83.6,8,88.6,-6.8,96.7C-21.6,104.7,-36.3,115.8,-45.1,110C-54,104.2,-57,81.6,-64.2,63.2C-71.4,44.7,-82.9,30.4,-88.2,13.9C-93.5,-2.7,-92.6,-21.3,-83.7,-34.5C-74.8,-47.8,-57.9,-55.7,-42.2,-59.2C-26.5,-62.7,-13.3,-62,0.5,-62.8C14.3,-63.7,28.7,-66.1,43.7,-59.4Z"
      transform="translate(100 100)"
    />
  </svg>
);

const BaseState = ({
  icon: Icon,
  tone,
  title,
  message,
  hint,
  className,
}: {
  icon: typeof AlertTriangle;
  tone: "muted" | "danger";
  title: string;
  message: string;
  hint?: string;
  className?: string;
}) => (
  <Card
    className={cn(
      "relative overflow-hidden border-none bg-gradient-to-br p-6 shadow-lg",
      tone === "muted" ? "from-slate-50 via-indigo-50 to-white" : "from-amber-50 via-rose-50 to-white",
      className,
    )}
  >
    <BlobIllustration id={tone === "muted" ? "analytics-empty" : "analytics-error"} />
    <div className="relative flex items-start gap-4">
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl border bg-white/80 shadow-sm backdrop-blur",
          tone === "muted" ? "border-indigo-100 text-indigo-600" : "border-rose-100 text-amber-600",
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600">{message}</p>
        {hint ? <p className="text-xs font-medium text-indigo-600">{hint}</p> : null}
      </div>
    </div>
  </Card>
);

export const AnalyticsEmptyState = ({ message, title = "Belum ada data", className }: StateProps) => (
  <BaseState
    icon={FileQuestion}
    tone="muted"
    title={title}
    message={message}
    hint="Unggah data baru melalui halaman Add Data untuk melihat insight di sini."
    className={className}
  />
);

export const AnalyticsErrorState = ({ message, title = "Terjadi kesalahan", className }: StateProps) => (
  <BaseState icon={AlertTriangle} tone="danger" title={title} message={message} className={className} />
);

export const UploadCta = () => (
  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
    <UploadCloud className="h-4 w-4 text-indigo-500" />
    <span>Belum ada data? </span>
    <Button asChild size="sm" variant="outline" className="border-indigo-200 bg-white/80 text-indigo-700">
      <Link href="/add-data">Buka Add Data</Link>
    </Button>
  </div>
);
