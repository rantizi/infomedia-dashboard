import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-white text-black">
      <header className="flex items-center justify-between border-b border-black/10 px-6 py-4">
        <span className="text-lg font-semibold tracking-tight">Infomedia Dashboard</span>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link className="transition hover:text-gray-600 hover:underline" href="/login">
            Login
          </Link>
          <Link
            className="rounded-full border border-black px-4 py-2 transition hover:bg-black hover:text-white"
            href="/signup"
          >
            Sign Up
          </Link>
        </nav>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">Infomedia</p>
          <h1 className="text-4xl font-semibold tracking-tight">Sales Funnel Intelligence</h1>
          <p className="mx-auto max-w-2xl text-base text-gray-600">
            Monitor your revenue funnel, imports, and campaign performance in one clean dashboard. Use your Infomedia
            account to explore live data or start by uploading CSV/Excel files, then sync everything into the workspace.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-black/85"
            href="/dashboard"
          >
            View dashboard
          </Link>
          <Link
            className="rounded-full border border-black px-6 py-3 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
            href="/add-data"
          >
            Add data
          </Link>
        </div>
      </section>
    </main>
  );
}
