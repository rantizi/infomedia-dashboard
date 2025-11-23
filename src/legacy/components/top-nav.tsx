"use client";

import * as React from "react";

import { Search } from "lucide-react";

import { GlobalSearch } from "@/components/global-search";

export function TopNav() {
  const [searchOpen, setSearchOpen] = React.useState(false);

  return (
    <header className="bg-background flex items-center justify-between border-b px-4 py-3">
      <div className="text-sm font-semibold">TopNav</div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="bg-card text-muted-foreground hover:border-primary hover:text-foreground focus-visible:ring-ring inline-flex w-64 items-center gap-2 rounded-md border px-3 py-2 text-sm shadow-sm transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          aria-label="Open search"
        >
          <Search className="size-4" />
          <span className="flex-1 text-left">Search dashboards, pages...</span>
          <span className="text-muted-foreground flex items-center gap-1 text-[11px] font-medium">
            <kbd className="rounded border px-1 py-0.5">Ctrl</kbd>
            <span>+</span>
            <kbd className="rounded border px-1 py-0.5">K</kbd>
          </span>
        </button>
        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      </div>
    </header>
  );
}
