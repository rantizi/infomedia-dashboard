"use client";

import { Cell, Label, Pie, PieChart, Tooltip as RechartsTooltip, type TooltipProps } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

import { AnalyticsEmptyState, AnalyticsErrorState } from "./states";
import { formatM, formatPercent, type LopRow } from "./utils";

type LopShareDonutCardProps = {
  data: LopRow[];
  totalValue?: number;
  year: number;
  error?: string | null;
};

const gradientPalette = [
  ["#6366f1", "#8b5cf6"],
  ["#22c55e", "#14b8a6"],
  ["#06b6d4", "#0ea5e9"],
  ["#f59e0b", "#f97316"],
  ["#f43f5e", "#ec4899"],
  ["#0ea5e9", "#6366f1"],
];

export function LopShareDonutCard({ data, totalValue, year, error }: LopShareDonutCardProps) {
  if (error) {
    return <AnalyticsErrorState message={error} />;
  }

  if (data.length === 0) {
    return <AnalyticsEmptyState message="Belum ada distribusi LOP per segmen." />;
  }

  const chartData = data.map((row, index) => ({
    name: row.segment,
    value: row.kecukupan_lop_m ?? 0,
    gradientId: `donut-${row.segment}-${index}`,
    colors: gradientPalette[index % gradientPalette.length],
  }));

  const computedTotal = totalValue ?? chartData.reduce((sum, item) => sum + item.value, 0);

  const chartConfig = chartData.reduce<ChartConfig>((acc, item) => {
    acc[item.name] = { label: item.name, color: item.colors[0] };
    return acc;
  }, {});

  const tooltipContent: TooltipProps<number, string>["content"] = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const item = payload[0];
    const name = String(item.name ?? item.payload?.name ?? "");
    const value = typeof item.value === "number" ? item.value : Number(item.value);
    const percent = computedTotal > 0 ? (value / computedTotal) * 100 : 0;

    return (
      <div className="rounded-lg bg-white px-3 py-2 text-xs shadow-lg">
        <div className="font-medium text-slate-900">{name}</div>
        <div className="mt-1 space-y-1 text-slate-600">
          <div className="flex items-center justify-between gap-4">
            <span>LOP</span>
            <span className="font-mono font-semibold text-slate-900">{formatM(value)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Kontribusi</span>
            <span className="font-semibold text-slate-900">{percent.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full overflow-hidden border-none bg-white/80 shadow-lg">
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-slate-900">LOP Contribution by Segment</CardTitle>
            <CardDescription>Kontribusi nilai LOP per segmen di tahun {year}.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <ChartContainer config={chartConfig} className="h-[340px]">
            <PieChart>
              <defs>
                {chartData.map((item) => (
                  <linearGradient key={item.gradientId} id={item.gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={item.colors[0]} />
                    <stop offset="100%" stopColor={item.colors[1]} />
                  </linearGradient>
                ))}
              </defs>
              <RechartsTooltip cursor={false} content={tooltipContent} />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                outerRadius={120}
                paddingAngle={4}
                stroke="transparent"
              >
                {chartData.map((item) => (
                  <Cell key={item.gradientId} fill={`url(#${item.gradientId})`} />
                ))}
                <Label
                  position="center"
                  content={({ viewBox }) => {
                    if (
                      !viewBox ||
                      !("cx" in viewBox) ||
                      !("cy" in viewBox) ||
                      typeof viewBox.cx !== "number" ||
                      typeof viewBox.cy !== "number"
                    )
                      return null;
                    const { cx, cy } = viewBox;
                    return (
                      <g>
                        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-slate-500 text-xs font-medium">
                          Total LOP
                        </text>
                        <text x={cx} y={cy + 14} textAnchor="middle" className="fill-slate-900 text-lg font-semibold">
                          {formatM(computedTotal)}
                        </text>
                      </g>
                    );
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>

          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">Legend</p>
            {chartData.map((item) => {
              const pct = computedTotal > 0 ? (item.value / computedTotal) * 100 : 0;
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/80 px-4 py-3 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${item.colors[0]}, ${item.colors[1]})` }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">{formatPercent(pct)}</p>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-semibold text-slate-900">{formatM(item.value)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
