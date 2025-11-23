import { createHmac, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { z } from "zod";

import { createServiceClient } from "@/lib/supabaseClient";

const divisionEnum = z.enum(["BIDDING", "MSDC", "SALES", "MARKETING", "OTHER"]);

// Expected Supabase Auth webhook payload (user.created / user.updated).
// See https://supabase.com/docs/guides/auth/auth-hooks for full shape.
const webhookUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().nullable(),
  email_confirmed_at: z.string().optional().nullable(),
  user_metadata: z
    .object({
      full_name: z.string().optional(),
      phone: z.string().optional().nullable(),
      job_title: z.string().optional().nullable(),
      division: divisionEnum.optional(),
    })
    .optional(),
});

const webhookSchema = z.object({
  type: z.string(),
  record: webhookUserSchema.optional(),
  user: webhookUserSchema.optional(),
  data: webhookUserSchema.optional(),
});

function verifySignature(rawBody: string, signature: string, secret: string) {
  const expectedHex = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBase64 = createHmac("sha256", secret).update(rawBody).digest("base64");
  const trimmed = signature.trim();

  const compare = (expected: string, encoding: BufferEncoding) => {
    try {
      const expectedBuf = Buffer.from(expected, encoding);
      const providedBuf = Buffer.from(trimmed, encoding);
      return expectedBuf.length === providedBuf.length && timingSafeEqual(expectedBuf, providedBuf);
    } catch {
      return false;
    }
  };

  return compare(expectedHex, "hex") || compare(expectedBase64, "base64");
}

// eslint-disable-next-line complexity
export async function POST(request: Request) {
  const signingSecret = process.env.SIGNING_SECRET;
  if (!signingSecret) {
    return NextResponse.json({ error: "SIGNING_SECRET is not configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-supabase-signature");

  if (!signature || !verifySignature(rawBody, signature, signingSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsedPayload = webhookSchema.safeParse(parsedBody);
  if (!parsedPayload.success) {
    return NextResponse.json(
      { error: "Invalid webhook payload", details: parsedPayload.error.flatten() },
      { status: 400 },
    );
  }

  const userPayload = parsedPayload.data.record ?? parsedPayload.data.user ?? parsedPayload.data.data;
  if (!userPayload) {
    return NextResponse.json({ error: "Webhook payload missing user" }, { status: 400 });
  }

  const user = webhookUserSchema.parse(userPayload);
  const tenantId = process.env.DEFAULT_TENANT_ID;

  if (!tenantId) {
    return NextResponse.json({ error: "DEFAULT_TENANT_ID is not configured" }, { status: 500 });
  }

  if (!user.email) {
    return NextResponse.json({ error: "Webhook payload missing email" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const emailVerified = Boolean(user.email_confirmed_at);
  const now = new Date().toISOString();
  const division = user.user_metadata?.division ?? "OTHER";

  const { error: userUpsertError } = await supabase.from("users").upsert(
    [
      {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name ?? user.email,
        phone: user.user_metadata?.phone ?? null,
        job_title: user.user_metadata?.job_title ?? null,
        email_verified: emailVerified,
        updated_at: now,
      },
    ],
    { onConflict: "id" },
  );

  if (userUpsertError) {
    console.error("Webhook user upsert failed:", userUpsertError);
    return NextResponse.json({ error: "Failed to upsert user" }, { status: 500 });
  }

  const { error: membershipUpsertError } = await supabase.from("memberships").upsert(
    [
      {
        user_id: user.id,
        tenant_id: tenantId,
        role: "contributor",
        division,
      },
    ],
    { onConflict: "user_id,tenant_id" },
  );

  if (membershipUpsertError) {
    console.error("Webhook membership upsert failed:", membershipUpsertError);
    return NextResponse.json({ error: "Failed to upsert membership" }, { status: 500 });
  }

  // TODO: Add rate limiting / replay protection (e.g., check timestamps) for webhook endpoint.

  return NextResponse.json({ success: true });
}
