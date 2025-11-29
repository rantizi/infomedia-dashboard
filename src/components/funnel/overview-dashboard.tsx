"use client";
/* eslint-disable max-lines */

/**
 * OverviewDashboard Component
 *
 * Client-side dashboard shell that fetches funnel KPIs from
 * `/api/funnel-2rows` and renders the segment tabs + funnel table.
 */

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { AlertTriangle, Database, RefreshCcw, Sparkles, UploadCloud } from "lucide-react";

import { FunnelTable } from "@/components/funnel/funnel-table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FunnelApiResponse, LopTargetRow, LopTargetsApiResponse, SegmentFunnel } from "@/types/funnel";

import { LopBlocks } from "./lop-blocks";
import { GlassSection, StatusPanel } from "./section-shell";
import { SegmentTabs } from "./segment-tabs";
import { isValidSegment } from "./segment-utils";
import { TargetBlocks } from "./target-blocks";

const YEAR_OPTIONS: number[] = [2024, 2025, 2026];
const DEFAULT_YEAR = YEAR_OPTIONS.at(-1) ?? new Date().getFullYear();
const DEFAULT_SEGMENT_ORDER = ["Telkom Group", "SOE", "Private", "Gov", "SME & Reg", "Total"];

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

const normalizeSegment = (segment: string): string => {
  const normalized = segment.trim().toLowerCase();
  return SEGMENT_NORMALIZATION_MAP.get(normalized) ?? normalized;
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
  const [lopHasData, setLopHasData] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<string | undefined>(undefined);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isYearReady, setIsYearReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lopLoading, setLopLoading] = useState(true);
  const [lopError, setLopError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const triggerRefresh = () => setRefreshKey((prev) => prev + 1);

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
        const errorMessage = json && "error" in json ? json.error : undefined;
        if (!response.ok || errorMessage) {
          const fallbackMessage = errorMessage ?? response.statusText;
          throw new Error(fallbackMessage);
        }

        const payload = (json as FunnelApiResponse | null)?.rows ?? (json as FunnelApiResponse | null)?.data ?? [];

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

    void fetchData();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [selectedYear, isYearReady, refreshKey]);

  useEffect(() => {
    if (!isYearReady || selectedYear === null) return;

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
        const errorMessage = json && "error" in json ? json.error : undefined;
        if (!response.ok || errorMessage) {
          const fallbackMessage = errorMessage ?? response.statusText;
          throw new Error(fallbackMessage);
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
        setLopError(message);
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
  }, [selectedYear, isYearReady, refreshKey]);

  useEffect(() => {
    const yearParam = searchParams.get("year");
    const parsedYear = yearParam ? Number(yearParam) : NaN;
    const nextYear = Number.isFinite(parsedYear) && YEAR_OPTIONS.includes(parsedYear) ? parsedYear : DEFAULT_YEAR;

    setSelectedYear((prev) => (prev === nextYear ? prev : nextYear));
    if (!isYearReady) {
      setIsYearReady(true);
    }
  }, [searchParams, isYearReady]);

  useEffect(() => {
    if (!isYearReady || selectedYear === null) return;
    const currentYear = searchParams.get("year");
    const nextYear = String(selectedYear);
    if (currentYear === nextYear) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("year", nextYear);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams, selectedYear, isYearReady]);

  const orderedSegments = useMemo(() => {
    const allSegments = [...data.map((item) => item.segment), ...lopTargets.map((item) => item.segment)];
    const validSegments = allSegments.filter(isValidSegment);
    return orderSegments(validSegments);
  }, [data, lopTargets]);

  const totalSegment = useMemo(
    () => orderedSegments.find((segment) => normalizeSegment(segment) === "total"),
    [orderedSegments],
  );

  useEffect(() => {
    if (orderedSegments.length === 0) return;
    const hasSelected = selectedSegment && orderedSegments.some((segment) => segment === selectedSegment);
    if (hasSelected) return;

    setSelectedSegment(totalSegment ?? orderedSegments[0]);
  }, [orderedSegments, selectedSegment, totalSegment]);

  const visibleSegments = useMemo(() => {
    const baseSegments =
      selectedSegment && normalizeSegment(selectedSegment) !== "total" && totalSegment
        ? [selectedSegment, totalSegment]
        : orderedSegments;
    return baseSegments.filter(isValidSegment);
  }, [orderedSegments, selectedSegment, totalSegment]);

  const funnelDataAvailable = Array.isArray(data) && data.length > 0;
  const lopDataAvailable = lopHasData || (Array.isArray(lopTargets) && lopTargets.length > 0);
  const yearLabel = selectedYear ?? "yang dipilih";

  const uploadCta = (
    <Button asChild size="sm" variant="success">
      <Link href="/add-data">Upload data</Link>
    </Button>
  );

  const renderFunnelContent = () => {
    if (isLoading) {
      return (
        <StatusPanel
          icon={RefreshCcw}
          title="Memuat data funnel"
          description="Kami sedang mengambil metrik funnel terbaru. Mohon tunggu beberapa detik."
          actions={
            <Button size="sm" variant="outline" className="gap-2" disabled>
              <RefreshCcw className="h-4 w-4 animate-spin" />
              Menyinkronkan
            </Button>
          }
        />
      );
    }

    if (error) {
      return (
        <StatusPanel
          icon={AlertTriangle}
          tone="danger"
          title="Gagal memuat data funnel"
          description={error}
          actions={
            <Button size="sm" variant="outline" className="gap-2" onClick={triggerRefresh}>
              <RefreshCcw className="h-4 w-4" />
              Coba lagi
            </Button>
          }
        />
      );
    }

    if (!funnelDataAvailable) {
      return (
        <StatusPanel
          icon={Database}
          tone="muted"
          title={`Data funnel belum tersedia untuk tahun ${yearLabel}`}
          description={
            selectedYear !== null
              ? `Kami belum menemukan data funnel untuk tahun ${yearLabel}. Unggah data atau pilih tahun lain.`
              : "Unggah data pertama Anda untuk melihat pergerakan funnel per segmen."
          }
          actions={uploadCta}
        />
      );
    }

    return <FunnelTable data={data} segments={visibleSegments} activeSegment={selectedSegment} />;
  };

  const renderLopContent = () => {
    if (lopLoading) {
      return (
        <StatusPanel
          icon={RefreshCcw}
          title="Memuat target & LOP"
          description="Menarik data target RKAP/STG serta LOP per segmen."
          actions={
            <Button size="sm" variant="outline" className="gap-2" disabled>
              <RefreshCcw className="h-4 w-4 animate-spin" />
              Menyinkronkan
            </Button>
          }
        />
      );
    }

    if (lopError) {
      return (
        <StatusPanel
          icon={AlertTriangle}
          tone="danger"
          title="Tidak bisa memuat target & LOP"
          description={lopError}
          actions={
            <Button size="sm" variant="outline" className="gap-2" onClick={triggerRefresh}>
              <RefreshCcw className="h-4 w-4" />
              Muat ulang
            </Button>
          }
        />
      );
    }

    if (!lopDataAvailable) {
      return (
        <StatusPanel
          icon={UploadCloud}
          tone="muted"
          title={`Target & LOP belum tersedia untuk tahun ${yearLabel}`}
          description={
            selectedYear !== null
              ? `Tambahkan data target atau LOP untuk tahun ${yearLabel} agar metrik dapat ditampilkan.`
              : "Tambahkan data target atau LOP untuk mulai memantau progres per segmen."
          }
          actions={uploadCta}
        />
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
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-br from-slate-50 via-white to-slate-100/70 p-6 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.65)] dark:border-slate-800/60 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950/80">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(52,211,153,0.14),transparent_30%),radial-gradient(circle_at_60%_80%,rgba(94,234,212,0.12),transparent_40%)]" />
      <div className="relative space-y-10">
        {/* Header with Segment Tabs */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-slate-600 uppercase shadow-sm backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/70 dark:text-slate-200">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Infomedia Funnel
            </div>
            <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-50">Overview</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Dashboard funnel penjualan dengan target & LOP yang selalu terbarui.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <SegmentTabs value={selectedSegment} segments={orderedSegments} onValueChange={setSelectedSegment} />
            <Select
              value={selectedYear !== null ? String(selectedYear) : ""}
              onValueChange={(value) => {
                setSelectedYear(Number(value));
                setIsYearReady(true);
              }}
            >
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

        <GlassSection>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">Funnel per segmen</p>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Ringkasan perjalanan deal</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Lihat konversi antar stage dan bandingkan dengan segmentasi pilihan.
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={triggerRefresh}>
              <RefreshCcw className="h-4 w-4" />
              Segarkan data
            </Button>
          </div>
          <div className="mt-6">{renderFunnelContent()}</div>
        </GlassSection>

        <GlassSection>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">Target & LOP</p>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Kecukupan pipeline</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Bandingkan target RKAP/STG dengan nilai LOP dan qualified LOP.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={triggerRefresh}>
                <RefreshCcw className="h-4 w-4" />
                Muat ulang
              </Button>
              {uploadCta}
            </div>
          </div>
          <div className="mt-6">{renderLopContent()}</div>
        </GlassSection>
      </div>
    </div>
  );
}
