import { ReactNode } from "react";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AppSidebar } from "@/app/(main)/dashboard/_components/sidebar/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { createServerClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { getPreference } from "@/server/server-actions";
import {
  SIDEBAR_VARIANT_VALUES,
  SIDEBAR_COLLAPSIBLE_VALUES,
  CONTENT_LAYOUT_VALUES,
  NAVBAR_STYLE_VALUES,
  type SidebarVariant,
  type SidebarCollapsible,
  type ContentLayout,
  type NavbarStyle,
} from "@/types/preferences/layout";

import { AccountSwitcher } from "./dashboard/_components/sidebar/account-switcher";
import { LayoutControls } from "./dashboard/_components/sidebar/layout-controls";
import { SearchDialog } from "./dashboard/_components/sidebar/search-dialog";
import { ThemeSwitcher } from "./dashboard/_components/sidebar/theme-switcher";

export default async function MainLayout({ children }: Readonly<{ children: ReactNode }>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userData = {
    name: user.user_metadata?.full_name ?? user.email ?? "User",
    email: user.email ?? "",
    avatar: user.user_metadata?.avatar_url ?? "",
  };

  const [sidebarVariant, sidebarCollapsible, contentLayout, navbarStylePref] = await Promise.all([
    getPreference<SidebarVariant>("sidebar_variant", SIDEBAR_VARIANT_VALUES, "inset"),
    getPreference<SidebarCollapsible>("sidebar_collapsible", SIDEBAR_COLLAPSIBLE_VALUES, "icon"),
    getPreference<ContentLayout>("content_layout", CONTENT_LAYOUT_VALUES, "centered"),
    getPreference<NavbarStyle>("navbar_style", NAVBAR_STYLE_VALUES, "scroll"),
  ]);

  // Force navbar to always be sticky for main pages (dashboard, add-data, leads)
  const navbarStyle: NavbarStyle = "sticky";

  const layoutPreferences = {
    contentLayout,
    variant: sidebarVariant,
    collapsible: sidebarCollapsible,
    navbarStyle: navbarStylePref, // Keep user preference for LayoutControls display
  };

  return (
    <SidebarProvider defaultOpen={defaultOpen} suppressHydrationWarning>
      <AppSidebar variant={sidebarVariant} collapsible={sidebarCollapsible} user={userData} />
      <SidebarInset
        data-content-layout={contentLayout}
        suppressHydrationWarning
        className={cn(
          "h-svh overflow-x-hidden data-[content-layout=centered]:!mx-auto data-[content-layout=centered]:max-w-screen-2xl",
          // Adds right margin for inset sidebar in centered layout up to 113rem.
          // On wider screens with collapsed sidebar, removes margin and sets margin auto for alignment.
          "max-[113rem]:peer-data-[variant=inset]:!mr-2 min-[101rem]:peer-data-[variant=inset]:peer-data-[state=collapsed]:!mr-auto",
        )}
      >
        <header
          data-navbar-style={navbarStyle}
          suppressHydrationWarning
          className={cn(
            "flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12",
            // Handle sticky navbar style with conditional classes so blur, background, z-index, and rounded corners remain consistent across all SidebarVariant layouts.
            "data-[navbar-style=sticky]:bg-background/50 data-[navbar-style=sticky]:sticky data-[navbar-style=sticky]:top-0 data-[navbar-style=sticky]:z-50 data-[navbar-style=sticky]:overflow-hidden data-[navbar-style=sticky]:rounded-t-[inherit] data-[navbar-style=sticky]:backdrop-blur-md",
          )}
        >
          <div className="flex w-full items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-1 lg:gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
              <SearchDialog />
            </div>
            <div className="flex items-center gap-2">
              <LayoutControls {...layoutPreferences} />
              <ThemeSwitcher />
              <AccountSwitcher user={userData} />
            </div>
          </div>
        </header>
        <div className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
