import { NextRequest, NextResponse } from "next/server";

import { createServerClient, createServiceRoleClient } from "@/lib/supabase";
import { getActiveTenantId } from "@/server/server-actions";
import type { FunnelApiResponse, FunnelStage, SegmentFunnel } from "@/types/funnel";

const DEFAULT_YEAR = new Date().getFullYear();
const VIEW_NAME = "vw_funnel_kpi_per_segment";
const STAGE_ORDER: FunnelStage[] = ["leads", "prospect", "qualified", "submission", "win"];
const SEGMENT_ORDER = ["Telkom Group", "SOE", "Private", "Gov", "SME & Reg"] as const;

type StageCell = SegmentFunnel["stages"][FunnelStage];
type SegmentKey = (typeof SEGMENT_ORDER)[number];

type RawFunnelRow = {
  segment: string | null;
  stage: string | null;
  project_count: number | string | null;
  total_m: number | string | null;
  year: number | string | null;
  month: number | string | null;
  source_division?: string | null;
};
type LeadOpportunityRow = {
  amount: number | string | null;
  company: { segment: string | null } | null;
  created_at: string | null;
  source_division: string | null;
};

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

const SEGMENT_NORMALIZATION_MAP = new Map<string, SegmentKey>([
  ["telkom", "Telkom Group"],
  ["telkom group", "Telkom Group"],
  ["soe", "SOE"],
  ["private", "Private"],
  ["government", "Gov"],
  ["gov", "Gov"],
  ["sme & reg", "SME & Reg"],
  ["sme & regional", "SME & Reg"],
  ["sme and regional", "SME & Reg"],
  ["sme reg", "SME & Reg"],
]);

const normalizeStage = (stage: string | null): FunnelStage | null => {
  const normalized = (stage ?? "").trim().toLowerCase();
  return STAGE_NORMALIZATION_MAP.get(normalized) ?? null;
};

const normalizeSegment = (segment: string | null): SegmentKey | null => {
  if (!segment) return null;
  const normalized = segment.trim().toLowerCase();
  return SEGMENT_NORMALIZATION_MAP.get(normalized) ?? null;
};

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

