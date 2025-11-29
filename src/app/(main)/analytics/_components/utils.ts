export const STAGE_ORDER = ["leads", "prospect", "qualified", "submission", "win"] as const;

export type StageKey = (typeof STAGE_ORDER)[number];

export type FunnelRow = {
  segment: string;
  stage: string;
  project_count: number | null;
  total_m: number | null;
};

export type LopRow = {
  segment: string;
  year: number;
  target_rkap_m: number | null;
  target_stg_m: number | null;
  kecukupan_lop_m: number | null;
  qualified_lop_m: number | null;
  kecukupan_vs_rkap_pct: number | null;
  kecukupan_vs_stg_pct: number | null;
  qualified_vs_rkap_pct: number | null;
  qualified_vs_stg_pct: number | null;
};

export const formatM = (value: number): string => {
  const formatter = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
  return `${formatter.format(value)} M`;
};

export const formatPercent = (value: number): string => `${value.toFixed(1)}%`;

export const formatProjects = (count: number): string => `${count.toLocaleString("id-ID")} projek`;

export const stageLabel = (stage: string): string => {
  if (!stage) return "N/A";
  return stage.charAt(0).toUpperCase() + stage.slice(1);
};

export const sortByStageOrder = <T extends { stage: string }>(rows: T[]): T[] => {
  const order = new Map(STAGE_ORDER.map((value, index) => [value, index]));
  return [...rows].sort((a, b) => {
    const rankA = order.get(a.stage as StageKey) ?? Number.MAX_SAFE_INTEGER;
    const rankB = order.get(b.stage as StageKey) ?? Number.MAX_SAFE_INTEGER;
    return rankA - rankB;
  });
};
