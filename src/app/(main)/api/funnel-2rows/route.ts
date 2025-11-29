import { NextRequest, NextResponse } from "next/server";

import { createServerClient } from "@/lib/supabase";
import { getActiveTenantId } from "@/server/server-actions";
import type { FunnelApiResponse, FunnelStage, SegmentFunnel } from "@/types/funnel";

const VIEW_NAME = "vw_funnel_kpi_per_segment";
const YEAR_COLUMN_CANDIDATES = ["lop_year", "tahun", "year"] as const;

/**
 * GET /api/funnel-2rows
 *
 * Tenant-aware funnel KPI endpoint that reads from `vw_funnel_kpi_per_segment`.
 * Returns grouped metrics per segment and per stage with the following shape:
 *
 * {
 *   data: [
 *     {
 *       segment: "Telkom Group",
 *       stages: {
 *         leads: { value_m: 10.5, projects: 12 },
 *         prospect: { value_m: 8.2, projects: 9 },
 *         qualified: { value_m: 6.1, projects: 7 },
 *         submission: { value_m: 4.8, projects: 5 },
 *         win: { value_m: 2.3, projects: 3 }
 *       }
 *     }
 *   ]
 * }
 *
 * Notes:
 * - `total_m` from the view is already in Millions (M); do NOT scale further.
 * - Query params: `segment` (string, optional), `year` (number, required).
 */

type StageCell = SegmentFunnel["stages"][FunnelStage];

type RawFunnelRow = {
  segment: string | null;
  stage: string | null;
  total_m: number | string | null;
  project_count: number | string | null;
  year?: number | string | null;
  lop_year?: number | string | null;
  tahun?: number | string | null;
  [key: string]: number | string | null | undefined;
};

const STAGE_ORDER: FunnelStage[] = ["leads", "prospect", "qualified", "submission", "win"];
const DEFAULT_SEGMENT_ORDER = ["telkom group", "soe", "private", "gov", "sme & reg", "total"];

const SEGMENT_NORMALIZATION_MAP = new Map<string, string>([
  ["telkom", "telkom group"],
  ["telkom group", "telkom group"],
  ["soe", "soe"],
  ["private", "private"],
  ["government", "gov"],
  ["gov", "gov"],
  ["sme & regional", "sme & reg"],
  ["sme and regional", "sme & reg"],
  ["sme & reg", "sme & reg"],
  ["sme reg", "sme & reg"],
  ["total", "total"],
]);

const STAGE_NORMALIZATION_MAP = new Map<string, FunnelStage>([
  ["leads", "leads"],
  ["lead", "leads"],
  ["prospects", "prospect"],
  ["prospect", "prospect"],
  ["qualified", "qualified"],
  ["submission", "submission"],
  ["submissions", "submission"],
  ["win", "win"],
  ["won", "win"],
]);

const normalizeStage = (stage: string | null): FunnelStage | null => {
  const normalized = (stage ?? "").trim().toLowerCase();
  return STAGE_NORMALIZATION_MAP.get(normalized) ?? null;
};

const normalizeSegment = (segment: string): string => {
  const normalized = segment.trim().toLowerCase();
  return SEGMENT_NORMALIZATION_MAP.get(normalized) ?? normalized;
};

const isMissingColumn = (errorMessage: string, columnName: string): boolean =>
  errorMessage.toLowerCase().includes(columnName.toLowerCase());

