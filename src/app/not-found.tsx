"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center space-y-2 text-center">
      <h1 className="text-2xl font-semibold">Halaman tidak ditemukan.</h1>
      <p className="text-muted-foreground">Halaman yang Anda cari tidak dapat ditemukan.</p>
      <Link replace href="/">
        <Button variant="outline">Kembali ke beranda</Button>
      </Link>
    </div>
  );
}
