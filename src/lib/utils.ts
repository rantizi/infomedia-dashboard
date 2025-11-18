import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getInitials = (str: string): string => {
  if (typeof str !== "string" || !str.trim()) return "?";

  return (
    str
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "?"
  );
};

export function formatCurrency(
  amount: number,
  opts?: {
    currency?: string;
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    noDecimals?: boolean;
  },
) {
  const { currency = "USD", locale = "en-US", minimumFractionDigits, maximumFractionDigits, noDecimals } = opts ?? {};

  const formatOptions: Intl.NumberFormatOptions = {
    style: "currency",
    currency,
    minimumFractionDigits: noDecimals ? 0 : minimumFractionDigits,
    maximumFractionDigits: noDecimals ? 0 : maximumFractionDigits,
  };

  return new Intl.NumberFormat(locale, formatOptions).format(amount);
}

/**
 * Format number as short million (Miliar) with max 3 digits displayed
 * @example formatShortMillion(34.18) → "34M"
 * @example formatShortMillion(1.53) → "1,5M"
 * @example formatShortMillion(0.48) → "0,5M"
 * @example formatShortMillion(1_500_000_000) → "1,5M" (if value is in full Rupiah, divide by 1e9 first)
 */
export function formatShortMillion(value: number): string {
  // If value is very large (likely in full Rupiah), convert to millions
  // Values >= 1e9 are likely in full Rupiah, smaller values are already in millions (Miliar)
  let valueInM: number;
  if (value >= 1e9) {
    // Likely in full Rupiah, convert to Miliar (divide by 1e9)
    valueInM = value / 1e9;
  } else {
    // Already in millions (Miliar)
    valueInM = value;
  }

  // Handle zero and very small values
  if (valueInM === 0) {
    return "0M";
  }

  // Determine how many digits we need
  const absValue = Math.abs(valueInM);
  let rounded: number;
  let formatted: string;

  if (absValue >= 100) {
    // 3 digits, no decimal (e.g., 123M)
    rounded = Math.round(valueInM);
    formatted = rounded.toString();
  } else if (absValue >= 10) {
    // 2 digits, no decimal (e.g., 34M)
    rounded = Math.round(valueInM);
    formatted = rounded.toString();
  } else if (absValue >= 1) {
    // 1-2 digits, one decimal if needed (e.g., 1,5M or 9M)
    rounded = Math.round(valueInM * 10) / 10;
    if (rounded % 1 === 0) {
      formatted = rounded.toString();
    } else {
      formatted = rounded.toFixed(1).replace(".", ",");
    }
  } else {
    // Less than 1, one decimal (e.g., 0,5M)
    rounded = Math.round(valueInM * 10) / 10;
    formatted = rounded.toFixed(1).replace(".", ",");
  }

  return `${formatted}M`;
}

/**
 * Format percentage as integer (no decimals)
 * @example formatPercentInt(98.46) → "98%"
 * @example formatPercentInt(0.9846) → "98%" (if input is fraction)
 * @example formatPercentInt(122.37) → "122%"
 */
export function formatPercentInt(value: number): string {
  // Handle both fraction (0.9846) and percentage (98.46) formats
  let percentage: number;
  if (value <= 1 && value >= -1) {
    // Likely a fraction, convert to percentage
    percentage = value * 100;
  } else {
    // Already a percentage
    percentage = value;
  }

  const rounded = Math.round(percentage);
  return `${rounded}%`;
}
