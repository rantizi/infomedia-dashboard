import { createServerClient } from "@/lib/supabase";
import {
  SEGMENT_ORDER,
  type Funnel2RowsResponse,
  type FunnelCell,
  type FunnelStage,
  type Segment,
} from "@/types/funnel";

export type FunnelRow = {
  tenant_id: string;
  segment: string;
  stage: string;
  project_count: number | null;
  total_m: number | null;
};

export type LopTargetRow = {
  tenant_id: string;
  year: number;
  segment: string;
  target_rkap_m: number | null;
  target_stg_m: number | null;
  kecukupan_lop_m: number | null;
  qualified_lop_m: number | null;
  kecukupan_vs_rkap_pct: number | null;
  kecukupan_vs_stg_pct: number | null;
  qualified_vs_rkap_pct: number | null;
  qualified_vs_stg_pct: number | null;
};

/**
 * Fetch the per-stage funnel summary for a tenant.
 */
export async function getFunnelSummaryForTenant(tenantId: string): Promise<FunnelRow[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("vw_funnel_kpi_per_segment")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("segment", { ascending: true })
    .order("stage", { ascending: true });

  if (error) {
    throw error;
  }

  const safeData: FunnelRow[] = Array.isArray(data) ? (data as FunnelRow[]) : [];

  return safeData;
}

/**
 * Fetch the LOP vs Target metrics for a tenant for a specific year (default 2026).
 */
export async function getLopTargetsForTenant(tenantId: string, year = 2026): Promise<LopTargetRow[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("vw_lop_vs_target_per_segment")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("year", year)
    .order("segment", { ascending: true });

  if (error) {
    throw error;
  }

  const safeData: LopTargetRow[] = Array.isArray(data) ? (data as LopTargetRow[]) : [];

  return safeData;
}

const SEGMENTS: Segment[] = SEGMENT_ORDER;
const STAGES: FunnelStage[] = ["leads", "prospect", "qualified", "submission", "win"];

const SEGMENT_NAME_MAP: Record<string, Segment> = {
  "telkom group": "TELKOM_GROUP",
  telkom: "TELKOM_GROUP",
  soe: "SOE",
  private: "PRIVATE",
  government: "GOV",
  gov: "GOV",
  "sme & regional": "SME_REG",
  "sme and regional": "SME_REG",
  "sme & reg": "SME_REG",
  "sme reg": "SME_REG",
  total: "TOTAL",
};

const STAGE_NAME_MAP: Record<string, FunnelStage> = {
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

const normalize = (value: string | null | undefined): string => (value ?? "").trim().toLowerCase();

const mapSegment = (segmentLabel: string | null | undefined): Segment | null => {
  const key = normalize(segmentLabel);
  // Safe lookup against a fixed dictionary of segments.
  // eslint-disable-next-line security/detect-object-injection
  return Object.prototype.hasOwnProperty.call(SEGMENT_NAME_MAP, key) ? SEGMENT_NAME_MAP[key] : null;
};

const mapStage = (stageLabel: string | null | undefined): FunnelStage | null => {
  const key = normalize(stageLabel);
  // Safe lookup against a fixed dictionary of funnel stages.
  // eslint-disable-next-line security/detect-object-injection
  return Object.prototype.hasOwnProperty.call(STAGE_NAME_MAP, key) ? STAGE_NAME_MAP[key] : null;
};

const createSegmentRecord = <T>(factory: () => T): Record<Segment, T> =>
  Object.fromEntries(SEGMENTS.map((segment) => [segment, factory()])) as Record<Segment, T>;

const createEmptyFunnelData = (): Funnel2RowsResponse => {
  const stages = Object.fromEntries(
    STAGES.map((stage) => [stage, createSegmentRecord<FunnelCell>(() => ({ valueM: 0, projects: 0 }))]),
  ) as Funnel2RowsResponse["stages"];

  return {
    stages,
    targetRkap: createSegmentRecord(() => 0),
    targetStg: createSegmentRecord(() => 0),
    kecukupanLop: createSegmentRecord(() => ({
      valueM: 0,
      pctRkap: 0,
      pctStg: 0,
    })),
    qualifiedLop: createSegmentRecord(() => ({
      valueM: 0,
      pctRkap: 0,
      pctStg: 0,
    })),
  };
};

const toNumber = (value: number | string | null | undefined): number => {
  if (value === null || value === undefined) {
    return 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Compose funnel + LOP rows into the shape consumed by the dashboard and API response.
 */
export function buildFunnelDashboardData(funnelRows: FunnelRow[], lopRows: LopTargetRow[]): Funnel2RowsResponse {
  const result = createEmptyFunnelData();

  for (const row of funnelRows) {
    const segment = mapSegment(row.segment);
    const stage = mapStage(row.stage);

    if (!segment || !stage) {
      continue;
    }

    // Stage and segment have been normalized into strict enums, safe for index access.
    // eslint-disable-next-line security/detect-object-injection
    result.stages[stage][segment] = {
      valueM: toNumber(row.total_m),
      projects: Math.round(toNumber(row.project_count)),
    };
  }

  for (const row of lopRows) {
    const segment = mapSegment(row.segment);

    if (!segment) {
      continue;
    }

    // Normalized segment keys ensure deterministic lookups into the typed records.
    // eslint-disable-next-line security/detect-object-injection
    result.targetRkap[segment] = toNumber(row.target_rkap_m);
    // eslint-disable-next-line security/detect-object-injection
    result.targetStg[segment] = toNumber(row.target_stg_m);
    // eslint-disable-next-line security/detect-object-injection
    result.kecukupanLop[segment] = {
      valueM: toNumber(row.kecukupan_lop_m),
      pctRkap: toNumber(row.kecukupan_vs_rkap_pct),
      pctStg: toNumber(row.kecukupan_vs_stg_pct),
    };
    // eslint-disable-next-line security/detect-object-injection
    result.qualifiedLop[segment] = {
      valueM: toNumber(row.qualified_lop_m),
      pctRkap: toNumber(row.qualified_vs_rkap_pct),
      pctStg: toNumber(row.qualified_vs_stg_pct),
    };
  }

  return result;
}
