"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

type CommandLink = {
  label: string;
  href: string;
};

const dashboardLinks: CommandLink[] = [
  { label: "Overview", href: "/dashboard" },
  { label: "Add Data", href: "/add-data" },
  { label: "Leads (MSDC)", href: "/leads" },
];

const authLinks: CommandLink[] = [
  { label: "Login", href: "/login" },
  { label: "Sign Up", href: "/signup" },
  { label: "Akun", href: "/account" },
];

type GlobalSearchProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type SetOpenState = (value: React.SetStateAction<boolean>) => void;

export function GlobalSearch({ open: controlledOpen, onOpenChange }: GlobalSearchProps) {
  const router = useRouter();
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback<SetOpenState>(
    (next) => {
      const nextValue = typeof next === "function" ? (next as (prev: boolean) => boolean)(open) : next;
      if (isControlled) {
        onOpenChange?.(nextValue);
      } else {
        setUncontrolledOpen(nextValue);
      }
    },
    [isControlled, onOpenChange, open],
  );

  const handleSelect = React.useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router, setOpen],
  );

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setOpen]);

  const groups: { heading: string; items: CommandLink[] }[] = [
    { heading: "Dashboard", items: dashboardLinks },
    { heading: "Autentikasi", items: authLinks },
  ];

  const itemClassName =
    "cursor-pointer px-3 py-2 text-sm transition-colors hover:bg-red-50 hover:text-red-700 data-[selected=true]:bg-red-100 data-[selected=true]:text-red-800 dark:hover:bg-red-900/40 dark:hover:text-red-100 dark:data-[selected=true]:bg-red-900/60 dark:data-[selected=true]:text-red-100";

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Cari Dashboard, halaman..." />
      <CommandList>
        <CommandEmpty>Tidak ada hasil.</CommandEmpty>
        {groups.map((group, index) => (
          <React.Fragment key={group.heading}>
            {index > 0 && <CommandSeparator />}
            <CommandGroup heading={group.heading}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.href}
                  value={item.label}
                  onSelect={() => handleSelect(item.href)}
                  className={itemClassName}
                >
                  <span>{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </React.Fragment>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
