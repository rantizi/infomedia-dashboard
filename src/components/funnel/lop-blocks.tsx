/* eslint-disable security/detect-object-injection */

import { cn } from "@/lib/utils";
import type { LopTargetRow } from "@/types/funnel";

interface LopBlocksProps {
  targets: LopTargetRow[];
  segments: string[];
  activeSegment?: string;
}

type LopKind = "kecukupan" | "qualified";

const SEGMENT_NORMALIZATION_MAP: Record<string, string> = {
  telkom: "telkom group",
  "telkom group": "telkom group",
  soe: "soe",
  private: "private",
  government: "gov",
  gov: "gov",
  "sme & regional": "sme & reg",
  "sme and regional": "sme & reg",
  "sme & reg": "sme & reg",
  "sme reg": "sme & reg",
  total: "total",
};

const SEGMENT_LABEL_OVERRIDES: Record<string, string> = {
  "telkom group": "Telkom Group",
  soe: "SOE",
  private: "Private",
  gov: "Gov",
  "sme & reg": "SME & Reg",
  "sme & regional": "SME & Reg",
  "sme and regional": "SME & Reg",
  total: "Total",
};

const normalizeSegment = (segment: string): string => {
  const normalized = segment.trim().toLowerCase();
  return SEGMENT_NORMALIZATION_MAP[normalized] ?? normalized;
};

const formatValueM = (value: number): string => {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${safeValue.toLocaleString("id-ID", { maximumFractionDigits: 0 })} M`;
};

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
}

function LopBlock({ title, kind, segments, targetLookup, activeSegment }: LopBlockProps) {
  const activeNormalized = activeSegment ? normalizeSegment(activeSegment) : null;
  const getValueForSegment = (segment: string): LopTargetRow | null =>
    targetLookup.get(normalizeSegment(segment)) ?? null;

  const getLopValue = (segment: string): number => {
    const row = getValueForSegment(segment);
    if (!row) return 0;
    return kind === "kecukupan" ? row.lop_value_m : row.qualified_lop_m;
  };

  const getTargetRkap = (segment: string): number => getValueForSegment(segment)?.target_rkap_m ?? 0;
  const getTargetStg = (segment: string): number => getValueForSegment(segment)?.target_stg_m ?? 0;

  return (
    <div className="space-y-2">
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">{title}</h3>

      <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white/80 p-1 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/60">
        <div className="min-w-[900px]">
          {/* Header Row */}
          <div
            className="grid gap-px border-b border-slate-200/70 bg-white/60 dark:border-slate-800/60 dark:bg-slate-900/40"
            style={{
              gridTemplateColumns: `180px repeat(${segments.length}, 1fr)`,
            }}
          >
            <div className="px-4 py-2">{/* Empty cell for top-left corner */}</div>
            {segments.map((segment) => {
              const isActive = activeNormalized === normalizeSegment(segment);
              return (
                <div
                  key={segment}
                  className={cn(
                    "px-4 py-2 text-center text-sm font-semibold text-slate-600 dark:text-slate-200",
                    isActive &&
                      "rounded-t-md bg-blue-50/70 text-blue-700 shadow-sm dark:bg-blue-500/15 dark:text-blue-100",
                  )}
                >
                  {SEGMENT_LABEL_OVERRIDES[normalizeSegment(segment)] ?? segment}
                </div>
              );
            })}
          </div>

          {/* Value Row */}
          <div
            className="grid gap-px bg-white/50 dark:bg-slate-900/30"
            style={{
              gridTemplateColumns: `180px repeat(${segments.length}, 1fr)`,
            }}
          >
            <div className="flex items-center bg-white/80 px-4 py-3 dark:bg-slate-950/40">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Nilai</span>
            </div>
            {segments.map((segment) => {
              const isActive = activeNormalized === normalizeSegment(segment);
              return (
                <div
                  key={segment}
                  className={cn(
                    "flex items-center justify-center bg-white/80 px-4 py-3 dark:bg-slate-950/40",
                    isActive && "bg-blue-50/80 ring-1 ring-blue-200/80 dark:bg-blue-500/10 dark:ring-blue-500/30",
                  )}
                >
                  <div
                    className={cn(
                      "text-base font-semibold text-slate-900 dark:text-slate-50",
                      isActive && "text-blue-700 dark:text-blue-100",
                    )}
                  >
                    {formatValueM(getLopValue(segment))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* % Terhadap RKAP Row */}
          <div
            className="grid gap-px bg-white/40 dark:bg-slate-900/25"
            style={{
              gridTemplateColumns: `180px repeat(${segments.length}, 1fr)`,
            }}
          >
            <div className="flex items-center bg-white/80 px-4 py-3 dark:bg-slate-950/30">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">% Terhadap RKAP</span>
            </div>
            {segments.map((segment) => {
              const isActive = activeNormalized === normalizeSegment(segment);
              return (
                <div
                  key={segment}
                  className={cn(
                    "flex items-center justify-center bg-white/80 px-4 py-3 dark:bg-slate-950/30",
                    isActive && "bg-blue-50/80 ring-1 ring-blue-200/80 dark:bg-blue-500/10 dark:ring-blue-500/30",
                  )}
                >
                  <div
                    className={cn(
                      "text-sm font-semibold text-blue-600 dark:text-blue-300",
                      isActive && "text-blue-700 dark:text-blue-100",
                    )}
                  >
                    {formatPercent(calculatePercent(getLopValue(segment), getTargetRkap(segment)))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* % Terhadap STG Row */}
          <div
            className="grid gap-px bg-white/50 dark:bg-slate-900/30"
            style={{
              gridTemplateColumns: `180px repeat(${segments.length}, 1fr)`,
            }}
          >
            <div className="flex items-center bg-white/80 px-4 py-3 dark:bg-slate-950/40">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">% Terhadap STG</span>
            </div>
            {segments.map((segment) => {
              const isActive = activeNormalized === normalizeSegment(segment);
              return (
                <div
                  key={segment}
                  className={cn(
                    "flex items-center justify-center bg-white/80 px-4 py-3 dark:bg-slate-950/40",
                    isActive && "bg-blue-50/80 ring-1 ring-blue-200/80 dark:bg-blue-500/10 dark:ring-blue-500/30",
                  )}
                >
                  <div
                    className={cn(
                      "text-sm font-semibold text-emerald-600 dark:text-emerald-300",
                      isActive && "text-emerald-700 dark:text-emerald-100",
                    )}
                  >
                    {formatPercent(calculatePercent(getLopValue(segment), getTargetStg(segment)))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LopBlocks({ targets, segments, activeSegment }: LopBlocksProps) {
  const targetLookup = new Map<string, LopTargetRow>(targets.map((row) => [normalizeSegment(row.segment), row]));

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">List of Projects (LOP)</h2>

      <LopBlock
        title="Kecukupan LOP"
        kind="kecukupan"
        segments={segments}
        targetLookup={targetLookup}
        activeSegment={activeSegment}
      />
      <LopBlock
        title="Qualified LOP"
        kind="qualified"
        segments={segments}
        targetLookup={targetLookup}
        activeSegment={activeSegment}
      />
    </div>
  );
}
