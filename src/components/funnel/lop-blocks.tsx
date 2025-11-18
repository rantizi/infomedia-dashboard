/* eslint-disable security/detect-object-injection */
/**
 * LopBlocks Component
 *
 * Renders two LOP (List of Projects) blocks:
 * 1. Kecukupan LOP
 * 2. Qualified LOP
 *
 * Each block contains:
 * - Row 1: Value in millions for all 6 segments
 * - Row 2: % Terhadap RKAP (percentage vs RKAP target)
 * - Row 3: % Terhadap STG (percentage vs STG target)
 */

import { formatShortMillion, formatPercentInt } from "@/lib/utils";
import { Funnel2RowsResponse, Segment, SEGMENT_LABELS } from "@/types/funnel";

interface LopBlocksProps {
  data: Funnel2RowsResponse;
}

const SEGMENTS: Segment[] = ["TELKOM_GROUP", "SOE", "PRIVATE", "GOV", "SME_REG", "TOTAL"];

interface LopBlockProps {
  title: string;
  data: Funnel2RowsResponse["kecukupanLop"] | Funnel2RowsResponse["qualifiedLop"];
}

/**
 * Single LOP block (Kecukupan or Qualified)
 */
function LopBlock({ title, data }: LopBlockProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">{title}</h3>

      <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white/80 p-1 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/60">
        <div className="min-w-[900px]">
          {/* Header Row */}
          <div
            className="grid gap-px border-b border-slate-200/70 bg-white/60 dark:border-slate-800/60 dark:bg-slate-900/40"
            style={{
              gridTemplateColumns: "180px repeat(6, 1fr)",
            }}
          >
            <div className="px-4 py-2">{/* Empty cell for top-left corner */}</div>
            {SEGMENTS.map((segment) => (
              <div
                key={segment}
                className="px-4 py-2 text-center text-sm font-semibold text-slate-600 dark:text-slate-200"
              >
                {SEGMENT_LABELS[segment]}
              </div>
            ))}
          </div>

          {/* Value Row */}
          <div
            className="grid gap-px bg-white/50 dark:bg-slate-900/30"
            style={{
              gridTemplateColumns: "180px repeat(6, 1fr)",
            }}
          >
            <div className="flex items-center bg-white/80 px-4 py-3 dark:bg-slate-950/40">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Nilai</span>
            </div>
            {SEGMENTS.map((segment) => (
              <div
                key={segment}
                className="flex items-center justify-center bg-white/80 px-4 py-3 dark:bg-slate-950/40"
              >
                <div className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  {formatShortMillion(data[segment].valueM)}
                </div>
              </div>
            ))}
          </div>

          {/* % Terhadap RKAP Row */}
          <div
            className="grid gap-px bg-white/40 dark:bg-slate-900/25"
            style={{
              gridTemplateColumns: "180px repeat(6, 1fr)",
            }}
          >
            <div className="flex items-center bg-white/80 px-4 py-3 dark:bg-slate-950/30">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">% Terhadap RKAP</span>
            </div>
            {SEGMENTS.map((segment) => (
              <div
                key={segment}
                className="flex items-center justify-center bg-white/80 px-4 py-3 dark:bg-slate-950/30"
              >
                <div className="text-sm font-semibold text-blue-600 dark:text-blue-300">
                  {formatPercentInt(data[segment].pctRkap)}
                </div>
              </div>
            ))}
          </div>

          {/* % Terhadap STG Row */}
          <div
            className="grid gap-px bg-white/50 dark:bg-slate-900/30"
            style={{
              gridTemplateColumns: "180px repeat(6, 1fr)",
            }}
          >
            <div className="flex items-center bg-white/80 px-4 py-3 dark:bg-slate-950/40">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">% Terhadap STG</span>
            </div>
            {SEGMENTS.map((segment) => (
              <div
                key={segment}
                className="flex items-center justify-center bg-white/80 px-4 py-3 dark:bg-slate-950/40"
              >
                <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                  {formatPercentInt(data[segment].pctStg)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * LopBlocks — Displays Kecukupan LOP and Qualified LOP sections
 *
 * Each section contains:
 * - Value row (in millions)
 * - Percentage vs RKAP row
 * - Percentage vs STG row
 *
 * Layout matches the funnel table with 7 columns total.
 */
export function LopBlocks({ data }: LopBlocksProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">List of Projects (LOP)</h2>

      <LopBlock title="Kecukupan LOP" data={data.kecukupanLop} />
      <LopBlock title="Qualified LOP" data={data.qualifiedLop} />
    </div>
  );
}
