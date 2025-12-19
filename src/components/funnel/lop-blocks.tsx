/* eslint-disable security/detect-object-injection */

import { formatToBillionM } from "@/lib/format-utils";
import { cn } from "@/lib/utils";
import type { LopTargetRow } from "@/types/funnel";

import { SEGMENT_LABEL_OVERRIDES, isValidSegment, normalizeSegment, type UiSegment } from "./segment-utils";

interface LopBlocksProps {
  targets: LopTargetRow[];
  segments: UiSegment[];
  activeSegment?: UiSegment;
  columnTemplate?: string;
  variant?: "card" | "embedded";
}

type LopKind = "kecukupan" | "qualified";

const formatPercent = (value: number | null): string => {
  if (value === null) return "-";
  return `${value.toLocaleString("id-ID", { maximumFractionDigits: 0 })}%`;
};

const calculatePercent = (numerator: number, denominator: number): number | null => {
  if (!Number.isFinite(denominator) || denominator === 0) return null;
  if (!Number.isFinite(numerator)) return null;
  const result = (numerator / denominator) * 100;
  return Number.isFinite(result) ? result : null;
};

interface LopBlockProps {
  title: string;
  kind: LopKind;
  segments: string[];
  targetLookup: Map<string, LopTargetRow>;
  activeSegment?: string;
  columnTemplate?: string;
  variant?: "card" | "embedded";
}

const totalHeaderClasses = "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-100";
const totalCellClasses =
  "border border-blue-100 bg-blue-50/70 text-blue-800 dark:border-blue-800 dark:bg-blue-900/40 dark:text-blue-100";
const totalValueClasses = "text-blue-800 dark:text-blue-100";

function LopBlock({
  title,
  kind,
  segments,
  targetLookup,
  activeSegment,
  columnTemplate,
  variant = "card",
}: LopBlockProps) {
  const activeNormalized = activeSegment ? normalizeSegment(activeSegment) : null;
  const getValueForSegment = (segment: string): LopTargetRow | null =>
    targetLookup.get(normalizeSegment(segment)) ?? null;
  const gridTemplateColumns = columnTemplate ?? `180px repeat(${segments.length}, 1fr)`;

  const getLopValue = (segment: string): number => {
    const row = getValueForSegment(segment);
    if (!row) return 0;
    return kind === "kecukupan" ? row.lop_value_m : row.qualified_lop_m;
  };

  const getTargetRkap = (segment: string): number => getValueForSegment(segment)?.target_rkap_m ?? 0;
  const getTargetStg = (segment: string): number => getValueForSegment(segment)?.target_stg_m ?? 0;

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

      {/* Value Row */}
      <div className="grid gap-px bg-slate-50/80 dark:bg-slate-900/40" style={{ gridTemplateColumns }}>
        <div className="flex items-center bg-white px-4 py-3 text-slate-700 dark:bg-slate-950/60 dark:text-slate-200">
          <span className="text-sm font-medium">Nilai</span>
        </div>
        {segments.map((segment) => {
          const normalized = normalizeSegment(segment);
          const isActive = activeNormalized === normalized;
          const isTotalColumn = normalized === "total";
          return (
            <div
              key={segment}
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
                {formatToBillionM(getLopValue(segment))}
              </div>
            </div>
          );
        })}
      </div>

      {/* % Terhadap RKAP Row */}
      <div className="grid gap-px bg-slate-50/70 dark:bg-slate-900/35" style={{ gridTemplateColumns }}>
        <div className="flex items-center bg-white px-4 py-3 text-slate-700 dark:bg-slate-950/70 dark:text-slate-200">
          <span className="text-sm font-medium">% Terhadap RKAP</span>
        </div>
        {segments.map((segment) => {
          const normalized = normalizeSegment(segment);
          const isActive = activeNormalized === normalized;
          const isTotalColumn = normalized === "total";
          return (
            <div
              key={segment}
              className={cn(
                "flex items-center justify-center border border-transparent bg-white px-4 py-3 text-slate-700 dark:bg-slate-950/70 dark:text-slate-200",
                isActive &&
                  "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-700/60 dark:bg-blue-900/40 dark:text-blue-50",
                isTotalColumn && totalCellClasses,
              )}
            >
              <div
                className={cn(
                  "text-sm font-semibold text-blue-700 dark:text-blue-200",
                  isActive && "text-blue-800 dark:text-blue-50",
                  isTotalColumn && totalValueClasses,
                )}
              >
                {formatPercent(calculatePercent(getLopValue(segment), getTargetRkap(segment)))}
              </div>
            </div>
          );
        })}
      </div>

      {/* % Terhadap STG Row */}
      <div className="grid gap-px bg-slate-50/80 dark:bg-slate-900/40" style={{ gridTemplateColumns }}>
        <div className="flex items-center bg-white px-4 py-3 text-slate-700 dark:bg-slate-950/60 dark:text-slate-200">
          <span className="text-sm font-medium">% Terhadap STG</span>
        </div>
        {segments.map((segment) => {
          const normalized = normalizeSegment(segment);
          const isActive = activeNormalized === normalized;
          const isTotalColumn = normalized === "total";
          return (
            <div
              key={segment}
              className={cn(
                "flex items-center justify-center border border-transparent bg-white px-4 py-3 text-slate-700 dark:bg-slate-950/60 dark:text-slate-200",
                isActive &&
                  "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-700/60 dark:bg-blue-900/40 dark:text-blue-50",
                isTotalColumn && totalCellClasses,
              )}
            >
              <div
                className={cn(
                  "text-sm font-semibold text-emerald-600 dark:text-emerald-300",
                  isActive && "text-emerald-700 dark:text-emerald-100",
                  isTotalColumn && totalValueClasses,
                )}
              >
                {formatPercent(calculatePercent(getLopValue(segment), getTargetStg(segment)))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const tableWithWidth = <div className="min-w-full md:min-w-[640px] lg:min-w-[840px]">{tableContent}</div>;

  return (
    <div className="space-y-2">
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">{title}</h3>

      {variant === "embedded" ? tableWithWidth : <div className="overflow-x-auto">{tableWithWidth}</div>}
    </div>
  );
}

export function LopBlocks({ targets, segments, activeSegment, columnTemplate, variant = "card" }: LopBlocksProps) {
  const targetLookup = new Map<string, LopTargetRow>(
    targets.filter((row) => isValidSegment(row.segment)).map((row) => [normalizeSegment(row.segment), row]),
  );

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Daftar Projek (LOP)</h2>

      <LopBlock
        title="Kecukupan LOP"
        kind="kecukupan"
        segments={segments}
        targetLookup={targetLookup}
        activeSegment={activeSegment}
        columnTemplate={columnTemplate}
        variant={variant}
      />
      <LopBlock
        title="LOP Qualified"
        kind="qualified"
        segments={segments}
        targetLookup={targetLookup}
        activeSegment={activeSegment}
        columnTemplate={columnTemplate}
        variant={variant}
      />
    </div>
  );
}
