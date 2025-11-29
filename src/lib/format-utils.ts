/**
 * Utility functions for formatting numbers and dates
 */

import { format } from "date-fns";

/**
 * Convert a value in millions of Rupiah to billions (miliar) and format with "M" suffix.
 * - Null/undefined/<=0 -> "0 M"
 * - >= 1 billion -> floor to integer (no decimals)
 * - < 1 billion -> floor to 1 decimal place
 */
export function formatToBillionM(value_m: number | null | undefined): string {
  if (value_m === null || value_m === undefined) {
    return "0 M";
  }

  const numericValue = Number(value_m);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return "0 M";
  }

  const inBillion = numericValue / 1000;

  if (inBillion >= 1) {
    const rounded = Math.floor(inBillion);
    return `${rounded.toLocaleString("id-ID")} M`;
  }

  const flooredOneDecimal = Math.floor(inBillion * 10) / 10;
  return `${flooredOneDecimal.toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} M`;
}

/**
 * Backwards-compatible wrapper for project value formatting.
 * Expects project_value in millions and formats as billions with "M" (miliar).
 */
export function formatProjectValue(value: number | null | undefined): string {
  return formatToBillionM(value);
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
