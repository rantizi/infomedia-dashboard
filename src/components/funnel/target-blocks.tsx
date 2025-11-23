/* eslint-disable security/detect-object-injection */

import { cn } from "@/lib/utils";
import type { LopTargetRow } from "@/types/funnel";

interface TargetBlocksProps {
  targets: LopTargetRow[];
  segments: string[];
  activeSegment?: string;
}

type TargetKind = "rkap" | "stg";

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

const labelClasses: Record<TargetKind, string> = {
  rkap: "bg-rose-100/60 border-rose-200/70 text-rose-800 dark:bg-rose-500/25 dark:border-rose-500/40 dark:text-rose-50",
  stg: "bg-white/40 border-slate-200/70 text-slate-900 dark:bg-slate-900/40 dark:border-slate-700/70 dark:text-slate-50",
};

export function TargetBlocks({ targets, segments, activeSegment }: TargetBlocksProps) {
  const targetLookup = new Map<string, LopTargetRow>(targets.map((row) => [normalizeSegment(row.segment), row]));
  const activeNormalized = activeSegment ? normalizeSegment(activeSegment) : null;

  const getValueForSegment = (segment: string, kind: TargetKind): number => {
    const row = targetLookup.get(normalizeSegment(segment));
    if (!row) return 0;
    return kind === "rkap" ? row.target_rkap_m : row.target_stg_m;
  };

  const targetRows: { key: TargetKind; label: string }[] = [
    { key: "rkap", label: "Target RKAP" },
    { key: "stg", label: "Target STG" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Targets</h2>

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

          {/* Target rows */}
          <div
            className="grid gap-px bg-white/50 dark:bg-slate-900/30"
            style={{
              gridTemplateColumns: `180px repeat(${segments.length}, 1fr)`,
            }}
          >
            {targetRows.map((row) => (
              <div className="contents" key={row.key}>
                <div className="flex items-center justify-center bg-white/80 px-4 py-3 dark:bg-slate-950/40">
                  <div
                    className={cn(
                      "inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold shadow-sm backdrop-blur-sm",
                      labelClasses[row.key],
                    )}
                  >
                    {row.label}
                  </div>
                </div>

                {segments.map((segment) => {
                  const isActive = activeNormalized === normalizeSegment(segment);
                  return (
                    <div
                      key={`${row.key}-${segment}`}
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
                        {formatValueM(getValueForSegment(segment, row.key))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
