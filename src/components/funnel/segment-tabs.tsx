/* eslint-disable security/detect-object-injection */
"use client";

/**
 * SegmentTabs Component
 *
 * Renders 6 segment buttons for switching between different customer segments:
 * Telkom Group, SOE, Private, Gov, SME & Reg, Total
 */

import { cn } from "@/lib/utils";
import { Segment, SEGMENT_LABELS } from "@/types/funnel";

interface SegmentTabsProps {
  value: Segment;
  onValueChange: (segment: Segment) => void;
}

const SEGMENTS: Segment[] = ["TELKOM_GROUP", "SOE", "PRIVATE", "GOV", "SME_REG", "TOTAL"];

/**
 * SegmentTabs — Button group for selecting customer segments
 *
 * Uses a simple button group with Tailwind styling.
 * Active segment has a blue background and white text.
 */
export function SegmentTabs({ value, onValueChange }: SegmentTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SEGMENTS.map((segment) => (
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
        >
          {SEGMENT_LABELS[segment]}
        </button>
      ))}
    </div>
  );
}
