/* eslint-disable security/detect-object-injection */
import { formatToBillionM } from "@/lib/format-utils";
import { cn } from "@/lib/utils";
import type { FunnelStage, SegmentFunnel, SegmentStageRecord } from "@/types/funnel";

import { SEGMENT_LABEL_OVERRIDES, isValidSegment, normalizeSegment, type UiSegment } from "./segment-utils";

interface FunnelTableProps {
  data: SegmentFunnel[];
  segments: UiSegment[];
  activeSegment?: UiSegment;
  columnTemplate?: string;
  variant?: "card" | "embedded";
}

const STAGES: FunnelStage[] = ["leads", "prospect", "qualified", "submission", "win"];
type StageTotal = SegmentStageRecord[FunnelStage];

const stageBadgeBase =
  "inline-flex min-w-[120px] items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold shadow-sm";

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

const STAGE_LABELS: Record<FunnelStage, string> = {
  leads: "Leads",
  prospect: "Prospects",
  qualified: "Qualified",
  submission: "Submissions",
  win: "Win",
};

const formatProjects = (count: number): string => {
  const safeCount = Number.isFinite(count) ? Math.round(count) : 0;
  return `${safeCount.toLocaleString("id-ID")} projek`;
};

const computeFullTotals = (segmentLookup: Map<string, SegmentStageRecord>): Map<string, StageTotal> => {
  const totals = new Map<string, StageTotal>();

  segmentLookup.forEach((stages, segment) => {
    const totalForSegment = STAGES.reduce<StageTotal>(
      (acc, stage) => {
        const stageData = stages[stage];
        return {
          value_m: acc.value_m + stageData.value_m,
          projects: acc.projects + stageData.projects,
        };
      },
      { value_m: 0, projects: 0 },
    );

    totals.set(segment, totalForSegment);
  });

  return totals;
};

/**
 * Stage label pill with color coding
 */
function StageLabel({ stage }: { stage: FunnelStage }) {
  return <span className={cn(stageBadgeBase, stageColorClasses[stage])}>{STAGE_LABELS[stage]}</span>;
}

const totalHeaderClasses = "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-100";
const totalCellClasses =
  "border border-blue-100 bg-blue-50/70 text-blue-800 dark:border-blue-800 dark:bg-blue-900/40 dark:text-blue-100";
const totalValueClasses = "text-blue-800 dark:text-blue-100";

/**
 * FunnelTable - Main funnel visualization table
 *
 * Layout:
 * - CSS Grid with a fixed stage column + one column per visible segment
 * - First column is fixed width for stage labels
 * - Segment columns share equal widths
 * - Each cell contains two lines: bold value + lighter project count
 */
