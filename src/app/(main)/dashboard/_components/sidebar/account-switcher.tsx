"use client";

import { ProfileMenu } from "@/components/profile-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

export function AccountSwitcher({
  user,
}: {
  readonly user: {
    readonly name: string;
    readonly email: string;
    readonly avatar: string;
  };
}) {
  return (
    <ProfileMenu user={user} side="bottom" align="end" sideOffset={4}>
      <Avatar className="size-9 cursor-pointer rounded-lg">
        <AvatarImage src={user.avatar || undefined} alt={user.name} />
        <AvatarFallback className="rounded-lg">{getInitials(user.name)}</AvatarFallback>
      </Avatar>
    </ProfileMenu>
  );
}
