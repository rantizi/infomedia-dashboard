"use client";

/**
 * OverviewDashboard Component
 *
 * Client component that handles:
 * - Data fetching from /api/funnel-2rows
 * - Segment selection state (currently shows Total only as per requirements)
 * - Loading states
 * - Composing all dashboard sections
 */

import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { Funnel2RowsResponse, Segment } from "@/types/funnel";

import { FunnelTable } from "./funnel-table";
import { LopBlocks } from "./lop-blocks";
import { SegmentTabs } from "./segment-tabs";
import { TargetBlocks } from "./target-blocks";

/**
 * Hook to fetch funnel data from the API
 */
function useFunnelData() {
  const [data, setData] = useState<Funnel2RowsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/funnel-2rows");

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const jsonData = await response.json();
        setData(jsonData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("[OverviewDashboard] Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { data, loading, error };
}

/**
 * Loading skeleton for the dashboard
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-96 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

/**
 * Error display
 */
function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
      <h3 className="text-lg font-semibold text-red-900">Error Loading Data</h3>
      <p className="mt-2 text-sm text-red-700">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
      >
        Retry
      </button>
    </div>
  );
}

/**
 * OverviewDashboard — Main client component for the Overview page
 *
 * Features:
 * - Fetches data from /api/funnel-2rows
 * - Shows segment tabs (currently displaying Total only as per requirements)
 * - Renders funnel table, target blocks, and LOP blocks
 * - Handles loading and error states
 */
export function OverviewDashboard() {
  const { data, loading, error } = useFunnelData();
  const [selectedSegment, setSelectedSegment] = useState<Segment>("TOTAL");

  // Show loading state
  if (loading) {
    return <DashboardSkeleton />;
  }

  // Show error state
  if (error || !data) {
    return <ErrorDisplay message={error ?? "Failed to load data"} />;
  }

  return (
    <div className="space-y-8">
      {/* Header with Segment Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Overview</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Sales funnel dashboard for Infomedia</p>
        </div>
        <SegmentTabs value={selectedSegment} onValueChange={setSelectedSegment} />
      </div>

      {/* Note: Currently showing all segments in table view as per requirements */}
      {/* The segment tabs are for future functionality */}

      {/* Funnel Table */}
      <section>
        <FunnelTable data={data} />
      </section>

      {/* Target Blocks */}
      <section>
        <TargetBlocks data={data} />
      </section>

      {/* LOP Blocks */}
      <section>
        <LopBlocks data={data} />
      </section>
    </div>
  );
}
