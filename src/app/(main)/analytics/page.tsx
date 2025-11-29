import Link from "next/link";

import { ArrowUpRight, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createServerClient } from "@/lib/supabase";
import { getActiveTenantId } from "@/server/server-actions";

import { AnalyticsKpiGrid } from "./_components/analytics-kpi-grid";
import { FunnelChartCard } from "./_components/funnel-chart-card";
import { LopShareDonutCard } from "./_components/lop-share-donut-card";
import { LopVsTargetCard } from "./_components/lop-vs-target-card";
import { QualifiedVsTargetCard } from "./_components/qualified-vs-target-card";
import { AnalyticsEmptyState, AnalyticsErrorState, UploadCta } from "./_components/states";
import { STAGE_ORDER, sortByStageOrder, type FunnelRow, type LopRow } from "./_components/utils";

const YEAR = 2026;

const normalizeStage = (stage: string | null | undefined): string =>
  typeof stage === "string" ? stage.toLowerCase() : "";

type AnalyticsData = {
  totalSegmentRow?: LopRow;
  perSegmentLop: LopRow[];
  totalFunnelByStage: { stage: string; value: number; projects: number }[];
  totalProjects: number;
  funnelErrorMessage: string | null;
  lopErrorMessage: string | null;
  allEmpty: boolean;
};

const loadAnalyticsData = async (): Promise<AnalyticsData> => {
  const supabase = await createServerClient();
  const tenantId = await getActiveTenantId();

  const [{ data: funnelRows, error: funnelError }, { data: lopRows, error: lopError }] = await Promise.all([
    supabase
      .from("vw_funnel_kpi_per_segment")
      .select("segment, stage, project_count, total_m")
      .eq("tenant_id", tenantId),
    supabase
      .from("vw_lop_vs_target_per_segment")
      .select(
        "segment, year, target_rkap_m, target_stg_m, kecukupan_lop_m, qualified_lop_m, kecukupan_vs_rkap_pct, qualified_vs_rkap_pct",
      )
      .eq("tenant_id", tenantId)
      .eq("year", YEAR),
  ]);

  const safeFunnelRows = (funnelRows ?? []).map((row) => ({ ...row, stage: normalizeStage(row.stage) })) as FunnelRow[];
  const safeLopRows = (lopRows ?? []) as LopRow[];

  const totalSegmentRow = safeLopRows.find((row) => row.segment === "Total");
  const perSegmentLop = safeLopRows.filter((row) => row.segment !== "Total");

  const totalFunnelByStage = sortByStageOrder(
    safeFunnelRows
      .filter((row) => row.segment === "Total")
      .map((row) => ({
        stage: row.stage,
        value: row.total_m ?? 0,
        projects: row.project_count ?? 0,
      })),
  );

  const totalProjects = totalFunnelByStage.reduce((sum, item) => sum + item.projects, 0);

  const funnelErrorMessage = funnelError?.message ?? null;
  const lopErrorMessage = lopError?.message ?? null;
  const hasError = Boolean(funnelErrorMessage ?? lopErrorMessage);
  const allEmpty = !hasError && safeFunnelRows.length === 0 && safeLopRows.length === 0;

  return {
    totalSegmentRow,
    perSegmentLop,
    totalFunnelByStage,
    totalProjects,
    funnelErrorMessage,
    lopErrorMessage,
    allEmpty,
  };
};

export default async function AnalyticsPage() {
  const {
    totalSegmentRow,
    perSegmentLop,
    totalFunnelByStage,
    totalProjects,
    funnelErrorMessage,
    lopErrorMessage,
    allEmpty,
  } = await loadAnalyticsData();

  return (
    <div className="container mx-auto space-y-8 px-2 py-4 sm:px-4 md:px-0">
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.65)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-slate-600 uppercase shadow-sm">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              Analytics
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl leading-tight font-bold text-slate-900">Analytics {YEAR}</h1>
              <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 shadow-sm">
                STAGE ORDER: {STAGE_ORDER.join(" -> ")}
              </Badge>
            </div>
            <p className="max-w-3xl text-sm text-slate-600">
              LOP & funnel overview untuk seluruh segmen menggunakan nilai {YEAR}. Visual modern dengan gradient halus
              dan insight yang siap dibagikan.
            </p>
          </div>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/add-data">
              Tambah Data
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {allEmpty ? (
        <div className="space-y-3">
          <AnalyticsEmptyState message="Belum ada data funnel atau LOP untuk ditampilkan. Unggah data terlebih dahulu." />
          <UploadCta />
        </div>
      ) : (
        <>
          {lopErrorMessage ? (
            <AnalyticsErrorState message={lopErrorMessage} />
          ) : (
            <AnalyticsKpiGrid totalRow={totalSegmentRow} />
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <FunnelChartCard data={totalFunnelByStage} totalProjects={totalProjects} error={funnelErrorMessage} />
            <LopVsTargetCard data={perSegmentLop} error={lopErrorMessage} />
            <LopShareDonutCard
              data={perSegmentLop}
              totalValue={totalSegmentRow?.kecukupan_lop_m ?? 0}
              error={lopErrorMessage}
            />
            <QualifiedVsTargetCard data={perSegmentLop} error={lopErrorMessage} />
          </div>
        </>
      )}
    </div>
  );
}
