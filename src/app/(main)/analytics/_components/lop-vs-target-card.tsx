"use client";

import { Bar, BarChart, CartesianGrid, LabelList, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import { AnalyticsEmptyState, AnalyticsErrorState } from "./states";
import { formatM, formatMPlain, formatPercent, type LopRow } from "./utils";

type LopVsTargetCardProps = {
  data: LopRow[];
  year: number;
  error?: string | null;
};

export function LopVsTargetCard({ data, year, error }: LopVsTargetCardProps) {
  if (error) {
    return <AnalyticsErrorState message={error} />;
  }

  if (data.length === 0) {
    return <AnalyticsEmptyState message="Belum ada data LOP vs target per segmen." />;
  }

  const chartConfig = {
    target: {
      label: "Target RKAP",
      color: "#cbd5e1",
    },
    lop: {
      label: `LOP ${year}`,
      color: "#3b82f6",
    },
  } satisfies ChartConfig;

  const chartData = data.map((row) => ({
    segment: row.segment,
    target: row.target_rkap_m ?? 0,
    lop: row.kecukupan_lop_m ?? 0,
    pct: row.kecukupan_vs_rkap_pct ?? 0,
  }));

  return (
    <Card className="h-full border-none bg-white/80 shadow-lg">
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-slate-900">LOP vs Target RKAP per Segment</CardTitle>
            <CardDescription>Seberapa jauh pipeline memenuhi target RKAP {year}.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="relative overflow-x-auto pb-4">
          <div className="min-w-[1100px]">
            <ChartContainer config={chartConfig} className="h-[420px]">
              <BarChart
                data={chartData}
                layout="vertical"
                stackOffset="none"
                margin={{ top: 8, right: 80, bottom: 8, left: 0 }}
                barCategoryGap="28%"
                barGap={-12}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.35)" vertical={false} />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatMPlain(value)}
                  label={{ value: "Nilai (M)", position: "insideBottomRight", offset: -4, fill: "#64748b" }}
                />
                <YAxis
                  dataKey="segment"
                  type="category"
                  width={130}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#475569" }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(59, 130, 246, 0.08)" }}
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => {
                        const numericValue = typeof value === "number" ? value : Number(value);
                        if (name === "pct") {
                          return formatPercent(numericValue);
                        }
                        return formatM(numericValue);
                      }}
                      nameKey="segment"
                      labelFormatter={(label) => String(label)}
                    />
                  }
                />

                <Bar dataKey="target" fill="#cbd5e1" radius={[10, 10, 10, 10]} maxBarSize={28} background />
                <Bar dataKey="lop" fill="#3b82f6" radius={[10, 10, 10, 10]} maxBarSize={20}>
                  <LabelList
                    dataKey="pct"
                    position="right"
                    className="fill-slate-900 text-xs font-semibold"
                    formatter={(value: number) => formatPercent(value)}
                  />
                </Bar>

                <ChartLegend content={<ChartLegendContent />} verticalAlign="bottom" />
              </BarChart>
            </ChartContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
