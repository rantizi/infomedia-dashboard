"use client";

/**
 * OverviewDashboard Component
 *
 * Client-side dashboard shell that fetches funnel KPIs from
 * `/api/funnel-2rows` and renders the segment tabs + funnel table.
 */

import { useEffect, useMemo, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FunnelApiResponse, LopTargetRow, LopTargetsApiResponse, SegmentFunnel } from "@/types/funnel";

import { FunnelTable } from "./funnel-table";
import { LopBlocks } from "./lop-blocks";
import { SegmentTabs } from "./segment-tabs";
import { TargetBlocks } from "./target-blocks";

const YEAR_OPTIONS: number[] = [2024, 2025, 2026];
const DEFAULT_YEAR = 2026;
const DEFAULT_SEGMENT_ORDER = ["Telkom Group", "SOE", "Private", "Gov", "SME & Reg", "Total"];

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

const normalizeSegment = (segment: string): string => {
  const normalized = segment.trim().toLowerCase();
  return SEGMENT_NORMALIZATION_MAP[normalized] ?? normalized;
};

const orderSegments = (segments: string[]): string[] => {
  const uniqueByNormalized = new Map<string, string>();
  segments.forEach((segment) => {
    const normalized = normalizeSegment(segment);
    if (!uniqueByNormalized.has(normalized)) {
      uniqueByNormalized.set(normalized, segment);
    }
  });

  const normalizedOrder = DEFAULT_SEGMENT_ORDER.map(normalizeSegment);
  const ordered: string[] = [];

  normalizedOrder.forEach((normalized) => {
    const value = uniqueByNormalized.get(normalized);
    if (value) {
      ordered.push(value);
      uniqueByNormalized.delete(normalized);
    }
  });

  const remaining = Array.from(uniqueByNormalized.values()).sort((a, b) => a.localeCompare(b));
  return [...ordered, ...remaining];
};

