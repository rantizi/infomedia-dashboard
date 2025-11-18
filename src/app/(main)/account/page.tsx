import { redirect } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createServerClient } from "@/lib/supabase";
import { getInitials } from "@/lib/utils";

function ProfileInfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 items-center gap-4">
      <span className="text-sm font-medium">{label}</span>
      <span className="text-muted-foreground col-span-2 text-sm">{value}</span>
    </div>
  );
}

async function getUserData() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export default async function AccountPage() {
  const user = await getUserData();
  const avatarUrl = user.user_metadata?.avatar_url ?? undefined;
  const fullName = user.user_metadata?.full_name ?? undefined;
  const displayName = fullName ?? "User";
  const initials = getInitials(fullName ?? user.email ?? "U");
  const role = user.role ?? "User";
  const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "N/A";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="text-muted-foreground text-sm">Manage your account settings and preferences.</p>
      </div>
      <Separator />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your personal information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={avatarUrl} alt={fullName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{displayName}</p>
                <p className="text-muted-foreground text-sm">{user.email}</p>
              </div>
            </div>
            <div className="grid gap-2">
              <ProfileInfoRow label="Email" value={user.email} />
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="text-sm font-medium">Role</span>
                <span className="text-muted-foreground col-span-2 text-sm capitalize">{role}</span>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="text-sm font-medium">User ID</span>
                <span className="text-muted-foreground col-span-2 font-mono text-sm text-xs">{user.id}</span>
              </div>
              <ProfileInfoRow label="Last Sign In" value={lastSignIn} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
