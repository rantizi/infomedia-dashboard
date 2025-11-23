import { NextRequest, NextResponse } from "next/server";

import { createServerClient } from "@/lib/supabase";
import { getActiveTenantId } from "@/server/server-actions";
import type { MsdcLead, MsdcLeadsQueryParams, MsdcLeadsResponse } from "@/types/leads";

import { STUB_MSDC_LEADS } from "./stub-data";

/**
 * GET /api/leads/msdc
 *
 * Returns MSDC leads data with support for filtering, search, and pagination.
 * This endpoint will be updated to fetch real data from Supabase later.
 *
 * Query parameters:
 *   - status (optional): Filter by status_tender
 *   - q (optional): Text search (customer_name, tender_name, pic)
 *   - page (optional): Page number (default: 1)
 *   - pageSize (optional): Items per page (default: 20)
 *   - lembaga (optional): Filter by lembaga (for future extension)
 *   - year (optional): Filter by year (for future extension)
 *
 * Response: MsdcLeadsResponse containing filtered and paginated leads data
 */

function applyStatusFilter(leads: MsdcLead[], status: string | undefined): MsdcLead[] {
  if (!status) return leads;
  return leads.filter((lead) => lead.status_tender === status);
}

function applyTextSearch(leads: MsdcLead[], query: string | undefined): MsdcLead[] {
  if (!query) return leads;
  const searchLower = query.toLowerCase();
  return leads.filter((lead) => {
    const customerMatch = lead.customer_name?.toLowerCase().includes(searchLower) ?? false;
    const tenderMatch = lead.tender_name?.toLowerCase().includes(searchLower) ?? false;
    const picMatch = lead.pic?.toLowerCase().includes(searchLower) ?? false;
    return customerMatch || tenderMatch || picMatch;
  });
}

function applyLembagaFilter(leads: MsdcLead[], lembaga: string | undefined): MsdcLead[] {
  if (!lembaga) return leads;
  return leads.filter((lead) => lead.customer_name?.includes(lembaga));
}

function applyYearFilter(leads: MsdcLead[], year: number | undefined): MsdcLead[] {
  if (!year) return leads;
  return leads.filter((lead) => {
    if (!lead.created_at) return false;
    const leadYear = new Date(lead.created_at).getFullYear();
    return leadYear === year;
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const parseNumberParam = (value: string | null, fallback: number): number => {
    const parsed = value ? Number.parseInt(value, 10) : Number.NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  };

  // Parse query parameters once so they stay in scope for the fallback path.
  const status = searchParams.get("status") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  const page = parseNumberParam(searchParams.get("page"), 1);
  const pageSize = parseNumberParam(searchParams.get("pageSize"), 20);
  const lembaga = searchParams.get("lembaga") ?? undefined;
  const yearParam = searchParams.get("year");
  const parsedYear = yearParam ? Number.parseInt(yearParam, 10) : Number.NaN;
  const year = Number.isFinite(parsedYear) ? parsedYear : undefined;

  try {
    const tenantId = await getActiveTenantId();
    const response = await fetchLeadsFromSupabase(tenantId, { status, q, page, pageSize, lembaga, year });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // Log error for debugging (in production, use structured logging)
    console.error("[/api/leads/msdc] Error, serving stub data:", message);

    // Fall back to stub data so UI keeps working locally
    const stubResponse = buildStubResponse({ status, q, page, pageSize, lembaga, year });
    const res = NextResponse.json(stubResponse, { status: 200 });
    res.headers.set("X-Data-Source", "stub");
    res.headers.set("X-Error", message);
    return res;
  }
}

async function fetchLeadsFromSupabase(tenantId: string, params: MsdcLeadsQueryParams): Promise<MsdcLeadsResponse> {
  const { status, q, page = 1, pageSize = 20, lembaga, year } = params;
  const supabase = await createServerClient();

  let query = supabase.from("leads").select("*", { count: "exact" }).eq("tenant_id", tenantId);

  if (status) {
    query = query.eq("status_tender", status);
  }

  if (lembaga) {
    query = query.ilike("customer_name", `%${lembaga}%`);
  }

  if (year) {
    query = query.gte("created_at", `${year}-01-01`).lte("created_at", `${year}-12-31`);
  }

  if (q) {
    const like = `%${q}%`;
    query = query.or(`customer_name.ilike.${like},tender_name.ilike.${like},pic.ilike.${like}`);
  }

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize - 1;

  const { data, error, count } = await query.order("created_at", { ascending: false }).range(startIndex, endIndex);

  if (error) {
    throw error;
  }

  return {
    data: (data ?? []) as MsdcLead[],
    meta: {
      total: count ?? 0,
      page,
      pageSize,
    },
  };
}

function buildStubResponse(params: MsdcLeadsQueryParams): MsdcLeadsResponse {
  const { status, q, page = 1, pageSize = 20, lembaga, year } = params;

  let filteredLeads: MsdcLead[] = [...STUB_MSDC_LEADS];
  filteredLeads = applyStatusFilter(filteredLeads, status);
  filteredLeads = applyTextSearch(filteredLeads, q);
  filteredLeads = applyLembagaFilter(filteredLeads, lembaga);
  filteredLeads = applyYearFilter(filteredLeads, year);

  const total = filteredLeads.length;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

  return {
    data: paginatedLeads,
    meta: {
      total,
      page,
      pageSize,
    },
  };
}