const toNumber = (value: number | string | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const createEmptyStageRecord = (): Record<FunnelStage, StageCell> =>
  Object.fromEntries(STAGE_ORDER.map((stage) => [stage, { value_m: 0, projects: 0 }])) as Record<
    FunnelStage,
    StageCell
  >;

function sortSegments(segments: SegmentFunnel[]): SegmentFunnel[] {
  const rank = (segment: string): number => {
    const idx = DEFAULT_SEGMENT_ORDER.indexOf(normalizeSegment(segment));
    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
  };

  return [...segments].sort((a, b) => {
    const rankDiff = rank(a.segment) - rank(b.segment);
    if (rankDiff !== 0) return rankDiff;
    return a.segment.localeCompare(b.segment);
  });
}

function parseRowYear(row: RawFunnelRow, yearKey: string): number | undefined {
  const rawYear = (row as Record<string, number | string | null | undefined>)[yearKey];
  if (rawYear === undefined || rawYear === null) return undefined;
  const parsed = Number(rawYear);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function groupFunnelRows(rows: RawFunnelRow[], fallbackYear?: number, yearKey = "year"): SegmentFunnel[] {
  const grouped = new Map<string, SegmentFunnel>();

  for (const row of rows) {
    const segmentLabel = row.segment?.trim();
    if (!segmentLabel) continue;

    const stage = normalizeStage(row.stage);
    if (!stage) continue;

    const key = normalizeSegment(segmentLabel);
    const existing = grouped.get(key) ?? {
      segment: segmentLabel,
      stages: createEmptyStageRecord(),
      ...(fallbackYear !== undefined ? { year: fallbackYear } : {}),
    };
    grouped.set(key, existing);

    existing.stages[stage] = {
      value_m: toNumber(row.total_m),
      projects: Math.round(toNumber(row.project_count)),
    };

    const parsedYear = parseRowYear(row, yearKey);
    if (parsedYear !== undefined) {
      existing.year = parsedYear;
    }
  }

  return sortSegments(Array.from(grouped.values()));
}

const parseYearParam = (value: string | null): number | null => {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

async function getLatestTargetYear(supabase: Awaited<ReturnType<typeof createServerClient>>, tenantId: string) {
  const { data, error } = await supabase
    .from("vw_lop_vs_target_per_segment")
    .select("year")
    .eq("tenant_id", tenantId)
    .order("year", { ascending: false })
    .limit(1);

  if (error) return null;

  const candidate = data?.[0]?.year;
  const parsed = candidate !== null && candidate !== undefined ? Number(candidate) : null;
  return Number.isFinite(parsed) ? (parsed as number) : null;
}

async function resolveYearColumn(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  tenantId: string,
): Promise<{ column: string | null; latestYear: number | null }> {
  for (const candidate of YEAR_COLUMN_CANDIDATES) {
    const { data, error } = (await supabase
      .from(VIEW_NAME)
      .select(candidate)
      .eq("tenant_id", tenantId)
      .not(candidate, "is", null)
      .order(candidate, { ascending: false })
      .limit(1)) as { data: Record<string, unknown>[] | null; error: { message: string } | null };

    if (error) {
      if (isMissingColumn(error.message, candidate)) continue;
      throw new Error(error.message);
    }

    if (!data || data.length === 0) continue;

    const value = data[0][candidate as keyof (typeof data)[number]] as number | string | null | undefined;
    const parsed = value !== null && value !== undefined ? Number(value) : null;
    if (Number.isFinite(parsed)) {
      return { column: candidate, latestYear: parsed as number };
    }
  }

  return { column: null, latestYear: null };
}

// eslint-disable-next-line complexity
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const segmentFilter = searchParams.get("segment")?.trim() ?? undefined;
  const yearParamRaw = searchParams.get("year");
  const requestedYear = parseYearParam(yearParamRaw);
  const hasYearParam = yearParamRaw !== null;

  if (hasYearParam && requestedYear === null) {
    return NextResponse.json({ error: "Parameter 'year' wajib berupa angka." }, { status: 400 });
  }

  try {
    const tenantId = await getActiveTenantId();
    const supabase = await createServerClient();
    const { column: yearColumn, latestYear: viewLatestYear } = await resolveYearColumn(supabase, tenantId);
    const targetLatestYear = viewLatestYear ?? (await getLatestTargetYear(supabase, tenantId));
    const effectiveYear = requestedYear ?? targetLatestYear ?? new Date().getFullYear();

    if (!Number.isFinite(effectiveYear)) {
      return NextResponse.json({ error: "Parameter 'year' tidak valid." }, { status: 400 });
    }

    let query =
      yearColumn !== null
        ? supabase
            .from(VIEW_NAME)
            .select(`segment, stage, total_m, project_count, ${yearColumn}`)
            .eq("tenant_id", tenantId)
            .eq(yearColumn, effectiveYear)
        : supabase.from(VIEW_NAME).select("segment, stage, total_m, project_count").eq("tenant_id", tenantId);

    if (segmentFilter) {
      query = query.ilike("segment", segmentFilter);
    }

    const { data, error } = (await query.order("segment", { ascending: true }).order("stage", { ascending: true })) as {
      data: RawFunnelRow[] | null;
      error: { message: string } | null;
    };

    if (error) {
      throw new Error(error.message);
    }

    const shouldDropData =
      yearColumn === null && requestedYear !== null && targetLatestYear !== null && requestedYear !== targetLatestYear;
    const effectiveRows = shouldDropData ? [] : (data ?? []);
    const grouped = groupFunnelRows(effectiveRows, effectiveYear, yearColumn ?? "year");

    console.log(
      `[/api/funnel-2rows] requestedYear=${requestedYear ?? "auto"} effectiveYear=${effectiveYear} column=${
        yearColumn ?? "n/a"
      }`,
    );
    console.log(
      `[/api/funnel-2rows] rawRows=${effectiveRows.length} groupedRows=${grouped.length} (tenant=${tenantId})`,
    );

    return NextResponse.json<FunnelApiResponse>(
      { rows: grouped, data: grouped, hasData: grouped.length > 0, year: effectiveYear },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error("[/api/funnel-2rows] Failed to fetch funnel data:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
