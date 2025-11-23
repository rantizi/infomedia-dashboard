import Image from "next/image";
import Link from "next/link";

import Aurora from "@/components/Aurora";

const auroraColors = ["#FFD700", "#60A5FA", "#EF4444"];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-slate-900">
      <div className="pointer-events-none absolute inset-0 opacity-100">
        <Aurora colorStops={auroraColors} speed={0.12} blend={0.65} amplitude={1.15} />
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/50 to-white/70" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex justify-center px-6 py-6">
          <div className="flex w-full max-w-5xl items-center justify-between rounded-full border border-slate-200 bg-white px-5 py-3 shadow-[0_16px_60px_-40px_rgba(15,23,42,0.45)]">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo/infomedia.png"
                alt="Infomedia Nusantara"
                width={140}
                height={36}
                className="h-9 w-auto object-contain"
                priority
              />
              <span className="text-lg font-semibold tracking-tight text-slate-900">Infomedia</span>
            </Link>
            <nav className="flex items-center gap-3 text-sm font-semibold text-slate-900">
              <Link
                className="rounded-full border border-slate-200 px-4 py-2 transition hover:border-slate-300 hover:bg-slate-50"
                href="/login"
              >
                Login
              </Link>
              <Link
                className="rounded-full border border-slate-200 px-4 py-2 transition hover:border-slate-300 hover:bg-slate-50"
                href="/signup"
              >
                Sign Up
              </Link>
            </nav>
          </div>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
          <div className="space-y-5">
            <p className="text-xs font-semibold tracking-[0.3em] text-slate-500 uppercase">Infomedia Nusantara</p>
            <h1 className="text-4xl leading-tight font-semibold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
              Kendalikan dashboard funnel penjualan,
              <br className="hidden sm:block" /> cukup dengan satu langkah
            </h1>
            <p className="mx-auto max-w-3xl text-lg text-slate-600">
              Pantau funnel pendapatan, impor data, dan performa kampanye dalam satu dashboard Infomedia. Unggah file
              CSV/Excel, sinkronkan ke workspace, dan jaga tim tetap selaras dengan insight real-time.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:translate-y-[-1px] hover:bg-slate-800 hover:shadow-xl"
              href="/dashboard"
            >
              Get Started
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
