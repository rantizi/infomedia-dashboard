import { NextResponse } from "next/server";

import { STUB_FUNNEL_DATA } from "./stub-data";

/**
 * GET /api/funnel-2rows
 *
 * Returns stub data for the Infomedia dashboard mockup.
 * This endpoint will be updated to fetch real data from Supabase later.
 *
 * Query parameters (currently ignored, for future use):
 *   - from (optional): ISO datetime, start date filter
 *   - to (optional): ISO datetime, end date filter
 *   - tenant_id (optional): tenant ID (will be derived from JWT)
 *
 * Response: Funnel2RowsResponse containing data for all 6 segments
 */
export async function GET(): Promise<NextResponse> {
  try {
    // For now, return stub data directly
    // Later, this will be replaced with:
    // const supabase = createServerClient()
    // const data = await supabase.from('vw_funnel_kpi_per_segment').select('*')...

    return NextResponse.json(STUB_FUNNEL_DATA, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // Log error for debugging (in production, use structured logging)
    console.error("[/api/funnel-2rows] Error:", message);

    return NextResponse.json(
      {
        error: "Failed to fetch funnel data",
        message: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 },
    );
  }
}
