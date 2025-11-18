import { createServerClient } from "@/lib/supabase";

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
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("vw_funnel_kpi_per_segment")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("segment", { ascending: true })
    .order("stage", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as FunnelRow[];
}

/**
 * Fetch the LOP vs Target metrics for a tenant for a specific year (default 2026).
 */
export async function getLopTargetsForTenant(tenantId: string, year = 2026): Promise<LopTargetRow[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("vw_lop_vs_target_per_segment")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("year", year)
    .order("segment", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as LopTargetRow[];
}

