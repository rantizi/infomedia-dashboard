import { NextRequest, NextResponse } from "next/server";

import type { MsdcLeadsResponse, MsdcLead } from "@/types/leads";

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
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const status = searchParams.get("status") ?? undefined;
    const q = searchParams.get("q") ?? undefined;
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10);
    const lembaga = searchParams.get("lembaga") ?? undefined;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!, 10) : undefined;

    // Start with all stub data and apply filters
    let filteredLeads: MsdcLead[] = [...STUB_MSDC_LEADS];
    filteredLeads = applyStatusFilter(filteredLeads, status);
    filteredLeads = applyTextSearch(filteredLeads, q);
    filteredLeads = applyLembagaFilter(filteredLeads, lembaga);
    filteredLeads = applyYearFilter(filteredLeads, year);

    // Calculate pagination
    const total = filteredLeads.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

    // Build response
    const response: MsdcLeadsResponse = {
      data: paginatedLeads,
      meta: {
        total,
        page,
        pageSize,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // Log error for debugging (in production, use structured logging)
    console.error("[/api/leads/msdc] Error:", message);

    return NextResponse.json(
      {
        error: "Failed to fetch MSDC leads data",
        message: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 },
    );
  }
}
