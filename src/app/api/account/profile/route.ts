import { NextResponse } from "next/server";

import { z } from "zod";

import { createServerClient } from "@/lib/supabase";
import { createServiceClient } from "@/lib/supabaseClient";

// Env vars required: SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
// DEFAULT_TENANT_ID (or SUPABASE_DEFAULT_TENANT_ID), and APP_BASE_URL if you redirect after auth flows.
const divisionEnum = z.enum(["BIDDING", "MSDC", "SALES", "MARKETING", "OTHER"]);

const optionalField = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value && value.length > 0 ? value : null));

const payloadSchema = z.object({
  full_name: z.string().trim().min(1, "Full name is required"),
  phone: optionalField,
  job_title: optionalField,
  division: divisionEnum,
});

// Method: PUT updates the authenticated user's profile and membership division.
// eslint-disable-next-line complexity
export async function PUT(request: Request) {
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

  const tenantId =
    process.env.DEFAULT_TENANT_ID ??
    process.env.SUPABASE_DEFAULT_TENANT_ID ??
    process.env.NEXT_PUBLIC_SUPABASE_DEFAULT_TENANT_ID;

  if (!tenantId) {
    return NextResponse.json(
      {
        success: false,
        error: "DEFAULT_TENANT_ID is not configured on the server.",
      },
      { status: 500 },
    );
  }

  // Use the service role key to bypass RLS on the server only. Never expose this client-side.
  const serviceSupabase = createServiceClient();
  const { full_name, phone, job_title, division } = parsed.data;

  // Update public.users (only columns that actually exist in this project).
  const { error: userUpdateError } = await serviceSupabase.from("users").update({ full_name }).eq("id", user.id); // Security: only allow the authenticated user to update their own record.

  if (userUpdateError) {
    console.error("Failed to update user profile:", userUpdateError);
    return NextResponse.json({ success: false, error: "Failed to update profile." }, { status: 500 });
  }

  // Mirror phone/job_title/division into auth metadata so client components can read them.
  const { error: metadataError } = await serviceSupabase.auth.admin.updateUserById(user.id, {
    user_metadata: {
      full_name,
      phone: phone ?? null,
      job_title: job_title ?? null,
      division,
    },
  });

  if (metadataError) {
    console.error("Failed to update auth metadata:", metadataError);
    return NextResponse.json({ success: false, error: "Failed to update profile." }, { status: 500 });
  }

  const { data: existingMembership, error: membershipFetchError } = await serviceSupabase
    .from("memberships")
    .select("role")
    .eq("user_id", user.id)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (membershipFetchError) {
    console.error("Failed to fetch membership:", membershipFetchError);
    return NextResponse.json({ success: false, error: "Failed to update membership." }, { status: 500 });
  }

  const role = existingMembership?.role ?? "contributor";

  const membershipUpsert =
    existingMembership !== null
      ? serviceSupabase.from("memberships").update({ division, role }).eq("user_id", user.id).eq("tenant_id", tenantId)
      : serviceSupabase.from("memberships").insert([{ user_id: user.id, tenant_id: tenantId, division, role }]);

  const { error: membershipError } = await membershipUpsert;
  if (membershipError) {
    console.error("Failed to upsert membership:", membershipError);
    return NextResponse.json({ success: false, error: "Failed to update membership." }, { status: 500 });
  }

  // TODO: Add rate limiting to protect against abuse.
  // TODO: Add CSRF protections if this route is ever called cross-site (e.g., a signed custom header).
  return NextResponse.json({ success: true });
}
