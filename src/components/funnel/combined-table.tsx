/* eslint-disable security/detect-object-injection */
import { Fragment } from "react";

import { formatToBillionM } from "@/lib/format-utils";
import { cn } from "@/lib/utils";

import { SEGMENT_LABEL_OVERRIDES, normalizeSegment, type UiSegment } from "./segment-utils";

export type CombinedGroup = "funnel" | "target" | "kecukupan" | "qualified";

export type CombinedRow = {
  group: CombinedGroup;
  label: string;
  values: Record<string, number | null | undefined>;
  isPercentage?: boolean;
  projects?: Record<string, number | null | undefined>;
};

interface CombinedTableProps {
  rows: CombinedRow[];
  segments: UiSegment[];
  segmentVisibility: Record<string, boolean>;
  onToggleSegment: (segment: UiSegment) => void;
  onResetSegments: () => void;
}

const GROUP_LABELS: Record<CombinedGroup, string> = {
  funnel: "Funnel per stage",
  target: "Target",
  kecukupan: "Kecukupan LOP",
  qualified: "LOP Qualified",
};

const totalHeaderClasses = "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-50";
const totalCellClasses =
  "border border-blue-100 bg-blue-50/70 text-blue-800 dark:border-blue-800/60 dark:bg-blue-900/40 dark:text-blue-100";
const totalValueTextClasses = "text-blue-700 dark:text-blue-100";
const funnelStageRowColors: Record<string, string> = {
  Leads: "bg-purple-50",
  Prospects: "bg-blue-50",
  Qualified: "bg-green-50",
  Submissions: "bg-orange-50",
  Win: "bg-red-50",
};
const headerBaseButtonClass =
  "flex w-full items-center justify-center px-3 py-2 text-center text-[13px] font-semibold uppercase tracking-wide transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950";
const headerActiveClass =
  "rounded-t-lg border border-red-500 bg-red-500 text-white shadow-sm hover:bg-red-600 dark:border-red-400 dark:bg-red-500 dark:hover:bg-red-400";
const headerInactiveClass =
  "rounded-t-lg border border-transparent bg-slate-50/80 text-slate-600 hover:bg-rose-50 hover:text-rose-700 dark:bg-slate-900/40 dark:text-slate-100 dark:hover:bg-rose-950/40";
const headerInactiveTotalClass =
  "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-50 dark:hover:bg-blue-900/40";

const formatPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "-";
  return `${value.toLocaleString("id-ID", { maximumFractionDigits: 0 })}%`;
};

const formatProjects = (count: number | null | undefined): string | null => {
  if (count === null || count === undefined) return null;
  const safeCount = Math.round(Number(count));
  if (!Number.isFinite(safeCount)) return null;
  return `${safeCount.toLocaleString("id-ID")} projek`;
};

export function CombinedTable({
  rows,
  segments,
  segmentVisibility,
  onToggleSegment,
  onResetSegments,
}: CombinedTableProps) {
  const normalizedSegments = segments.map((segment) => normalizeSegment(segment));
  const colSpan = segments.length + 1;

  const renderValue = (row: CombinedRow, normalizedSegment: string): string => {
    const rawValue = row.values[normalizedSegment];
    if (rawValue === null || rawValue === undefined || Number.isNaN(rawValue)) return "-";
    return row.isPercentage ? formatPercent(rawValue) : formatToBillionM(rawValue);
  };
  const allSegmentsActive = Object.values(segmentVisibility).every(Boolean);
  const handleHeaderClick = (segment: UiSegment) => {
    const normalized = normalizeSegment(segment);
    if (normalized === "total") {
      onResetSegments();
      return;
    }
    onToggleSegment(segment);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed border-collapse text-xs md:text-sm">
        <thead>
          <tr className="bg-slate-50/80 text-slate-700 dark:bg-slate-900/40 dark:text-slate-100">
            <th className="w-40 px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-200" />
            {segments.map((segment, index) => {
              const normalized = normalizedSegments[index];
              const isTotal = normalized === "total";
              const isActive = isTotal ? allSegmentsActive : (segmentVisibility[normalized] ?? true);
              return (
                <th key={segment} className="p-0">
                  <button
                    type="button"
                    aria-pressed={isActive}
                    className={cn(
                      headerBaseButtonClass,
                      isActive
                        ? headerActiveClass
                        : cn(headerInactiveClass, isTotal && [headerInactiveTotalClass, totalHeaderClasses]),
                    )}
                    onClick={() => handleHeaderClick(segment)}
                  >
                    {SEGMENT_LABEL_OVERRIDES[normalized] ?? segment}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const previousGroup = rows[rowIndex - 1]?.group;
            const showGroupHeader = row.group !== previousGroup;
            const rowStripe =
              rowIndex % 2 === 0 ? "bg-white/70 dark:bg-slate-900/40" : "bg-slate-50/70 dark:bg-slate-900/30";
            const pastelColor = row.group === "funnel" ? funnelStageRowColors[row.label] : undefined;
            const rowBackground = pastelColor ?? rowStripe;

            return (
              <Fragment key={`${row.group}-${row.label}`}>
                {showGroupHeader ? (
                  <tr>
                    <td
                      colSpan={colSpan}
                      className="bg-slate-100/80 px-3 py-2 text-[11px] font-semibold tracking-wide text-slate-600 uppercase dark:bg-slate-800/60 dark:text-slate-200"
                    >
                      {GROUP_LABELS[row.group]}
                    </td>
                  </tr>
                ) : null}
                <tr className={cn("border-b border-slate-100 dark:border-slate-800/60", rowBackground)}>
                  <td
                    className={cn(
                      "px-3 py-1.5 font-semibold",
                      pastelColor ? "text-slate-800 dark:text-slate-100" : "text-slate-700 dark:text-slate-100",
                    )}
                  >
                    {row.label}
                  </td>
                  {segments.map((segment, index) => {
                    const normalized = normalizedSegments[index];
                    const isTotal = normalized === "total";
                    const valueLabel = renderValue(row, normalized);
                    const projects = formatProjects(row.projects?.[normalized]);
                    return (
                      <td
                        key={`${row.label}-${segment}`}
                        className={cn(
                          "px-3 py-1.5 text-center text-slate-800 dark:text-slate-100",
                          isTotal && totalCellClasses,
                        )}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span
                            className={cn(
                              "font-semibold",
                              isTotal ? totalValueTextClasses : pastelColor && "text-slate-800",
                            )}
                          >
                            {valueLabel}
                          </span>
                          {projects ? (
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-300">
                              {projects}
                            </span>
                          ) : null}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
