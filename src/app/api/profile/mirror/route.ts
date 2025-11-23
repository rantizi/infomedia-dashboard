import { NextResponse } from "next/server";

import { z } from "zod";

import { createServerClient } from "@/lib/supabase";
import { createServiceClient } from "@/lib/supabaseClient";

const divisionEnum = z.enum(["BIDDING", "MSDC", "SALES", "MARKETING", "OTHER"]);

const payloadSchema = z.object({
  user_id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().min(1, "Full name is required"),
  phone: z.string().optional().nullable(),
  job_title: z.string().optional().nullable(),
  division: divisionEnum,
});

// eslint-disable-next-line complexity
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const { user_id, email, full_name, phone, job_title, division } = parsed.data;
  const tenantId =
    process.env.DEFAULT_TENANT_ID ??
    process.env.SUPABASE_DEFAULT_TENANT_ID ??
    process.env.NEXT_PUBLIC_SUPABASE_DEFAULT_TENANT_ID;

  if (!tenantId) {
    return NextResponse.json({ error: "DEFAULT_TENANT_ID is not configured" }, { status: 500 });
  }

  // Require an authenticated session and ensure the caller mirrors only themselves.
  const supabaseSession = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabaseSession.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.id !== user_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createServiceClient();

  // Optional: mirror auth metadata to capture latest email verification status.
  const { data: adminUser, error: adminError } = await supabase.auth.admin.getUserById(user_id);
  if (adminError) {
    console.error("Failed to fetch auth user for mirror:", adminError);
  }

  const emailVerified = Boolean(adminUser?.user?.email_confirmed_at);

  const { error: userUpsertError } = await supabase.from("users").upsert(
    [
      {
        id: user_id,
        email,
        full_name,
        email_verified: emailVerified,
      },
    ],
    { onConflict: "id" },
  );

  if (userUpsertError) {
    console.error("Failed to upsert user:", userUpsertError);
    return NextResponse.json({ error: "Failed to upsert user" }, { status: 500 });
  }

  // Mirror profile details into auth metadata for fields not stored in the public.users table.
  const { error: metadataError } = await supabase.auth.admin.updateUserById(user_id, {
    user_metadata: { full_name, phone: phone ?? null, job_title: job_title ?? null, division },
  });

  if (metadataError) {
    console.error("Failed to update auth metadata:", metadataError);
    return NextResponse.json({ error: "Failed to upsert user metadata" }, { status: 500 });
  }

  const { data: existingMembership, error: membershipFetchError } = await supabase
    .from("memberships")
    .select("role")
    .eq("user_id", user_id)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (membershipFetchError) {
    console.error("Failed to fetch membership:", membershipFetchError);
    return NextResponse.json({ error: "Failed to upsert membership" }, { status: 500 });
  }

  const role = existingMembership?.role ?? "contributor";

  const membershipUpsert =
    existingMembership !== null
      ? supabase.from("memberships").update({ role, division }).eq("user_id", user_id).eq("tenant_id", tenantId)
      : supabase.from("memberships").insert([{ user_id, tenant_id: tenantId, role, division }]);

  const { error: membershipUpsertError } = await membershipUpsert;

  if (membershipUpsertError) {
    console.error("Failed to upsert membership:", membershipUpsertError);
    return NextResponse.json({ error: "Failed to upsert membership" }, { status: 500 });
  }

  // TODO: Add rate limiting (e.g., via middleware) to protect from abuse.
  // TODO: Consider CSRF protections. Since this is same-origin POST + JSON, Next.js's defaults help,
  // but you can add a custom token/secret header if exposing cross-site.

  return NextResponse.json({ success: true });
}
