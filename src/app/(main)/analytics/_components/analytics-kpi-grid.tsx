import { Activity, CheckCircle2, Target, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { formatM, formatPercent, type LopRow } from "./utils";

type AnalyticsKpiGridProps = {
  totalRow?: LopRow;
  year: number;
};

const gradientClasses = [
  "from-indigo-500/15 via-violet-500/10 to-cyan-400/15",
  "from-emerald-500/15 via-teal-400/10 to-sky-400/15",
  "from-amber-400/20 via-orange-400/10 to-rose-400/15",
  "from-fuchsia-500/15 via-purple-500/10 to-indigo-400/15",
];

export function AnalyticsKpiGrid({ totalRow, year }: AnalyticsKpiGridProps) {
  const kpiItems = [
    {
      title: `Total LOP ${year}`,
      value: totalRow ? formatM(totalRow.kecukupan_lop_m ?? 0) : "--",
      subtitle: "Total pipeline (all stages)",
      icon: Activity,
    },
    {
      title: `Target RKAP ${year}`,
      value: totalRow ? formatM(totalRow.target_rkap_m ?? 0) : "--",
      subtitle: `Target RKAP ${year}`,
      icon: Target,
    },
    {
      title: "Qualified LOP",
      value: totalRow ? formatM(totalRow.qualified_lop_m ?? 0) : "--",
      subtitle: "Qualified + Submission + Win",
      icon: CheckCircle2,
    },
    {
      title: "Kecukupan vs RKAP",
      value: totalRow ? formatPercent(totalRow.kecukupan_vs_rkap_pct ?? 0) : "--",
      subtitle: `LOP vs RKAP ${year}`,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {kpiItems.map((item, index) => {
        const gradient = gradientClasses.at(index % gradientClasses.length) ?? gradientClasses[0];
        const Icon = item.icon;
        return (
          <Card key={item.title} className="relative overflow-hidden border-none bg-white/80 shadow-lg">
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradient}`} />
            <div className="absolute top-4 right-4 h-20 w-20 rounded-full bg-white/60 blur-3xl" />
            <CardContent className="relative space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-600 uppercase">Nilai {year}</p>
                  <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-600">{item.subtitle}</p>
                </div>
                <div className="rounded-xl bg-white/70 p-3 text-indigo-600 shadow-sm backdrop-blur">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-semibold tracking-tight text-slate-900">{item.value}</div>
                <Badge variant="secondary" className="bg-white/70 text-indigo-700 shadow-sm">
                  Menggunakan Nilai {year}
                </Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
