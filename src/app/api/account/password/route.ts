import { NextResponse } from "next/server";

import { z } from "zod";

import { createServerClient } from "@/lib/supabase";
import { createServiceClient } from "@/lib/supabaseClient";

const payloadSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Use service role to update password securely on the server; request user is derived from session cookies.
  const serviceSupabase = createServiceClient();
  const { error: passwordError } = await serviceSupabase.auth.admin.updateUserById(user.id, {
    password: parsed.data.newPassword,
  });

  if (passwordError) {
    console.error("Failed to update password:", passwordError);
    return NextResponse.json({ success: false, error: "Failed to update password." }, { status: 500 });
  }

  // TODO: Add rate limiting and consider notifying the user via email/SMS for password changes.
  return NextResponse.json({ success: true });
}
