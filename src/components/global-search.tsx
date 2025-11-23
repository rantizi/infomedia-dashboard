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
  { label: "Add data", href: "/add-data" },
  { label: "Leads (MSDC)", href: "/leads" },
];

const authLinks: CommandLink[] = [
  { label: "Login", href: "/login" },
  { label: "Sign up", href: "/signup" },
  { label: "Account", href: "/account" },
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
    { heading: "Dashboards", items: dashboardLinks },
    { heading: "Authentication", items: authLinks },
  ];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search dashboards, pages..." />
      <CommandList>
        <CommandEmpty>No result.</CommandEmpty>
        {groups.map((group, index) => (
          <React.Fragment key={group.heading}>
            {index > 0 && <CommandSeparator />}
            <CommandGroup heading={group.heading}>
              {group.items.map((item) => (
                <CommandItem key={item.href} value={item.label} onSelect={() => handleSelect(item.href)}>
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