export function FunnelTable({ data, segments, activeSegment, columnTemplate, variant = "card" }: FunnelTableProps) {
  const segmentLookup = new Map<string, SegmentStageRecord>(
    data
      .filter((segment) => isValidSegment(segment.segment))
      .map((segment) => [normalizeSegment(segment.segment), segment.stages]),
  );
  const activeNormalized = activeSegment ? normalizeSegment(activeSegment) : null;
  const fullTotals = computeFullTotals(segmentLookup);
  const gridTemplateColumns = columnTemplate ?? `180px repeat(${segments.length}, 1fr)`;

  const tableContent = (
    <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/80">
      <div
        className="grid gap-px border-b border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50"
        style={{ gridTemplateColumns }}
      >
        <div className="px-4 py-3">{/* Empty cell for top-left corner */}</div>
        {segments.map((segment) => {
          const normalized = normalizeSegment(segment);
          const isActive = activeNormalized === normalized;
          const isTotalColumn = normalized === "total";
          return (
            <div
              key={segment}
              className={cn(
                "border border-transparent px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-100",
                isActive && "rounded-t-md bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-50",
                isTotalColumn && totalHeaderClasses,
              )}
            >
              {SEGMENT_LABEL_OVERRIDES[normalized] ?? segment}
            </div>
          );
        })}
      </div>

      {/* Stage Rows */}
      {STAGES.map((stage, stageIndex) => (
        <div
          key={stage}
          className={cn(
            "grid gap-px",
            stageIndex % 2 === 0 ? "bg-slate-100/60 dark:bg-slate-800/40" : "bg-slate-50/70 dark:bg-slate-900/30",
          )}
          style={{
            gridTemplateColumns,
          }}
        >
          {/* Stage Label Cell */}
          <div className="flex items-center justify-center bg-white px-4 py-4 dark:bg-slate-950/60">
            <StageLabel stage={stage} />
          </div>

          {/* Data Cells */}
          {segments.map((segment) => {
            const normalized = normalizeSegment(segment);
            const stageData = segmentLookup.get(normalized)?.[stage] ?? { value_m: 0, projects: 0 };
            const isActive = activeNormalized === normalized;
            const isTotalColumn = normalized === "total";
            return (
              <div
                key={segment}
                className={cn(
                  "flex flex-col items-center justify-center border border-transparent bg-white px-4 py-4 text-center text-slate-700 dark:bg-slate-950/60 dark:text-slate-200",
                  isActive &&
                    "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-700/60 dark:bg-blue-900/40 dark:text-blue-50",
                  isTotalColumn && totalCellClasses,
                )}
              >
                {/* Value in Millions (bold) */}
                <div
                  className={cn(
                    "text-base font-semibold text-slate-900 dark:text-slate-50",
                    isActive && "text-blue-800 dark:text-blue-50",
                    isTotalColumn && totalValueClasses,
                  )}
                >
                  {formatToBillionM(stageData.value_m)}
                </div>
                {/* Project count (lighter) */}
                <div
                  className={cn(
                    "text-sm text-slate-500 dark:text-slate-400",
                    isActive && "text-blue-700 dark:text-blue-100",
                    isTotalColumn && totalValueClasses,
                  )}
                >
                  {formatProjects(stageData.projects)}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Full Funnel Total Row */}
      <div
        className="grid gap-px bg-slate-100 dark:bg-slate-900/60"
        style={{
          gridTemplateColumns,
        }}
      >
        <div className="flex items-center justify-center bg-slate-50 px-4 py-4 text-center text-base font-semibold text-slate-900 dark:bg-slate-950/70 dark:text-slate-50">
          Total Funnel
        </div>

        {segments.map((segment) => {
          const normalized = normalizeSegment(segment);
          const totals = fullTotals.get(normalized) ?? { value_m: 0, projects: 0 };
          const isActive = activeNormalized === normalized;
          const isTotalColumn = normalized === "total";

          return (
            <div
              key={segment}
              className={cn(
                "flex flex-col items-center justify-center border border-transparent bg-slate-50 px-4 py-4 text-center text-slate-700 dark:bg-slate-950/70 dark:text-slate-200",
                isActive &&
                  "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-700/60 dark:bg-blue-900/40 dark:text-blue-50",
                isTotalColumn && totalCellClasses,
              )}
            >
              <div
                className={cn(
                  "text-base font-semibold text-slate-900 dark:text-slate-50",
                  isActive && "text-blue-800 dark:text-blue-50",
                  isTotalColumn && totalValueClasses,
                )}
              >
                {formatToBillionM(totals.value_m)}
              </div>
              <div
                className={cn(
                  "text-sm font-semibold text-slate-600 dark:text-slate-300",
                  isActive && "text-blue-700 dark:text-blue-100",
                  isTotalColumn && totalValueClasses,
                )}
              >
                {formatProjects(totals.projects)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const tableWithWidth = <div className="min-w-full md:min-w-[640px] lg:min-w-[840px]">{tableContent}</div>;

  if (variant === "embedded") {
    return tableWithWidth;
  }

  return <div className="overflow-x-auto">{tableWithWidth}</div>;
}
