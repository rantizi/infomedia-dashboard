import Image from "next/image";
import Link from "next/link";

import Aurora from "@/components/Aurora";
import { Button } from "@/components/ui/button";
import { createServerClient } from "@/lib/supabase";

const auroraColors = ["#FFD700", "#60A5FA", "#EF4444"];

async function getUserDisplayName(): Promise<string | null> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    const { data: profileRow } = await supabase.from("users").select("full_name").eq("id", user.id).maybeSingle();

    const metadata = user.user_metadata as Record<string, unknown>;

    return profileRow?.full_name ?? (metadata.full_name as string | undefined) ?? user.email ?? null;
  } catch {
    // On error or missing env, fall back to unauthenticated rendering.
    return null;
  }
}

export default async function HomePage() {
  const userName = await getUserDisplayName();

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
              {userName ? (
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-red-200 bg-red-50 px-4 py-2 text-red-700 hover:bg-red-100 hover:text-red-800 focus-visible:ring-red-500 dark:border-red-900 dark:bg-red-900/50 dark:text-red-100 dark:hover:bg-red-900/70"
                >
                  <Link href="/dashboard">Halo, {userName}</Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="sm" variant="success" className="rounded-full px-4">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild size="sm" variant="success" className="rounded-full px-4">
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </>
              )}
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
            <Button
              asChild
              className="rounded-full px-7 py-3 text-base font-semibold shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <Link href="/dashboard">Mulai Sekarang</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
