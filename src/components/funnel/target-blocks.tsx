/* eslint-disable security/detect-object-injection */

import { formatToBillionM } from "@/lib/format-utils";
import { cn } from "@/lib/utils";
import type { LopTargetRow } from "@/types/funnel";

import { SEGMENT_LABEL_OVERRIDES, isValidSegment, normalizeSegment, type UiSegment } from "./segment-utils";

interface TargetBlocksProps {
  targets: LopTargetRow[];
  segments: UiSegment[];
  activeSegment?: UiSegment;
  columnTemplate?: string;
  variant?: "card" | "embedded";
}

type TargetKind = "rkap" | "stg";

const labelClasses: Record<TargetKind, string> = {
  rkap: "bg-rose-100/60 border-rose-200/70 text-rose-800 dark:bg-rose-500/25 dark:border-rose-500/40 dark:text-rose-50",
  stg: "bg-white/40 border-slate-200/70 text-slate-900 dark:bg-slate-900/40 dark:border-slate-700/70 dark:text-slate-50",
};

const totalHeaderClasses = "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-100";
const totalCellClasses =
  "border border-blue-100 bg-blue-50/70 text-blue-800 dark:border-blue-800 dark:bg-blue-900/40 dark:text-blue-100";
const totalValueClasses = "text-blue-800 dark:text-blue-100";

export function TargetBlocks({
  targets,
  segments,
  activeSegment,
  columnTemplate,
  variant = "card",
}: TargetBlocksProps) {
  const targetLookup = new Map<string, LopTargetRow>(
    targets.filter((row) => isValidSegment(row.segment)).map((row) => [normalizeSegment(row.segment), row]),
  );
  const activeNormalized = activeSegment ? normalizeSegment(activeSegment) : null;
  const gridTemplateColumns = columnTemplate ?? `180px repeat(${segments.length}, 1fr)`;

  const getValueForSegment = (segment: string, kind: TargetKind): number => {
    const row = targetLookup.get(normalizeSegment(segment));
    if (!row) return 0;
    return kind === "rkap" ? row.target_rkap_m : row.target_stg_m;
  };

  const targetRows: { key: TargetKind; label: string }[] = [
    { key: "rkap", label: "Target RKAP" },
    { key: "stg", label: "Target STG" },
  ];

  const tableContent = (
    <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/80">
      <div
        className="grid gap-px border-b border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50"
        style={{
          gridTemplateColumns,
        }}
      >
        <div className="px-4 py-2">{/* Empty cell for top-left corner */}</div>
        {segments.map((segment) => {
          const normalized = normalizeSegment(segment);
          const isActive = activeNormalized === normalized;
          const isTotalColumn = normalized === "total";
          return (
            <div
              key={segment}
              className={cn(
                "border border-transparent px-4 py-2 text-center text-sm font-semibold text-slate-700 dark:text-slate-100",
                isActive && "rounded-t-md bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-50",
                isTotalColumn && totalHeaderClasses,
              )}
            >
              {SEGMENT_LABEL_OVERRIDES[normalized] ?? segment}
            </div>
          );
        })}
      </div>

      {/* Target rows */}
      <div className="grid gap-px bg-slate-50/80 dark:bg-slate-900/40" style={{ gridTemplateColumns }}>
        {targetRows.map((row) => (
          <div className="contents" key={row.key}>
            <div className="flex items-center justify-center bg-white px-4 py-3 dark:bg-slate-950/60">
              <div
                className={cn(
                  "inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold shadow-sm",
                  labelClasses[row.key],
                )}
              >
                {row.label}
              </div>
            </div>

            {segments.map((segment) => {
              const normalized = normalizeSegment(segment);
              const isActive = activeNormalized === normalized;
              const isTotalColumn = normalized === "total";
              return (
                <div
                  key={`${row.key}-${segment}`}
                  className={cn(
                    "flex items-center justify-center border border-transparent bg-white px-4 py-3 text-slate-700 dark:bg-slate-950/60 dark:text-slate-200",
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
                    {formatToBillionM(getValueForSegment(segment, row.key))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  const tableWithWidth = <div className="min-w-full md:min-w-[640px] lg:min-w-[840px]">{tableContent}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Target</h2>

      {variant === "embedded" ? tableWithWidth : <div className="overflow-x-auto">{tableWithWidth}</div>}
    </div>
  );
}
