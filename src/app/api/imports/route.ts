import { randomUUID } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { createServerClient, createServiceRoleClient } from "@/lib/supabase";

export const runtime = "nodejs";

const DIVISIONS = ["BIDDING", "MSDC", "SALES", "MARKETING", "OTHER"] as const;
type SourceDivision = (typeof DIVISIONS)[number];
type ImportStatus = "QUEUED" | "RUNNING" | "SUCCESS" | "FAILED";

type ImportInsert = {
  id: string;
  tenant_id: string;
  division: SourceDivision;
  file_name: string;
  storage_path: string;
  status: ImportStatus;
  created_by: string;
  rows_in?: number | null;
  rows_out?: number | null;
  error_log?: string | null;
};

// eslint-disable-next-line complexity
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Expect multipart/form-data with a file and division field.
    const formData = await request.formData();
    const fileEntry = formData.get("file");
    const divisionEntry = formData.get("division");

    if (!(fileEntry instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (typeof divisionEntry !== "string" || !isValidDivision(divisionEntry)) {
      return NextResponse.json({ error: "Division is required" }, { status: 400 });
    }

    // Authenticate the current user via Supabase auth cookies.
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("[api/imports] Failed to read auth session:", authError);
      return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve tenant context for the authenticated user.
    const tenantId = await getActiveTenantId(supabase, user);
    // Use service role client for privileged writes (bypasses RLS for storage/DB inserts).
    const serviceSupabase = createServiceRoleClient();
    // Generate identifiers and storage path for this import.
    const importId = randomUUID();
    const originalFileName = fileEntry.name || "upload";
    const storagePath = buildStoragePath(tenantId, importId, originalFileName);
    const contentType = fileEntry.type || "application/octet-stream";

    // Upload the raw file to Supabase Storage (imports bucket).
    const fileBuffer = Buffer.from(await fileEntry.arrayBuffer());
    const { error: uploadError } = await serviceSupabase.storage.from("imports").upload(storagePath, fileBuffer, {
      contentType,
      upsert: false,
    });

    if (uploadError) {
      console.error("[api/imports] Failed to upload file:", uploadError);
      return NextResponse.json({ error: "Failed to upload file to storage" }, { status: 500 });
    }

    const importRow: ImportInsert = {
      id: importId,
      tenant_id: tenantId,
      division: divisionEntry,
      file_name: originalFileName,
      storage_path: storagePath,
      status: "QUEUED",
      created_by: user.id,
    };

    // Insert a queued import record that the ETL worker will pick up.
    const { error: insertError } = await serviceSupabase.from("imports").insert(importRow);

    if (insertError) {
      console.error("[api/imports] Failed to insert import record:", insertError);
      return NextResponse.json({ error: "Failed to insert import record" }, { status: 500 });
    }

    return NextResponse.json({ importId, status: "QUEUED", message: "File queued for ETL" }, { status: 201 });
  } catch (error) {
    console.error("[api/imports] Unexpected error:", error);
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
  }
}

function isValidDivision(value: string): value is SourceDivision {
  return DIVISIONS.includes(value as SourceDivision);
}

function getFileExtension(fileName: string): string {
  const parts = fileName.split(".");
  if (parts.length < 2) return "bin";
  const ext = parts.pop();
  return ext ? ext.toLowerCase() : "bin";
}

function buildStoragePath(tenantId: string, importId: string, fileName: string): string {
  const ext = getFileExtension(fileName);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `imports/${tenantId}/${importId}/${timestamp}.${ext}`;
}

async function getActiveTenantId(supabase: SupabaseClient<Database>, user: User): Promise<string> {
  const { data, error } = await supabase
    .from("memberships")
    .select("tenant_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[api/imports] Failed to resolve tenant:", error);
  }

  const tenantId =
    data?.tenant_id ?? process.env.SUPABASE_DEFAULT_TENANT_ID ?? process.env.NEXT_PUBLIC_SUPABASE_DEFAULT_TENANT_ID;

  if (!tenantId) {
    throw new Error("Active tenant not found for user");
  }

  return tenantId;
}
