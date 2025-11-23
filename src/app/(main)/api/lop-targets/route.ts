import { NextRequest, NextResponse } from "next/server";

import { createServerClient } from "@/lib/supabase";
import { getActiveTenantId } from "@/server/server-actions";
import type { LopTargetRow, LopTargetsApiResponse } from "@/types/funnel";

/**
 * GET /api/lop-targets
 *
 * Reads target + LOP metrics per segment from the Supabase view
 * `vw_lop_vs_target_per_segment` (values already in Millions, no further scaling).
 * Optional query param: `year` (ignored gracefully if the column does not exist).
 */

type RawLopRow = {
  segment: string | null;
  target_rkap_m: number | string | null;
  target_stg_m: number | string | null;
  lop_value_m?: number | string | null;
  kecukupan_lop_m?: number | string | null;
  qualified_lop_m: number | string | null;
  year?: number | string | null;
};

const VIEW_NAME = "vw_lop_vs_target_per_segment";

const isMissingYearColumn = (message: string): boolean => message.toLowerCase().includes("year");

const toNumber = (value: number | string | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapRow = (row: RawLopRow): LopTargetRow => {
  const base: LopTargetRow = {
    segment: row.segment ?? "",
    target_rkap_m: toNumber(row.target_rkap_m),
    target_stg_m: toNumber(row.target_stg_m),
    lop_value_m: toNumber(row.lop_value_m ?? row.kecukupan_lop_m),
    qualified_lop_m: toNumber(row.qualified_lop_m),
  };

  const yearValue = row.year !== undefined && row.year !== null ? Number(row.year) : undefined;
  if (yearValue !== undefined && Number.isFinite(yearValue)) {
    base.year = yearValue;
  }

  return base;
};

// eslint-disable-next-line complexity
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const yearParam = searchParams.get("year");
  const parsedYear = yearParam ? Number.parseInt(yearParam, 10) : undefined;
  const year = Number.isFinite(parsedYear) ? parsedYear : undefined;
  const includeYear = year !== undefined;

  try {
    const tenantId = await getActiveTenantId();
    const supabase = await createServerClient();

    const selectWithYear = "segment, target_rkap_m, target_stg_m, kecukupan_lop_m, qualified_lop_m, year";
    const selectWithoutYear = "segment, target_rkap_m, target_stg_m, kecukupan_lop_m, qualified_lop_m";

    const buildQuery = (selectColumns: string, allowYearFilter: boolean) => {
      let query = supabase.from(VIEW_NAME).select(selectColumns).eq("tenant_id", tenantId);

      if (allowYearFilter && year !== undefined) {
        query = query.eq("year", year);
      }

      return query.order("segment", { ascending: true });
    };

    const { data, error } = await buildQuery(includeYear ? selectWithYear : selectWithoutYear, includeYear);

    let rows = data as RawLopRow[] | null;
    let queryError = error;

    if (queryError && includeYear && isMissingYearColumn(queryError.message ?? "")) {
      const fallback = await buildQuery(selectWithoutYear, false);
      rows = fallback.data as RawLopRow[] | null;
      queryError = fallback.error;
    }

    if (queryError) {
      throw queryError;
    }

    const mapped = (rows ?? []).map(mapRow);
    return NextResponse.json<LopTargetsApiResponse>({ data: mapped }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error("[/api/lop-targets] Failed to fetch LOP targets:", message);
    return NextResponse.json<LopTargetsApiResponse & { error: string }>({ data: [], error: message }, { status: 500 });
  }
}
