import { NextRequest, NextResponse } from "next/server";

import { createServerClient } from "@/lib/supabase";
import { getActiveTenantId } from "@/server/server-actions";

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
 * - Optional query params: `segment` (string), `year` (number; ignored if the column
 *   does not exist in the view).
 */

type FunnelStage = "leads" | "prospect" | "qualified" | "submission" | "win";

type StageKpi = {
  stage: FunnelStage;
  value_m: number;
  projects: number;
};

type StageCell = Omit<StageKpi, "stage">;

type SegmentFunnel = {
  segment: string;
  stages: Record<FunnelStage, StageCell>;
  year?: number;
};

type FunnelApiResponse = {
  data: SegmentFunnel[];
};

type RawFunnelRow = {
  segment: string | null;
  stage: string | null;
  total_m: number | string | null;
  project_count: number | string | null;
  year?: number | string | null;
};

const STAGE_ORDER: FunnelStage[] = ["leads", "prospect", "qualified", "submission", "win"];
const DEFAULT_SEGMENT_ORDER = ["telkom group", "soe", "private", "gov", "sme & reg", "total"];

const SEGMENT_NORMALIZATION_MAP: Record<string, string> = {
  telkom: "telkom group",
  "telkom group": "telkom group",
  soe: "soe",
  private: "private",
  government: "gov",
  gov: "gov",
  "sme & regional": "sme & reg",
  "sme and regional": "sme & reg",
  "sme & reg": "sme & reg",
  "sme reg": "sme & reg",
  total: "total",
};

const STAGE_NORMALIZATION_MAP: Record<string, FunnelStage> = {
  leads: "leads",
  lead: "leads",
  prospects: "prospect",
  prospect: "prospect",
  qualified: "qualified",
  submission: "submission",
  submissions: "submission",
  win: "win",
  won: "win",
};

const normalizeStage = (stage: string | null): FunnelStage | null => {
  const normalized = (stage ?? "").trim().toLowerCase();
  return STAGE_NORMALIZATION_MAP[normalized] ?? null;
};

const normalizeSegment = (segment: string): string => {
  const normalized = segment.trim().toLowerCase();
  return SEGMENT_NORMALIZATION_MAP[normalized] ?? normalized;
};

const isMissingYearColumn = (errorMessage: string): boolean => errorMessage.toLowerCase().includes("year");

const toNumber = (value: number | string | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const createEmptyStageRecord = (): Record<FunnelStage, StageCell> =>
  STAGE_ORDER.reduce(
    (acc, stage) => {
      acc[stage] = { value_m: 0, projects: 0 };
      return acc;
    },
    {} as Record<FunnelStage, StageCell>,
  );

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

function groupFunnelRows(rows: RawFunnelRow[]): SegmentFunnel[] {
  const grouped = new Map<string, SegmentFunnel>();

  for (const row of rows) {
    const segmentLabel = row.segment?.trim();
    if (!segmentLabel) continue;

    const stage = normalizeStage(row.stage);
    if (!stage) continue;

    const key = normalizeSegment(segmentLabel);
    const existing = grouped.get(key) ?? { segment: segmentLabel, stages: createEmptyStageRecord() };
    grouped.set(key, existing);

    existing.stages[stage] = {
      value_m: toNumber(row.total_m),
      projects: Math.round(toNumber(row.project_count)),
    };

    if (row.year !== undefined && row.year !== null) {
      const parsedYear = Number(row.year);
      if (Number.isFinite(parsedYear)) {
        existing.year = parsedYear;
      }
    }
  }

  return sortSegments(Array.from(grouped.values()));
}

// eslint-disable-next-line complexity
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const segmentFilter = searchParams.get("segment")?.trim() ?? undefined;
  const yearParam = searchParams.get("year");
  const parsedYear = yearParam ? Number.parseInt(yearParam, 10) : undefined;
  const year = Number.isFinite(parsedYear) ? parsedYear : undefined;

  try {
    const tenantId = await getActiveTenantId();
    const supabase = await createServerClient();
    const includeYear = year !== undefined;

    const buildQuery = (selectColumns: string, allowYearFilter: boolean) => {
      let query = supabase.from("vw_funnel_kpi_per_segment").select(selectColumns).eq("tenant_id", tenantId);

      if (segmentFilter) {
        query = query.ilike("segment", segmentFilter);
      }

      if (allowYearFilter && year !== undefined && Number.isFinite(year)) {
        query = query.eq("year", year);
      }

      return query.order("segment", { ascending: true }).order("stage", { ascending: true });
    };

    const selectColumns = includeYear
      ? "segment, stage, total_m, project_count, year"
      : "segment, stage, total_m, project_count";

    // Try selecting year if requested; gracefully fall back when the column is absent
    const { data, error } = await buildQuery(selectColumns, includeYear);

    let rows = data as RawFunnelRow[] | null;
    let queryError = error;

    if (queryError && includeYear && isMissingYearColumn(queryError.message ?? "")) {
      const fallback = await buildQuery("segment, stage, total_m, project_count", false);
      rows = fallback.data as RawFunnelRow[] | null;
      queryError = fallback.error;
    }

    if (queryError) {
      throw queryError;
    }

    const grouped = groupFunnelRows(rows ?? []);
    return NextResponse.json<FunnelApiResponse>({ data: grouped }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error("[/api/funnel-2rows] Failed to fetch funnel data:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