const parseYearParam = (value: string | null): number | null => {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseMonthParam = (value: string | null): { value: number | null; invalid: boolean } => {
  if (value === null) return { value: null, invalid: false };
  const lower = value.trim().toLowerCase();
  if (lower === "" || lower === "all") return { value: null, invalid: false };
  const parsed = Number.parseInt(lower, 10);
  if (!Number.isFinite(parsed)) return { value: null, invalid: true };
  if (parsed < 1 || parsed > 12) return { value: null, invalid: true };
  return { value: parsed, invalid: false };
};

function ensureAllSegments(grouped: Map<string, SegmentFunnel>, year: number): SegmentFunnel[] {
  SEGMENT_ORDER.forEach((segment) => {
    if (!grouped.has(segment)) {
      grouped.set(segment, { segment, stages: createEmptyStageRecord(), year });
    }
  });

  const rank = (segment: string): number => {
    const idx = SEGMENT_ORDER.indexOf(segment as SegmentKey);
    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
  };

  return Array.from(grouped.values()).sort((a, b) => {
    const diff = rank(a.segment) - rank(b.segment);
    return diff !== 0 ? diff : a.segment.localeCompare(b.segment);
  });
}

// eslint-disable-next-line complexity
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const yearParamRaw = searchParams.get("year");
  const monthFromParam = searchParams.get("monthFrom");
  const monthToParam = searchParams.get("monthTo");
  const debugRequested = searchParams.get("debug") === "1";
  const debugEnabled = debugRequested && process.env.NODE_ENV !== "production";

  const requestedYear = parseYearParam(yearParamRaw);
  const hasYearParam = yearParamRaw !== null;
  if (hasYearParam && requestedYear === null) {
    return NextResponse.json({ error: "Parameter 'year' wajib berupa angka." }, { status: 400 });
  }

  const parsedMonthFrom = parseMonthParam(monthFromParam);
  const parsedMonthTo = parseMonthParam(monthToParam);

  if (parsedMonthFrom.invalid || parsedMonthTo.invalid) {
    return NextResponse.json(
      { error: "Parameter 'monthFrom' dan 'monthTo' harus berupa angka 1-12 atau dikosongkan." },
      { status: 400 },
    );
  }

  let monthFrom = parsedMonthFrom.value;
  let monthTo = parsedMonthTo.value;

  if (monthFrom !== null && monthTo === null) {
    monthTo = monthFrom;
  } else if (monthTo !== null && monthFrom === null) {
    monthFrom = monthTo;
  }

  if (monthFrom !== null && monthTo !== null && monthFrom > monthTo) {
    [monthFrom, monthTo] = [monthTo, monthFrom];
  }

  const effectiveYear = requestedYear ?? DEFAULT_YEAR;
  if (!Number.isFinite(effectiveYear)) {
    return NextResponse.json({ error: "Parameter 'year' tidak valid." }, { status: 400 });
  }

  try {
    const tenantId = await getActiveTenantId();
    const supabase = await createServerClient();
    const serviceSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY !== undefined ? createServiceRoleClient() : null;

    let query = supabase
      .from(VIEW_NAME)
      .select("segment, stage, project_count, total_m, year, month")
      .eq("tenant_id", tenantId)
      .eq("year", effectiveYear);

    if (monthFrom !== null && monthTo !== null) {
      query = query.gte("month", monthFrom).lte("month", monthTo);
    }

    const { data: rows, error } = (await query.order("segment").order("stage")) as {
      data: RawFunnelRow[] | null;
      error: { message: string } | null;
    };

    if (error) {
      throw new Error(error.message);
    }

    const baseRows = rows ?? [];
    const leadsProjectsFromView = baseRows.reduce(
      (sum, row) => (normalizeStage(row.stage) === "leads" ? sum + Math.round(toNumber(row.project_count)) : sum),
      0,
    );

    let leadSourceRows: LeadOpportunityRow[] | null = null;
    let augmentedRows: RawFunnelRow[] = baseRows;

    if (leadsProjectsFromView === 0 && serviceSupabase) {
      const startDateIso = new Date(Date.UTC(effectiveYear, (monthFrom ?? 1) - 1, 1)).toISOString();
      const endDateIso = new Date(Date.UTC(effectiveYear, monthTo ?? 12, 1)).toISOString();

      const { data: leadRows, error: leadsError } = await serviceSupabase
        .from("opportunities")
        .select("stage, amount, created_at, source_division, company:companies(segment)")
        .eq("tenant_id", tenantId)
        .eq("stage", "leads")
        .gte("created_at", startDateIso)
        .lt("created_at", endDateIso);

      if (leadsError) {
        console.error("[/api/funnel-2rows] Failed to backfill leads:", leadsError.message);
      } else if (leadRows) {
        leadSourceRows = leadRows as LeadOpportunityRow[];
        const mappedLeadRows: RawFunnelRow[] = leadRows.map((row) => ({
          segment: row.company?.segment ?? null,
          stage: "leads",
          project_count: 1,
          total_m: toNumber(row.amount) / 1_000_000,
          year: effectiveYear,
          month: row.created_at ? new Date(row.created_at).getUTCMonth() + 1 : null,
          source_division: row.source_division ?? null,
        }));
        augmentedRows = [...augmentedRows, ...mappedLeadRows];
      }
    }

    const grouped = new Map<string, SegmentFunnel>();

    for (const row of augmentedRows) {
      const segment = normalizeSegment(row.segment);
      const stage = normalizeStage(row.stage);
      if (!segment || !stage) continue;

      const existing = grouped.get(segment) ?? { segment, stages: createEmptyStageRecord(), year: effectiveYear };
      const currentStage = existing.stages[stage];

      existing.stages[stage] = {
        value_m: currentStage.value_m + toNumber(row.total_m),
        projects: currentStage.projects + Math.round(toNumber(row.project_count)),
      };

      grouped.set(segment, existing);
    }

    const result = ensureAllSegments(grouped, effectiveYear);

    console.log("[funnel-2rows] params", { year: effectiveYear, monthFrom, monthToNormalized: monthTo });
    console.log("[funnel-2rows] rowsFromDb", augmentedRows.length);

    const payload: FunnelApiResponse & { debug?: unknown } = {
      rows: result,
      data: result,
      hasData: result.length > 0,
      year: effectiveYear,
    };

    if (debugEnabled) {
      const distinctStages = new Set<string>();
      const distinctDivisions = new Set<string>();
      augmentedRows.forEach((row) => {
        const normalizedStage = normalizeStage(row.stage);
        if (normalizedStage) distinctStages.add(normalizedStage);
        if (row.source_division) distinctDivisions.add(row.source_division);
      });

      const leadRowsForDebug = augmentedRows.filter((row) => normalizeStage(row.stage) === "leads");
      const leadCount = leadRowsForDebug.reduce((sum, row) => sum + Math.round(toNumber(row.project_count)), 0);
      const leadStats =
        leadSourceRows !== null
          ? {
              total_rows: leadSourceRows.length,
              rows_with_amount: leadSourceRows.filter((row) => row?.amount !== null).length,
              sum_amount: leadSourceRows.reduce((sum, row) => sum + toNumber(row?.amount), 0),
            }
          : {
              total_rows: leadRowsForDebug.length,
              rows_with_amount: leadRowsForDebug.filter((row) => toNumber(row.total_m) > 0).length,
              sum_amount: leadRowsForDebug.reduce((sum, row) => sum + toNumber(row.total_m) * 1_000_000, 0),
            };

      payload.debug = {
        filters: { year: effectiveYear, monthFrom, monthTo, stages: STAGE_ORDER, division: "all" },
        distinctStages: Array.from(distinctStages),
        distinctDivisions: Array.from(distinctDivisions),
        leads: { ...leadStats, leads_count: leadCount },
      };
    }

    return NextResponse.json<FunnelApiResponse>(payload, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error("[/api/funnel-2rows] Failed to fetch funnel data:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
