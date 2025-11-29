"use client";

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";

import { AnalyticsEmptyState, AnalyticsErrorState } from "./states";
import { formatM, formatPercent, type LopRow } from "./utils";

type QualifiedVsTargetCardProps = {
  data: LopRow[];
  error?: string | null;
};

const chartConfig = {
  target: { label: "Target RKAP", color: "#cbd5e1" },
  qualified: { label: "Qualified LOP", color: "#22c55e" },
} satisfies ChartConfig;

export function QualifiedVsTargetCard({ data, error }: QualifiedVsTargetCardProps) {
  if (error) {
    return <AnalyticsErrorState message={error} />;
  }

  if (data.length === 0) {
    return <AnalyticsEmptyState message="Belum ada data qualified LOP per segmen." />;
  }

  const chartData = data.map((row) => ({
    segment: row.segment,
    target: row.target_rkap_m ?? 0,
    qualified: row.qualified_lop_m ?? 0,
    pct: row.qualified_vs_rkap_pct ?? 0,
  }));

  const maxValue = Math.max(...chartData.map((item) => Math.max(item.target, item.qualified)), 0);
  const xDomain: [number, number] = [0, maxValue > 0 ? maxValue * 1.1 : 1];

  const tooltipContent: TooltipProps<number, string>["content"] = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const item = payload[0]?.payload as (typeof chartData)[number];
    const target = item.target;
    const qualified = item.qualified;
    const pct = target > 0 ? (qualified / target) * 100 : 0;

    return (
      <div className="rounded-lg bg-white px-3 py-2 text-xs shadow-lg">
        <div className="font-medium text-slate-900">{label}</div>
        <div className="mt-1 space-y-1 text-slate-600">
          <div className="flex items-center justify-between gap-6">
            <span>Target RKAP</span>
            <span className="font-mono font-semibold text-slate-900">{formatM(target)}</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span>Qualified LOP</span>
            <span className="font-mono font-semibold text-slate-900">{formatM(qualified)}</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span>Achv.</span>
            <span className="font-semibold text-slate-900">{formatPercent(pct)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full overflow-hidden border-none bg-white shadow-lg">
      <CardHeader className="pb-0">
        <CardTitle className="text-xl font-semibold text-slate-900">Qualified LOP vs RKAP</CardTitle>
        <CardDescription>Fokus pada LOP yang sudah qualified hingga submission/win.</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="relative overflow-x-auto pb-4">
          <div className="min-w-[900px]">
            <ChartContainer config={chartConfig} className="h-[380px]">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 32, right: 24, bottom: 8, left: 0 }}
                barCategoryGap="30%"
                barGap={12}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.35)" vertical={false} />
                <XAxis
                  type="number"
                  domain={xDomain}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => value.toLocaleString("id-ID")}
                />
                <YAxis
                  dataKey="segment"
                  type="category"
                  width={130}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#475569" }}
                />
                <Tooltip cursor={{ fill: "rgba(34, 197, 94, 0.08)" }} content={tooltipContent} />

                <ChartLegend content={<ChartLegendContent />} verticalAlign="top" />

                <Bar dataKey="target" fill="#cbd5e1" radius={[999, 999, 999, 999]} barSize={14} />
                <Bar dataKey="qualified" fill="#22c55e" radius={[999, 999, 999, 999]} barSize={14} />
              </BarChart>
            </ChartContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
