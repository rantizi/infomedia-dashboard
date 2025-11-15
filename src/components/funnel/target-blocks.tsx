/* eslint-disable security/detect-object-injection */
/**
 * TargetBlocks Component
 *
 * Renders two target rows:
 * 1. Target RKAP (with red label)
 * 2. Target STG (with grey label)
 *
 * Each row shows values for all 6 segments in millions.
 */

import { cn } from "@/lib/utils";
import { Funnel2RowsResponse, Segment, SEGMENT_LABELS } from "@/types/funnel";

interface TargetBlocksProps {
  data: Funnel2RowsResponse;
}

const SEGMENTS: Segment[] = ["TELKOM_GROUP", "SOE", "PRIVATE", "GOV", "SME_REG", "TOTAL"];

/**
 * Format number as Indonesian currency in millions
 * @example formatValueM(120.00) → "120,00 M"
 */
function formatValueM(value: number): string {
  return `${value.toLocaleString("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} M`;
}

interface TargetRowProps {
  label: string;
  labelColor: "rkap" | "stg";
  values: Record<Segment, number>;
}

/**
 * Single target row (RKAP or STG)
 */
function TargetRow({ label, labelColor, values }: TargetRowProps) {
  const labelClasses: Record<TargetRowProps["labelColor"], string> = {
    rkap: "bg-rose-100/60 border-rose-200/70 text-rose-800 dark:bg-rose-500/25 dark:border-rose-500/40 dark:text-rose-50",
    stg: "bg-white/40 border-slate-200/70 text-slate-900 dark:bg-slate-900/40 dark:border-slate-700/70 dark:text-slate-50",
  };

  return (
    <div
      className="grid gap-px bg-white/50 dark:bg-slate-900/30"
      style={{
        gridTemplateColumns: "180px repeat(6, 1fr)",
      }}
    >
      {/* Label Cell */}
      <div className="flex items-center justify-center bg-white/80 px-4 py-3 dark:bg-slate-950/40">
        <div
          className={cn(
            "inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold shadow-sm backdrop-blur-sm",
            labelClasses[labelColor],
          )}
        >
          {label}
        </div>
      </div>

      {/* Value Cells */}
      {SEGMENTS.map((segment) => (
        <div key={segment} className="flex items-center justify-center bg-white/80 px-4 py-3 dark:bg-slate-950/40">
          <div className="text-base font-semibold text-slate-900 dark:text-slate-50">
            {formatValueM(values[segment])}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * TargetBlocks — Displays Target RKAP and Target STG rows
 *
 * Layout matches the funnel table:
 * - CSS Grid with 7 columns: 1 label column + 6 segment columns
 * - RKAP has red label, STG has grey label
 */
export function TargetBlocks({ data }: TargetBlocksProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Targets</h2>

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

          {/* Target RKAP Row */}
          <TargetRow label="Target RKAP" labelColor="rkap" values={data.targetRkap} />

          {/* Target STG Row */}
          <TargetRow label="Target STG" labelColor="stg" values={data.targetStg} />
        </div>
      </div>
    </div>
  );
}
