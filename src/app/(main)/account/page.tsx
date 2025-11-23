import { redirect } from "next/navigation";

import { createServerClient } from "@/lib/supabase";

import ProfileForm, { AccountInfoCard, ChangePasswordCard, type Division, type ProfileFormValues } from "./ProfileForm";

type AccountInfo = {
  email: string;
  role: string;
  userId: string;
  lastSignIn: string;
};

function formatLastSignIn(value: string | null | undefined): string {
  if (!value) return "Not available";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(parsed);
}

// Lint: complex server-side loader kept as-is for now.
// eslint-disable-next-line complexity
export default async function AccountPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    // Redirect unauthenticated users to login; adjust the path if your auth route differs.
    redirect("/login");
  }

  const { data: profileRow } = await supabase.from("users").select("full_name").eq("id", user.id).maybeSingle();

  const tenantId =
    process.env.DEFAULT_TENANT_ID ??
    process.env.SUPABASE_DEFAULT_TENANT_ID ??
    process.env.NEXT_PUBLIC_SUPABASE_DEFAULT_TENANT_ID;

  let membershipQuery = supabase
    .from("memberships")
    .select("role, division, tenant_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1);

  if (tenantId) {
    membershipQuery = membershipQuery.eq("tenant_id", tenantId);
  }

  const { data: membership } = await membershipQuery.maybeSingle();

  const initialProfile: ProfileFormValues = {
    full_name: profileRow?.full_name ?? user.user_metadata?.full_name ?? user.email ?? "",
    phone: (user.user_metadata?.phone as string | undefined) ?? "",
    job_title: (user.user_metadata?.job_title as string | undefined) ?? "",
    division:
      (membership?.division as Division | null) ?? (user.user_metadata?.division as Division | undefined) ?? "OTHER",
  };

  const accountInfo: AccountInfo = {
    email: user.email ?? "",
    role: membership?.role ?? "contributor",
    userId: user.id,
    lastSignIn: formatLastSignIn(user.last_sign_in_at),
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="text-muted-foreground text-sm">Manage your account settings and preferences.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <ProfileForm initialValues={initialProfile} />
        <div className="space-y-6">
          <AccountInfoCard {...accountInfo} />
          <ChangePasswordCard />
        </div>
      </div>
    </div>
  );
}
