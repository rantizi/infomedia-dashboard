/**
 * Type definitions for the Infomedia Sales Funnel Dashboard.
 */

export type FunnelStage = "leads" | "prospect" | "qualified" | "submission" | "win";

export type Segment = "TELKOM_GROUP" | "SOE" | "PRIVATE" | "GOV" | "SME_REG" | "TOTAL";

export const SEGMENT_ORDER: Segment[] = ["TELKOM_GROUP", "SOE", "PRIVATE", "GOV", "SME_REG", "TOTAL"];

export const SEGMENT_LABELS: Record<Segment, string> = {
  TELKOM_GROUP: "Telkom Group",
  SOE: "SOE",
  PRIVATE: "Private",
  GOV: "Gov",
  SME_REG: "SME & Reg",
  TOTAL: "Total",
};

export const FUNNEL_STAGE_LABELS: Record<FunnelStage, string> = {
  leads: "Leads",
  prospect: "Prospects",
  qualified: "Qualified",
  submission: "Submissions",
  win: "Win",
};

export type StageKpi = {
  stage: FunnelStage;
  value_m: number;
  projects: number;
};

export type SegmentStageRecord = {
  [K in FunnelStage]: {
    value_m: number;
    projects: number;
  };
};

export interface SegmentFunnel {
  segment: string;
  stages: SegmentStageRecord;
  year?: number;
}

export interface FunnelResponse {
  rows: SegmentFunnel[];
  year: number;
  hasData?: boolean;
}

export interface FunnelApiResponse extends FunnelResponse {
  // Backward compatibility: some callers still expect `data`
  data?: SegmentFunnel[];
}

export type LopTargetRow = {
  segment: string;
  target_rkap_m: number;
  target_stg_m: number;
  lop_value_m: number;
  qualified_lop_m: number;
  year?: number;
};

export type LopTargetsApiResponse = {
  data: LopTargetRow[];
  year: number;
  hasData: boolean;
};

/**
 * Each cell in the funnel table has two values:
 * - valueM: value in millions (e.g., 18.45 for "18,45 M")
 * - projects: number of projects (e.g., 26 for "26 projek")
 */
export interface FunnelCell {
  valueM: number;
  projects: number;
}

/**
 * Response from GET /api/funnel-2rows
 * Contains data for all 6 segments, organized by stage.
 */
export interface Funnel2RowsResponse {
  // Funnel stages data: each stage has data for all 6 segments
  stages: {
    [K in FunnelStage]: {
      [S in Segment]: FunnelCell;
    };
  };

  // Target RKAP: values for each segment (in Millions)
  targetRkap: {
    [S in Segment]: number;
  };

  // Target STG: values for each segment (in Millions)
  targetStg: {
    [S in Segment]: number;
  };

  // Kecukupan LOP: value + percentages for each segment
  kecukupanLop: {
    [S in Segment]: {
      valueM: number;
      pctRkap: number;
      pctStg: number;
    };
  };

  // Qualified LOP: value + percentages for each segment
  qualifiedLop: {
    [S in Segment]: {
      valueM: number;
      pctRkap: number;
      pctStg: number;
    };
  };
}
