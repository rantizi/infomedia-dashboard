/* eslint-disable security/detect-object-injection */
"use client";

/**
 * SegmentTabs Component
 *
 * Renders segment buttons for switching between customer segments.
 * The parent supplies the ordered segment list to match dashboard priorities.
 */

import { cn } from "@/lib/utils";

interface SegmentTabsProps {
  value?: string;
  segments: string[];
  onValueChange: (segment: string) => void;
}

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

const normalize = (value: string): string => {
  const normalized = value.trim().toLowerCase();
  return SEGMENT_NORMALIZATION_MAP[normalized] ?? normalized;
};

/**
 * SegmentTabs – Button group for selecting customer segments
 *
 * Uses a simple button group with Tailwind styling.
 * Active segment has a blue background and white text.
 */
export function SegmentTabs({ value, segments, onValueChange }: SegmentTabsProps) {
  const getLabel = (segment: string): string => SEGMENT_LABEL_OVERRIDES[normalize(segment)] ?? segment;

  return (
    <div className="flex flex-wrap gap-2">
      {segments.map((segment) => (
        <button
          key={segment}
          onClick={() => onValueChange(segment)}
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-medium shadow-sm backdrop-blur-sm transition-all",
            "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none",
            value === segment
              ? "border-blue-600/60 bg-blue-600 text-white shadow-md"
              : "border-slate-200/70 bg-white/70 text-slate-700 hover:bg-white dark:border-slate-700/70 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-900/60",
          )}
          type="button"
          disabled={segments.length === 0}
        >
          {getLabel(segment)}
        </button>
      ))}
    </div>
  );
}
