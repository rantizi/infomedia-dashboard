export const SEGMENT_FILTER_OPTIONS = ["Telkom Group", "SOE", "Private", "Gov", "SME & Reg"] as const;

export type BaseSegment = (typeof SEGMENT_FILTER_OPTIONS)[number];
export type UiSegment = BaseSegment | "Total";

const SEGMENT_NORMALIZATION_MAP = new Map<string, string>([
  ["telkom", "telkom group"],
  ["telkom group", "telkom group"],
  ["soe", "soe"],
  ["private", "private"],
  ["government", "gov"],
  ["gov", "gov"],
  ["sme & regional", "sme & reg"],
  ["sme and regional", "sme & reg"],
  ["sme & reg", "sme & reg"],
  ["sme reg", "sme & reg"],
  ["total", "total"],
]);

export const SEGMENT_LABEL_OVERRIDES: Record<string, string> = {
  "telkom group": "Telkom Group",
  soe: "SOE",
  private: "Private",
  gov: "Gov",
  "sme & reg": "SME & Reg",
  "sme & regional": "SME & Reg",
  "sme and regional": "SME & Reg",
  total: "Total",
};

export const DEFAULT_SEGMENT_ORDER: UiSegment[] = ["Telkom Group", "SOE", "Private", "Gov", "SME & Reg", "Total"];

export const normalizeSegment = (segment: string): string => {
  const normalized = segment.trim().toLowerCase();
  return SEGMENT_NORMALIZATION_MAP.get(normalized) ?? normalized;
};

export const orderSegments = (segments: string[], options: { includeTotal?: boolean } = {}): UiSegment[] => {
  const { includeTotal = true } = options;
  const uniqueByNormalized = new Map<string, string>();
  segments.forEach((segment) => {
    const normalized = normalizeSegment(segment);
    if (!includeTotal && normalized === "total") return;
    if (!uniqueByNormalized.has(normalized)) {
      uniqueByNormalized.set(normalized, segment);
    }
  });

  const normalizedOrder = (
    includeTotal ? DEFAULT_SEGMENT_ORDER : DEFAULT_SEGMENT_ORDER.filter((segment) => segment !== "Total")
  ).map(normalizeSegment);
  const ordered: string[] = [];

  normalizedOrder.forEach((normalized) => {
    const value = uniqueByNormalized.get(normalized);
    if (value) {
      ordered.push(value);
      uniqueByNormalized.delete(normalized);
    }
  });

  const remaining = Array.from(uniqueByNormalized.values())
    .filter((segment) => includeTotal || normalizeSegment(segment) !== "total")
    .sort((a, b) => a.localeCompare(b));
  return [...ordered, ...remaining] as UiSegment[];
};

export const isValidSegment = (segment: string | null | undefined): segment is string => {
  if (typeof segment !== "string") return false;
  const trimmed = segment.trim();
  return trimmed !== "" && trimmed.toLowerCase() !== "nan";
};
