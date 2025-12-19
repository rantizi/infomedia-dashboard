"use client";
/* eslint-disable max-lines */

/**
 * OverviewDashboard Component
 *
 * Client-side dashboard shell that fetches funnel KPIs from
 * `/api/funnel-2rows` and renders the segment tabs + funnel table.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FUNNEL_STAGE_LABELS,
  type FunnelApiResponse,
  type FunnelStage,
  type LopTargetRow,
  type LopTargetsApiResponse,
  type SegmentFunnel,
  type SegmentStageRecord,
} from "@/types/funnel";

import { CombinedTable, type CombinedRow } from "./combined-table";
import {
  SEGMENT_FILTER_OPTIONS,
  isValidSegment,
  normalizeSegment,
  orderSegments,
  type BaseSegment,
  type UiSegment,
} from "./segment-utils";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS: number[] = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];
const DEFAULT_YEAR = Math.max(...YEAR_OPTIONS);
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const FUNNEL_STAGES: FunnelStage[] = ["leads", "prospect", "qualified", "submission", "win"];
const MONTH_OPTIONS: { label: string; value: number | null }[] = [
  { label: "All", value: null },
  { label: "Jan", value: 1 },
  { label: "Feb", value: 2 },
  { label: "Mar", value: 3 },
  { label: "Apr", value: 4 },
  { label: "May", value: 5 },
  { label: "Jun", value: 6 },
  { label: "Jul", value: 7 },
  { label: "Aug", value: 8 },
  { label: "Sep", value: 9 },
  { label: "Oct", value: 10 },
  { label: "Nov", value: 11 },
  { label: "Dec", value: 12 },
];
const CANONICAL_SEGMENTS = new Set<string>(SEGMENT_FILTER_OPTIONS.map((segment) => normalizeSegment(segment)));

const monthValueToSelect = (value: number | null): string => (value === null ? "all" : String(value));

const parseMonthFilter = (value: string | null): number | null => {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 12 ? parsed : null;
};

const createDefaultSegmentVisibility = (): Record<string, boolean> =>
  SEGMENT_FILTER_OPTIONS.reduce<Record<string, boolean>>((acc, segment) => {
    acc[normalizeSegment(segment)] = true;
    return acc;
  }, {});

const formatDevErrorMessage = (message: string, endpoint: string, status?: number): string => {
  if (IS_PRODUCTION) return message;
  const statusLabel = Number.isFinite(status) ? ` status=${status}` : "";
  return `${message} (endpoint ${endpoint}${statusLabel})`;
};

type DashboardStatus = { key: string; text: string };

function DashboardBody({
  statusMessages,
  isCombinedLoading,
  hasAnyData,
  combinedRows,
  segmentsWithTotal,
  segmentVisibility,
  onToggleSegment,
  onResetSegments,
}: {
  statusMessages: DashboardStatus[];
  isCombinedLoading: boolean;
  hasAnyData: boolean;
  combinedRows: CombinedRow[];
  segmentsWithTotal: UiSegment[];
  segmentVisibility: Record<string, boolean>;
  onToggleSegment: (segment: UiSegment) => void;
  onResetSegments: () => void;
}) {
  return (
    <div className="space-y-3">
      {statusMessages.length > 0 ? (
        <div className="space-y-2">
          {statusMessages.map((status) => (
            <div
              key={status.key}
              className="rounded-md border border-rose-200/70 bg-rose-50/80 px-3 py-2 text-xs font-semibold text-rose-700 shadow-sm dark:border-rose-900/50 dark:bg-rose-950/60 dark:text-rose-200"
            >
              {status.text}
            </div>
          ))}
        </div>
      ) : null}

      {isCombinedLoading ? (
        <div className="rounded-lg border border-slate-200/80 bg-white px-3 py-4 text-sm text-slate-600 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/80 dark:text-slate-300">
          Memuat data dashboard...
        </div>
      ) : null}

      {!isCombinedLoading && !hasAnyData ? (
        <div className="rounded-lg border border-slate-200/80 bg-white px-3 py-4 text-sm text-slate-600 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/80 dark:text-slate-300">
          Tidak ada data funnel atau target untuk ditampilkan.
        </div>
      ) : null}

      {!isCombinedLoading && hasAnyData ? (
        <CombinedTable
          rows={combinedRows}
          segments={segmentsWithTotal}
          segmentVisibility={segmentVisibility}
          onToggleSegment={onToggleSegment}
          onResetSegments={onResetSegments}
        />
      ) : null}
    </div>
  );
}

export function OverviewDashboard() {
  const [data, setData] = useState<SegmentFunnel[]>([]);
  const [lopTargets, setLopTargets] = useState<LopTargetRow[]>([]);
  const [lopHasData, setLopHasData] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [monthFrom, setMonthFrom] = useState<number | null>(null);
  const [monthTo, setMonthTo] = useState<number | null>(null);
  const [segmentVisibility, setSegmentVisibility] = useState<Record<string, boolean>>(createDefaultSegmentVisibility);
  const [refreshTick, setRefreshTick] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lopLoading, setLopLoading] = useState(true);
  const [lopError, setLopError] = useState<string | null>(null);
  const [isYearReady, setIsYearReady] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (!isYearReady || selectedYear === null) return;

    setData([]);
    setLopTargets([]);
    setLopHasData(false);
    setError(null);
    setLopError(null);
    setIsLoading(true);
    setLopLoading(true);
  }, [isYearReady, selectedYear]);

  useEffect(() => {
    if (!isYearReady || selectedYear === null) return;

    setData([]);
    setError(null);
    setIsLoading(true);
  }, [isYearReady, selectedYear, monthFrom, monthTo, refreshTick]);

  useEffect(() => {
    if (!isYearReady || selectedYear === null) return;

    let isActive = true;
    const controller = new AbortController();

    // eslint-disable-next-line complexity
    const fetchData = async () => {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.set("year", String(selectedYear));
      if (monthFrom !== null) {
        params.set("monthFrom", String(monthFrom));
      }
      if (monthTo !== null) {
        params.set("monthTo", String(monthTo));
      }
      const endpoint = `/api/funnel-2rows?${params.toString()}`;
      try {
        const response = await fetch(endpoint, {
          cache: "no-store",
          signal: controller.signal,
        });

        const json = (await response.json().catch(() => null)) as FunnelApiResponse | { error?: string } | null;
        const errorMessage = json && "error" in json ? json.error : undefined;
        if (!response.ok || errorMessage) {
          const fallbackMessage = errorMessage ?? response.statusText ?? "Gagal mengambil data funnel";
          throw new Error(formatDevErrorMessage(fallbackMessage, endpoint, response.status));
        }

        const payload = (json as FunnelApiResponse | null)?.rows ?? (json as FunnelApiResponse | null)?.data ?? [];

        if (!isActive) return;
        setData(payload);
        setError(null);
      } catch (err) {
        if (!isActive) return;
        const message = err instanceof Error ? err.message : "Gagal mengambil data funnel";
        setError(formatDevErrorMessage(message, endpoint));
        setData([]);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void fetchData();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [selectedYear, isYearReady, monthFrom, monthTo, refreshTick]);

  useEffect(() => {
    if (!isYearReady || selectedYear === null) return;

    let isActive = true;
    const controller = new AbortController();

    // eslint-disable-next-line complexity
    const fetchLopTargets = async () => {
      setLopLoading(true);
      const endpoint = `/api/lop-targets?year=${selectedYear}`;
      try {
        const response = await fetch(endpoint, {
          cache: "no-store",
          signal: controller.signal,
        });

        const json = (await response.json().catch(() => null)) as LopTargetsApiResponse | { error?: string } | null;
        const errorMessage = json && "error" in json ? json.error : undefined;
        if (!response.ok || errorMessage) {
          const fallbackMessage = errorMessage ?? response.statusText ?? "Gagal mengambil data target & LOP";
          throw new Error(formatDevErrorMessage(fallbackMessage, endpoint, response.status));
        }

        if (!isActive) return;
        const payload = (json as LopTargetsApiResponse | null)?.data ?? [];
        const hasData = (json as LopTargetsApiResponse | null)?.hasData ?? payload.length > 0;
        setLopTargets(payload);
        setLopHasData(hasData);
        setLopError(null);
      } catch (err) {
        if (!isActive) return;
        const message = err instanceof Error ? err.message : "Gagal mengambil data target & LOP";
        setLopError(formatDevErrorMessage(message, endpoint));
        setLopHasData(false);
        setLopTargets([]);
      } finally {
        if (isActive) {
          setLopLoading(false);
        }
      }
    };

    void fetchLopTargets();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [selectedYear, isYearReady, refreshTick]);

  useEffect(() => {
    const yearParam = searchParams.get("year");
    const parsedYear = yearParam ? Number(yearParam) : NaN;
    const nextYear = Number.isFinite(parsedYear) && YEAR_OPTIONS.includes(parsedYear) ? parsedYear : DEFAULT_YEAR;
    const nextMonthFrom = parseMonthFilter(searchParams.get("monthFrom"));
    const nextMonthTo = parseMonthFilter(searchParams.get("monthTo"));

    setSelectedYear((prev) => (prev === nextYear ? prev : nextYear));
    setMonthFrom((prev) => (prev === nextMonthFrom ? prev : nextMonthFrom));
    setMonthTo((prev) => (prev === nextMonthTo ? prev : nextMonthTo));
    if (!isYearReady) {
      setIsYearReady(true);
    }
  }, [searchParams, isYearReady]);

  useEffect(() => {
    if (!isYearReady || selectedYear === null) return;
    const params = new URLSearchParams(searchParams.toString());
    let hasChanges = false;

    const nextYear = String(selectedYear);
    if (params.get("year") !== nextYear) {
      params.set("year", nextYear);
      hasChanges = true;
    }

    const syncMonthParam = (key: "monthFrom" | "monthTo", value: number | null) => {
      if (value === null) {
        if (params.has(key)) {
          params.delete(key);
          hasChanges = true;
        }
        return;
      }

      const nextValue = String(value);
      if (params.get(key) !== nextValue) {
        params.set(key, nextValue);
        hasChanges = true;
      }
    };

    syncMonthParam("monthFrom", monthFrom);
    syncMonthParam("monthTo", monthTo);

    if (!hasChanges) return;
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams, selectedYear, isYearReady, monthFrom, monthTo]);

  const orderedSegments = useMemo(() => {
    const allSegments = [
      ...SEGMENT_FILTER_OPTIONS,
      ...data.map((item) => item.segment),
      ...lopTargets.map((item) => item.segment),
    ];
    const validSegments = allSegments.filter(
      (segment) => isValidSegment(segment) && CANONICAL_SEGMENTS.has(normalizeSegment(segment)),
    );
    return orderSegments(validSegments, { includeTotal: false }) as BaseSegment[];
  }, [data, lopTargets]);

  useEffect(() => {
    setSegmentVisibility((prev) => {
      const next = { ...prev };
      let changed = false;
      orderedSegments.forEach((segment) => {
        const key = normalizeSegment(segment);
        if (!(key in next)) {
          next[key] = true;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [orderedSegments]);

  const visibleSegments = useMemo(
    () =>
      orderedSegments.filter((segment) => {
        const key = normalizeSegment(segment);
        const isVisible = segmentVisibility[key];
        return isVisible ?? true;
      }),
    [orderedSegments, segmentVisibility],
  );

  const segmentsWithTotal: UiSegment[] = useMemo(() => [...visibleSegments, "Total"], [visibleSegments]);

  const handleToggleSegment = (segment: string) => {
    const key = normalizeSegment(segment);
    const currentlyVisible = segmentVisibility[key] ?? true;
    if (currentlyVisible && visibleSegments.length <= 1) {
      return;
    }

    setSegmentVisibility((prev) => ({
      ...prev,
      [key]: !currentlyVisible,
    }));
  };

  const handleResetSegments = () => {
    setSegmentVisibility((prev) => ({
      ...prev,
      ...createDefaultSegmentVisibility(),
    }));
  };

  const createEmptyStageRecord = (): SegmentStageRecord =>
    FUNNEL_STAGES.reduce<SegmentStageRecord>(
      (acc, stage) => ({
        ...acc,
        [stage]: { value_m: 0, projects: 0 },
      }),
      {} as SegmentStageRecord,
    );

  const funnelDataWithTotal = useMemo(() => {
    const baseSegments = data.filter((item) => CANONICAL_SEGMENTS.has(normalizeSegment(item.segment)));

    if (baseSegments.length === 0) return [];

    const totalStages = createEmptyStageRecord();
    baseSegments.forEach((segmentRow) => {
      FUNNEL_STAGES.forEach((stage) => {
        const stageData = segmentRow.stages[stage];
        totalStages[stage] = {
          value_m: totalStages[stage].value_m + (stageData?.value_m ?? 0),
          projects: totalStages[stage].projects + (stageData?.projects ?? 0),
        };
      });
    });

    const totalSegment: SegmentFunnel = {
      segment: "Total",
      stages: totalStages,
      year: baseSegments[0]?.year ?? selectedYear ?? undefined,
    };

    return [...baseSegments, totalSegment];
  }, [data, selectedYear]);

  const lopTargetsWithTotal = useMemo(() => {
    const baseTargets = lopTargets.filter(
      (item) => isValidSegment(item.segment) && CANONICAL_SEGMENTS.has(normalizeSegment(item.segment)),
    );

    if (baseTargets.length === 0) return baseTargets;

    const totalRow = baseTargets.reduce<LopTargetRow>(
      (acc, row) => ({
        segment: "Total",
        target_rkap_m: acc.target_rkap_m + (row.target_rkap_m ?? 0),
        target_stg_m: acc.target_stg_m + (row.target_stg_m ?? 0),
        lop_value_m: acc.lop_value_m + (row.lop_value_m ?? 0),
        qualified_lop_m: acc.qualified_lop_m + (row.qualified_lop_m ?? 0),
        year: acc.year ?? row.year ?? selectedYear ?? undefined,
      }),
      {
        segment: "Total",
        target_rkap_m: 0,
        target_stg_m: 0,
        lop_value_m: 0,
        qualified_lop_m: 0,
        year: selectedYear ?? undefined,
      },
    );

    return [...baseTargets, totalRow];
  }, [lopTargets, selectedYear]);

  const funnelDataAvailable = Array.isArray(funnelDataWithTotal) && funnelDataWithTotal.length > 0;
  const lopDataAvailable = lopHasData || (Array.isArray(lopTargets) && lopTargets.length > 0);
  const hasAnyData = funnelDataAvailable || lopDataAvailable;

  const funnelLookup = useMemo(
    () =>
      new Map<string, SegmentStageRecord>(
        funnelDataWithTotal
          .filter((segment) => isValidSegment(segment.segment))
          .map((segment) => [normalizeSegment(segment.segment), segment.stages]),
      ),
    [funnelDataWithTotal],
  );

  const targetLookup = useMemo(
    () =>
      new Map<string, LopTargetRow>(
        lopTargetsWithTotal
          .filter((row) => isValidSegment(row.segment))
          .map((row) => [normalizeSegment(row.segment), row]),
      ),
    [lopTargetsWithTotal],
  );

  const calculatePercent = (
    numerator: number | null | undefined,
    denominator: number | null | undefined,
  ): number | null => {
    if (!Number.isFinite(denominator ?? 0) || (denominator ?? 0) === 0) return null;
    if (!Number.isFinite(numerator ?? 0)) return null;
    const result = ((numerator ?? 0) / (denominator ?? 0)) * 100;
    return Number.isFinite(result) ? result : null;
  };

  const buildValueRecord = useCallback(
    (getter: (normalizedSegment: string) => number | null): Record<string, number | null> =>
      segmentsWithTotal.reduce<Record<string, number | null>>((acc, segment) => {
        const normalized = normalizeSegment(segment);
        acc[normalized] = getter(normalized);
        return acc;
      }, {}),
    [segmentsWithTotal],
  );

  const combinedRows = useMemo<CombinedRow[]>(() => {
    if (!hasAnyData) return [];

    const rows: CombinedRow[] = [];

    FUNNEL_STAGES.forEach((stage) => {
      rows.push({
        group: "funnel",
        label: FUNNEL_STAGE_LABELS[stage],
        values: buildValueRecord((normalized) => funnelLookup.get(normalized)?.[stage]?.value_m ?? null),
        projects: buildValueRecord((normalized) => funnelLookup.get(normalized)?.[stage]?.projects ?? null),
      });
    });

    rows.push({
      group: "funnel",
      label: "Total Funnel",
      values: buildValueRecord((normalized) => {
        const stages = funnelLookup.get(normalized);
        if (!stages) return null;
        return FUNNEL_STAGES.reduce((acc, stage) => acc + (stages[stage]?.value_m ?? 0), 0);
      }),
      projects: buildValueRecord((normalized) => {
        const stages = funnelLookup.get(normalized);
        if (!stages) return null;
        return FUNNEL_STAGES.reduce((acc, stage) => acc + (stages[stage]?.projects ?? 0), 0);
      }),
    });

    rows.push(
      {
        group: "target",
        label: "Target RKAP",
        values: buildValueRecord((normalized) => targetLookup.get(normalized)?.target_rkap_m ?? null),
      },
      {
        group: "target",
        label: "Target STG",
        values: buildValueRecord((normalized) => targetLookup.get(normalized)?.target_stg_m ?? null),
      },
    );

    rows.push(
      {
        group: "kecukupan",
        label: "Nilai",
        values: buildValueRecord((normalized) => targetLookup.get(normalized)?.lop_value_m ?? null),
      },
      {
        group: "kecukupan",
        label: "% Terhadap RKAP",
        isPercentage: true,
        values: buildValueRecord((normalized) => {
          const row = targetLookup.get(normalized);
          return calculatePercent(row?.lop_value_m ?? null, row?.target_rkap_m ?? null);
        }),
      },
      {
        group: "kecukupan",
        label: "% Terhadap STG",
        isPercentage: true,
        values: buildValueRecord((normalized) => {
          const row = targetLookup.get(normalized);
          return calculatePercent(row?.lop_value_m ?? null, row?.target_stg_m ?? null);
        }),
      },
    );

    rows.push(
      {
        group: "qualified",
        label: "Nilai",
        values: buildValueRecord((normalized) => targetLookup.get(normalized)?.qualified_lop_m ?? null),
      },
      {
        group: "qualified",
        label: "% Terhadap RKAP",
        isPercentage: true,
        values: buildValueRecord((normalized) => {
          const row = targetLookup.get(normalized);
          return calculatePercent(row?.qualified_lop_m ?? null, row?.target_rkap_m ?? null);
        }),
      },
      {
        group: "qualified",
        label: "% Terhadap STG",
        isPercentage: true,
        values: buildValueRecord((normalized) => {
          const row = targetLookup.get(normalized);
          return calculatePercent(row?.qualified_lop_m ?? null, row?.target_stg_m ?? null);
        }),
      },
    );

    return rows;
  }, [buildValueRecord, funnelLookup, hasAnyData, targetLookup]);

  const isCombinedLoading = (isLoading || lopLoading) && !hasAnyData;
  const statusMessages = useMemo<DashboardStatus[]>(
    () =>
      [
        error ? { key: "funnel-error", text: `Gagal memuat data funnel: ${error}` } : null,
        lopError
          ? {
              key: "lop-error",
              text: IS_PRODUCTION
                ? "Tidak bisa memuat data target & LOP."
                : `Tidak bisa memuat data target & LOP. (${lopError})`,
            }
          : null,
      ].filter((item): item is DashboardStatus => Boolean(item)),
    [error, lopError],
  );

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-md shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-950">
        <div className="relative space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold tracking-[0.24em] text-sky-600 uppercase dark:text-sky-300">
                Funnel per Segmen
              </p>
              <h1 className="text-2xl leading-tight font-bold text-slate-900 dark:text-slate-50">
                Ringkasan perjalanan deal
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Lihat konversi antar stage dan bandingkan dengan segmentasi pilihan.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 lg:w-auto lg:items-end">
              <div className="flex flex-wrap items-end justify-start gap-2 lg:justify-end">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-300">
                    Tahun
                  </span>
                  <Select
                    value={selectedYear !== null ? String(selectedYear) : ""}
                    onValueChange={(value) => {
                      setSelectedYear(Number(value));
                      setIsYearReady(true);
                    }}
                  >
                    <SelectTrigger className="h-10 min-w-[120px] rounded-xl border-slate-200 bg-white shadow-sm">
                      <SelectValue placeholder="Pilih tahun" />
                    </SelectTrigger>
                    <SelectContent align="end">
                      {YEAR_OPTIONS.map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-300">
                    Bulan dari
                  </span>
                  <Select
                    value={monthValueToSelect(monthFrom)}
                    onValueChange={(value) => setMonthFrom(value === "all" ? null : Number(value))}
                  >
                    <SelectTrigger className="h-10 min-w-[128px] rounded-xl border-slate-200 bg-white shadow-sm">
                      <SelectValue placeholder="Bulan dari" />
                    </SelectTrigger>
                    <SelectContent align="end">
                      {MONTH_OPTIONS.map((option) => (
                        <SelectItem key={`from-${option.label}`} value={monthValueToSelect(option.value)}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-300">
                    Bulan sampai
                  </span>
                  <Select
                    value={monthValueToSelect(monthTo)}
                    onValueChange={(value) => setMonthTo(value === "all" ? null : Number(value))}
                  >
                    <SelectTrigger className="h-10 min-w-[128px] rounded-xl border-slate-200 bg-white shadow-sm">
                      <SelectValue placeholder="Bulan sampai" />
                    </SelectTrigger>
                    <SelectContent align="end">
                      {MONTH_OPTIONS.map((option) => (
                        <SelectItem key={`to-${option.label}`} value={monthValueToSelect(option.value)}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-xl border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-white"
                  onClick={() => setRefreshTick((tick) => tick + 1)}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Segarkan data
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-950/90">
            <DashboardBody
              statusMessages={statusMessages}
              isCombinedLoading={isCombinedLoading}
              hasAnyData={hasAnyData}
              combinedRows={combinedRows}
              segmentsWithTotal={segmentsWithTotal}
              segmentVisibility={segmentVisibility}
              onToggleSegment={handleToggleSegment}
              onResetSegments={handleResetSegments}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
