import { ReactNode } from "react";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createServerClient } from "@/lib/supabase";
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

import { SidebarLayoutShell } from "./dashboard/_components/sidebar/layout-shell";

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

  const metadata = user.user_metadata as Record<string, unknown>;
  const userData = {
    name: (metadata.full_name as string | undefined) ?? user.email ?? "Pengguna",
    email: user.email ?? "",
    avatar: (metadata.avatar_url as string | undefined) ?? "",
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
    <SidebarLayoutShell
      defaultOpen={defaultOpen}
      sidebarVariant={sidebarVariant}
      sidebarCollapsible={sidebarCollapsible}
      contentLayout={contentLayout}
      navbarStyle={navbarStyle}
      layoutPreferences={layoutPreferences}
      user={userData}
    >
      {children}
    </SidebarLayoutShell>
  );
}
