"use client";

import * as React from "react";

import { Search } from "lucide-react";

import { GlobalSearch } from "@/components/global-search";
import { Button } from "@/components/ui/button";

export function SearchDialog() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        variant="link"
        className="text-muted-foreground !px-0 font-normal hover:no-underline"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        <span className="ml-2">Cari</span>
        <kbd className="bg-muted ml-2 inline-flex h-5 items-center gap-1 rounded border px-1.5 text-[10px] font-medium select-none">
          <span className="text-xs">Ctrl</span>
          <span>+</span>
          <span className="text-xs">K</span>
        </kbd>
      </Button>
      <GlobalSearch open={open} onOpenChange={setOpen} />
    </>
  );
}
