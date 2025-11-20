/**
 * Utility functions for formatting numbers and dates
 */

import { format } from "date-fns";

/**
 * Format a number as Indonesian currency with "M" suffix (miliar/billion)
 * Example: 1.5 -> "1,5M", 10 -> "10M"
 *
 * Uses Indonesian formatting: dot for thousands, comma for decimals
 */
export function formatProjectValue(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "-";
  }

  // Format with comma as decimal separator
  const formatted = value.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });

  return `${formatted}M`;
}

/**
 * Format an ISO datetime string to a readable date
 * Example: "2025-11-18T00:00:00Z" -> "18 Nov 2025"
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) {
    return "-";
  }

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "-";
    }
    return format(date, "d MMM yyyy");
  } catch {
    return "-";
  }
}
