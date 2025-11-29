import { NextRequest, NextResponse } from "next/server";

import { createServerClient } from "@/lib/supabase";
import { getActiveTenantId } from "@/server/server-actions";
import type { LopTargetRow, LopTargetsApiResponse } from "@/types/funnel";

/**
 * GET /api/lop-targets
 *
 * Reads target + LOP metrics per segment from the Supabase view
 * `vw_lop_vs_target_per_segment` (values already in Millions, no further scaling).
 * Required query param: `year` (number).
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

const mapRow = (row: RawLopRow, fallbackYear?: number): LopTargetRow => {
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
  } else if (fallbackYear !== undefined) {
    base.year = fallbackYear;
  }

  return base;
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const yearParam = searchParams.get("year");
  const parsedYear = yearParam ? Number.parseInt(yearParam, 10) : NaN;
  const year = Number.isFinite(parsedYear) ? parsedYear : null;

  if (year === null) {
    return NextResponse.json({ error: "Parameter 'year' wajib diisi sebagai angka." }, { status: 400 });
  }

  try {
    const tenantId = await getActiveTenantId();
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from(VIEW_NAME)
      .select("segment, target_rkap_m, target_stg_m, kecukupan_lop_m, qualified_lop_m, year")
      .eq("tenant_id", tenantId)
      .eq("year", year)
      .order("segment", { ascending: true });

    if (error) {
      const message = isMissingYearColumn(error.message)
        ? "Kolom 'year' tidak tersedia di vw_lop_vs_target_per_segment. Perbarui view untuk mendukung filter tahun."
        : error.message;
      throw new Error(message);
    }

    const mapped = (data as RawLopRow[]).map((row) => mapRow(row, year));
    return NextResponse.json<LopTargetsApiResponse>(
      { data: mapped, hasData: mapped.length > 0, year },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error("[/api/lop-targets] Failed to fetch LOP targets:", message);
    return NextResponse.json<LopTargetsApiResponse & { error: string }>(
      { data: [], error: message, hasData: false, year },
      { status: 500 },
    );
  }
}
