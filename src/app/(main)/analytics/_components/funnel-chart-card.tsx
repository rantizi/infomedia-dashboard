"use client";

import { Bar, BarChart, CartesianGrid, Label, LabelList, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

import { AnalyticsEmptyState, AnalyticsErrorState } from "./states";
import { formatM, formatMPlain, formatProjects, sortByStageOrder, stageLabel, type StageKey } from "./utils";

type FunnelChartCardProps = {
  data: {
    stage: StageKey | string;
    value: number;
    projects: number;
  }[];
  totalProjects: number;
  error?: string | null;
};

const buildChartConfig = (entries: FunnelChartCardProps["data"]): ChartConfig => {
  const config: ChartConfig = {};
  entries.forEach((item) => {
    config[item.stage] = { label: stageLabel(item.stage), color: "#ef4444" };
  });
  return config;
};

export function FunnelChartCard({ data, totalProjects, error }: FunnelChartCardProps) {
  if (error) {
    return <AnalyticsErrorState message={error} />;
  }

  const sortedData = sortByStageOrder(data);

  if (sortedData.length === 0) {
    return <AnalyticsEmptyState message="Belum ada data funnel untuk segmen Total." />;
  }

  const chartConfig = buildChartConfig(sortedData);

  const tooltipContent: TooltipProps<number, string>["content"] = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const item = payload[0];
    const value = typeof item.value === "number" ? item.value : Number(item.value);
    const projects = typeof item.payload?.projects === "number" ? item.payload.projects : 0;

    return (
      <div className="rounded-lg bg-white px-3 py-2 text-xs shadow-lg">
        <div className="font-medium text-slate-900">{stageLabel(String(label ?? ""))}</div>
        <div className="mt-1 space-y-1 text-slate-600">
          <div className="flex items-center justify-between gap-6">
            <span>Nilai</span>
            <span className="font-mono font-semibold text-slate-900">{formatM(value)}</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span>Projek</span>
            <span className="font-mono font-semibold text-slate-900">{formatProjects(projects)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full border-none bg-white/80 shadow-lg">
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-slate-900">Sales Pipeline (All Segments)</CardTitle>
            <CardDescription>
              Total projek: <span className="font-semibold text-slate-900">{formatProjects(totalProjects)}</span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="relative overflow-x-auto pb-4">
          <div className="min-w-[900px]">
            <ChartContainer config={chartConfig} className="h-[360px]">
              <BarChart
                data={sortedData}
                layout="vertical"
                margin={{ top: 12, right: 24, bottom: 12, left: 0 }}
                barCategoryGap={18}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.35)" vertical={false} />
                <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(value) => formatMPlain(value)}>
                  <Label
                    value="Nilai (M)"
                    position="insideBottomRight"
                    offset={-6}
                    className="fill-slate-500 text-[11px]"
                  />
                </XAxis>
                <YAxis
                  dataKey="stage"
                  type="category"
                  width={120}
                  tickFormatter={(value) => stageLabel(String(value ?? ""))}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#475569" }}
                />

                <Tooltip cursor={{ fill: "rgba(239, 68, 68, 0.06)" }} content={tooltipContent} />

                <Bar dataKey="value" fill="#ef4444" radius={[12, 12, 12, 12]} maxBarSize={28}>
                  <LabelList
                    dataKey="value"
                    position="right"
                    className="fill-slate-800 text-xs font-semibold"
                    formatter={(value: number) => formatM(value)}
                  />
                  <LabelList
                    dataKey="projects"
                    position="insideLeft"
                    className="fill-white text-[10px] font-medium"
                    formatter={(value: number) => formatProjects(value)}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
