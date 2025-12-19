import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { createServerClient } from "@/lib/supabase";

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
    <main className="relative flex h-screen w-full flex-col overflow-hidden bg-gradient-to-br from-rose-50 via-white to-rose-100 text-slate-900 selection:bg-rose-100 selection:text-rose-900">
      {/* Background Elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[20%] -left-[10%] h-[500px] w-[500px] rounded-full bg-rose-200/30 blur-[100px]" />
        <div className="absolute -right-[10%] bottom-[10%] h-[600px] w-[600px] rounded-full bg-rose-100/40 blur-[120px]" />
      </div>

      {/* Header - Relative positioning to take up space */}
      <header className="z-50 w-full flex-none p-6">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <Image
              src="/logo/infomedia.png"
              alt="Infomedia Nusantara"
              width={40}
              height={40}
              className="h-10 w-auto"
              priority
            />
            <span className="text-lg font-bold tracking-tight text-slate-900">Infomedia Nusantara</span>
          </Link>

          {/* User Chip */}
          <nav className="flex items-center gap-3">
            {userName ? (
              <Button
                asChild
                variant="outline"
                className="rounded-full border-rose-100 bg-white/50 px-4 py-2 text-sm font-medium text-slate-700 backdrop-blur-sm transition-all hover:bg-white/80 hover:text-rose-700"
              >
                <Link href="/dashboard">Halo, {userName}</Link>
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-slate-600 hover:bg-rose-50 hover:text-rose-700"
                >
                  <Link href="/login">Login</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="rounded-full bg-rose-600 px-5 text-white shadow-lg shadow-rose-200 transition-all hover:bg-rose-700 hover:shadow-rose-300"
                >
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content - Flex grow to fill remaining space */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-6 pt-4 pb-6 lg:pt-10">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left: Visual / Funnel */}
          <div className="relative flex w-full items-center justify-center lg:justify-start">
            {/* Simplified Funnel/Spotlight Visual */}
            <div className="relative h-[320px] w-full max-w-[320px] sm:h-[400px] sm:max-w-[400px]">
              {/* Abstract shapes representing funnel */}
              <div className="absolute top-1/2 left-1/2 h-[240px] w-[240px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-rose-400 to-rose-600 opacity-20 blur-[50px] sm:h-[300px] sm:w-[300px] sm:blur-[60px]" />

              {/* Funnel Shape */}
              <div className="absolute top-[20%] left-1/2 h-[140px] w-[180px] -translate-x-1/2 bg-gradient-to-b from-rose-500 to-rose-600 opacity-90 shadow-2xl [clip-path:polygon(0_0,100%_0,80%_100%,20%_100%)] sm:h-[180px] sm:w-[220px]" />
              <div className="absolute top-[60%] left-1/2 h-[50px] w-[60px] -translate-x-1/2 rounded-b-2xl bg-rose-700 shadow-xl sm:top-[65%] sm:h-[60px] sm:w-[80px]" />

              {/* Decorative elements */}
              <div className="absolute top-[15%] left-1/2 h-[16px] w-[200px] -translate-x-1/2 rounded-full bg-rose-400/50 blur-md sm:h-[20px] sm:w-[240px]" />
              <div className="absolute top-[30%] right-[10%] h-2 w-2 rounded-full bg-rose-300 shadow-[0_0_10px_rgba(251,113,133,0.6)] sm:h-3 sm:w-3" />
              <div className="absolute bottom-[40%] left-[15%] h-1.5 w-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)] sm:h-2 sm:w-2" />
            </div>
          </div>

          {/* Right: Content Card */}
          <div className="flex w-full justify-center lg:justify-end">
            <div className="relative w-full max-w-lg rounded-3xl border border-white/40 bg-white/60 p-6 shadow-xl shadow-rose-100/50 backdrop-blur-md sm:p-10">
              <h1 className="text-3xl leading-tight font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
                Kendalikan dashboard funnel penjualan,
                <span className="mt-2 block text-rose-600">cukup dengan satu langkah.</span>
              </h1>
              <p className="mt-4 text-base leading-relaxed text-slate-600 sm:mt-6 sm:text-lg">
                Pantau funnel pendapatan, impor data, dan performa kampanye dalam satu dashboard Infomedia. Unggah file
                CSV/Excel, sinkronkan ke workspace, dan jaga tim tetap selaras.
              </p>
              <div className="mt-6 flex flex-wrap gap-4 sm:mt-8">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-rose-600 px-6 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition-all hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-rose-300 sm:px-8 sm:text-base"
                >
                  <Link href="/dashboard">Mulai Sekarang</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
