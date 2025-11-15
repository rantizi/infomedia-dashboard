/**
 * FunnelTable Component
 *
 * Renders the main funnel table with:
 * - 5 rows (Leads, Prospects, Qualified, Submissions, Win)
 * - 6 columns (Telkom Group, SOE, Private, Gov, SME & Reg, Total)
 * - Each cell displays: top line = value in Millions, bottom line = project count
 */

import { Funnel2RowsResponse, Segment, FunnelStage, SEGMENT_LABELS, FUNNEL_STAGE_LABELS } from "@/types/funnel";
import { cn } from "@/lib/utils";

interface FunnelTableProps {
  data: Funnel2RowsResponse;
}

const SEGMENTS: Segment[] = ["TELKOM_GROUP", "SOE", "PRIVATE", "GOV", "SME_REG", "TOTAL"];

const STAGES: FunnelStage[] = ["leads", "prospect", "qualified", "submission", "win"];

const stageBadgeBase =
  "inline-flex min-w-[120px] items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold backdrop-blur-sm shadow-sm";

const stageColorClasses: Record<FunnelStage, string> = {
  leads:
    "bg-violet-100/60 border-violet-200/70 text-violet-800 dark:bg-violet-500/20 dark:border-violet-500/40 dark:text-violet-100",
  prospect:
    "bg-blue-100/60 border-blue-200/70 text-blue-800 dark:bg-blue-500/20 dark:border-blue-500/40 dark:text-blue-100",
  qualified:
    "bg-emerald-100/60 border-emerald-200/70 text-emerald-800 dark:bg-emerald-500/20 dark:border-emerald-500/40 dark:text-emerald-100",
  submission:
    "bg-amber-100/60 border-amber-200/70 text-amber-800 dark:bg-amber-500/20 dark:border-amber-500/40 dark:text-amber-100",
  win: "bg-orange-100/60 border-orange-200/70 text-orange-800 dark:bg-orange-500/20 dark:border-orange-500/40 dark:text-orange-100",
};

/**
 * Format number as Indonesian currency in millions
 * @example formatValueM(18.45) → "18,45 M"
 */
function formatValueM(value: number): string {
  return `${value.toLocaleString("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} M`;
}

/**
 * Format project count
 * @example formatProjects(26) → "26 projek"
 */
function formatProjects(count: number): string {
  return `${count} projek`;
}

/**
 * Stage label pill with color coding
 */
function StageLabel({ stage }: { stage: FunnelStage }) {
  return <span className={cn(stageBadgeBase, stageColorClasses[stage])}>{FUNNEL_STAGE_LABELS[stage]}</span>;
}

/**
 * FunnelTable — Main funnel visualization table
 *
 * Layout:
 * - CSS Grid with 7 columns: 1 label column + 6 segment columns
 * - First column is fixed width for stage labels
 * - Remaining 6 columns are flexible/equal width
 * - Each cell contains two lines: bold value + lighter project count
 */
export function FunnelTable({ data }: FunnelTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white/80 p-1 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/60">
      <div className="min-w-[900px]">
        {/* Header Row */}
        <div
          className="grid gap-px border-b border-slate-200/70 bg-white/60 dark:border-slate-800/60 dark:bg-slate-900/40"
          style={{
            gridTemplateColumns: "180px repeat(6, 1fr)",
          }}
        >
          <div className="px-4 py-3">{/* Empty cell for top-left corner */}</div>
          {SEGMENTS.map((segment) => (
            <div key={segment} className="px-4 py-3 text-center text-sm font-semibold text-slate-600 dark:text-slate-200">
              {SEGMENT_LABELS[segment]}
            </div>
          ))}
        </div>

        {/* Stage Rows */}
        {STAGES.map((stage, stageIndex) => (
          <div
            key={stage}
            className={cn(
              "grid gap-px",
              stageIndex % 2 === 0 ? "bg-white/60 dark:bg-slate-900/40" : "bg-white/40 dark:bg-slate-900/25",
            )}
            style={{
              gridTemplateColumns: "180px repeat(6, 1fr)",
            }}
          >
            {/* Stage Label Cell */}
            <div className="flex items-center justify-center bg-white/80 px-4 py-4 dark:bg-slate-950/30">
              <StageLabel stage={stage} />
            </div>

            {/* Data Cells */}
            {SEGMENTS.map((segment) => {
              const cellData = data.stages[stage][segment];
              return (
                <div
                  key={segment}
                  className="flex flex-col items-center justify-center bg-white/80 px-4 py-4 text-center dark:bg-slate-950/40"
                >
                  {/* Value in Millions (bold) */}
                  <div className="text-base font-semibold text-slate-900 dark:text-slate-50">{formatValueM(cellData.valueM)}</div>
                  {/* Project count (lighter) */}
                  <div className="text-sm text-slate-500 dark:text-slate-400">{formatProjects(cellData.projects)}</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
