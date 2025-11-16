import { OverviewDashboard } from "@/app/_components/overview-dashboard";
import { getFunnelSummaryForTenant, getLopTargetsForTenant, type FunnelRow, type LopTargetRow } from "@/lib/kpi";
import { getActiveTenantId } from "@/server/server-actions";
import type { Funnel2RowsResponse, FunnelStage, Segment, FunnelCell } from "@/types/funnel";

const SEGMENTS: Segment[] = ["TELKOM_GROUP", "SOE", "PRIVATE", "GOV", "SME_REG", "TOTAL"];
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

const mapSegment = (segmentLabel: string | null | undefined): Segment | null =>
  SEGMENT_NAME_MAP[normalize(segmentLabel)] ?? null;

const mapStage = (stageLabel: string | null | undefined): FunnelStage | null =>
  STAGE_NAME_MAP[normalize(stageLabel)] ?? null;

const createSegmentRecord = <T,>(factory: () => T): Record<Segment, T> =>
  SEGMENTS.reduce((acc, segment) => {
    acc[segment] = factory();
    return acc;
  }, {} as Record<Segment, T>);

const createEmptyFunnelData = (): Funnel2RowsResponse => {
  const stages = STAGES.reduce((acc, stage) => {
    acc[stage] = createSegmentRecord<FunnelCell>(() => ({ valueM: 0, projects: 0 }));
    return acc;
  }, {} as Funnel2RowsResponse["stages"]);

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

const buildDashboardData = (funnelRows: FunnelRow[], lopRows: LopTargetRow[]): Funnel2RowsResponse => {
  const result = createEmptyFunnelData();

  for (const row of funnelRows) {
    const segment = mapSegment(row.segment);
    const stage = mapStage(row.stage);

    if (!segment || !stage) {
      continue;
    }

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

    result.targetRkap[segment] = toNumber(row.target_rkap_m);
    result.targetStg[segment] = toNumber(row.target_stg_m);
    result.kecukupanLop[segment] = {
      valueM: toNumber(row.kecukupan_lop_m),
      pctRkap: toNumber(row.kecukupan_vs_rkap_pct),
      pctStg: toNumber(row.kecukupan_vs_stg_pct),
    };
    result.qualifiedLop[segment] = {
      valueM: toNumber(row.qualified_lop_m),
      pctRkap: toNumber(row.qualified_vs_rkap_pct),
      pctStg: toNumber(row.qualified_vs_stg_pct),
    };
  }

  return result;
};

/**
 * Overview Dashboard Page
 *
 * Main dashboard page that displays the Infomedia sales funnel overview:
 * - Funnel stages (Leads → Prospects → Qualified → Submissions → Win)
 * - 6 customer segments (Telkom Group, SOE, Private, Gov, SME & Reg, Total)
 * - Target RKAP and STG
 * - Kecukupan LOP and Qualified LOP metrics
 */
export default async function Page() {
  const tenantId = await getActiveTenantId();
  const [funnelRows, lopRows] = await Promise.all([
    getFunnelSummaryForTenant(tenantId),
    getLopTargetsForTenant(tenantId),
  ]);
  const dashboardData = buildDashboardData(funnelRows, lopRows);

  return (
    <div className="container mx-auto px-4 py-8">
      <OverviewDashboard data={dashboardData} />
    </div>
  );
}