export function OverviewDashboard() {
  const [data, setData] = useState<SegmentFunnel[]>([]);
  const [lopTargets, setLopTargets] = useState<LopTargetRow[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<string | undefined>(undefined);
  const [selectedYear, setSelectedYear] = useState<number>(DEFAULT_YEAR);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lopLoading, setLopLoading] = useState(true);
  const [lopError, setLopError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    // eslint-disable-next-line complexity
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/funnel-2rows?year=${selectedYear}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        const json = (await response.json().catch(() => null)) as FunnelApiResponse | { error?: string } | null;
        if (!response.ok || (json && "error" in json && json?.error)) {
          const message = json && "error" in json && json.error ? json.error : response.statusText;
          throw new Error(message || "Gagal mengambil data funnel");
        }

        const payload = (json as FunnelApiResponse | null)?.data ?? [];

        if (!isActive) return;
        setData(payload);
        setError(null);
      } catch (err) {
        if (!isActive) return;
        const message = err instanceof Error ? err.message : "Gagal mengambil data funnel";
        setError(message);
        setData([]);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [selectedYear]);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    // eslint-disable-next-line complexity
    const fetchLopTargets = async () => {
      setLopLoading(true);
      try {
        const response = await fetch(`/api/lop-targets?year=${selectedYear}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        const json = (await response.json().catch(() => null)) as LopTargetsApiResponse | { error?: string } | null;
        if (!response.ok || (json && "error" in json && json?.error)) {
          const message = json && "error" in json && json.error ? json.error : response.statusText;
          throw new Error(message || "Gagal mengambil data target & LOP");
        }

        if (!isActive) return;
        setLopTargets((json as LopTargetsApiResponse | null)?.data ?? []);
        setLopError(null);
      } catch (err) {
        if (!isActive) return;
        const message = err instanceof Error ? err.message : "Gagal mengambil data target & LOP";
        setLopError(message);
        setLopTargets([]);
      } finally {
        if (isActive) {
          setLopLoading(false);
        }
      }
    };

    fetchLopTargets();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [selectedYear]);

  useEffect(() => {
    if (!searchParams) return;
    const yearParam = searchParams.get("year");
    const parsedYear = yearParam ? Number(yearParam) : NaN;
    if (!Number.isFinite(parsedYear) || !YEAR_OPTIONS.includes(parsedYear)) return;
    if (parsedYear === selectedYear) return;
    setSelectedYear(parsedYear);
  }, [searchParams, selectedYear]);

  useEffect(() => {
    if (!searchParams) return;
    const currentYear = searchParams.get("year");
    const nextYear = String(selectedYear);
    if (currentYear === nextYear) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("year", nextYear);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams, selectedYear]);

  const orderedSegments = useMemo(
    () => orderSegments([...data.map((item) => item.segment), ...lopTargets.map((item) => item.segment)]),
    [data, lopTargets],
  );

  useEffect(() => {
    if (orderedSegments.length === 0) return;
    const hasSelected = selectedSegment && orderedSegments.some((segment) => segment === selectedSegment);
    if (hasSelected) return;

    const totalSegment = orderedSegments.find((segment) => normalizeSegment(segment) === "total");
    setSelectedSegment(totalSegment ?? orderedSegments[0]);
  }, [orderedSegments, selectedSegment]);

  const totalSegment = orderedSegments.find((segment) => normalizeSegment(segment) === "total");
  const visibleSegments =
    selectedSegment && normalizeSegment(selectedSegment) !== "total" && totalSegment
      ? [selectedSegment, totalSegment]
      : orderedSegments;
  const renderFunnelContent = () => {
    if (isLoading) {
      return (
        <div className="rounded-xl border border-slate-200/60 bg-white/70 px-4 py-6 text-sm text-slate-600 shadow-sm backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-300">
          Memuat data funnel...
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-xl border border-rose-200/60 bg-rose-50/60 px-4 py-6 text-sm text-rose-700 shadow-sm backdrop-blur dark:border-rose-900/60 dark:bg-rose-950/60 dark:text-rose-200">
          Gagal memuat data funnel: {error}
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="rounded-xl border border-slate-200/60 bg-white/70 px-4 py-6 text-sm text-slate-600 shadow-sm backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-300">
          Tidak ada data funnel untuk ditampilkan.
        </div>
      );
    }

    return <FunnelTable data={data} segments={visibleSegments} activeSegment={selectedSegment} />;
  };

  const renderLopContent = () => {
    if (lopLoading) {
      return (
        <div className="rounded-xl border border-slate-200/60 bg-white/70 px-4 py-6 text-sm text-slate-600 shadow-sm backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-300">
          Memuat target & LOP...
        </div>
      );
    }

    if (lopError) {
      return (
        <div className="rounded-xl border border-rose-200/60 bg-rose-50/60 px-4 py-6 text-sm text-rose-700 shadow-sm backdrop-blur dark:border-rose-900/60 dark:bg-rose-950/60 dark:text-rose-200">
          Tidak bisa memuat data target & LOP.
        </div>
      );
    }

    if (lopTargets.length === 0) {
      return (
        <div className="rounded-xl border border-slate-200/60 bg-white/70 px-4 py-6 text-sm text-slate-600 shadow-sm backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-300">
          Tidak ada data target & LOP untuk ditampilkan.
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <TargetBlocks targets={lopTargets} segments={visibleSegments} activeSegment={selectedSegment} />
        <LopBlocks targets={lopTargets} segments={visibleSegments} activeSegment={selectedSegment} />
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header with Segment Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Overview</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Dashboard funnel penjualan untuk Infomedia</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <SegmentTabs value={selectedSegment} segments={orderedSegments} onValueChange={setSelectedSegment} />
          <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
            <SelectTrigger className="w-[120px]">
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
      </div>

      {/* Funnel Table */}
      <section>{renderFunnelContent()}</section>

      {/* Targets & LOP */}
      <section>{renderLopContent()}</section>
    </div>
  );
}
