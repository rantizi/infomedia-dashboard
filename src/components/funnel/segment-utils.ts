export const isValidSegment = (segment: string | null | undefined): segment is string => {
  if (typeof segment !== "string") return false;
  const trimmed = segment.trim();
  return trimmed !== "" && trimmed.toLowerCase() !== "nan";
};
