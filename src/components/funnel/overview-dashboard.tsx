"use client";

/**
 * OverviewDashboard Component
 *
 * Client shell that renders the overview dashboard using server-provided data
 * while keeping the existing interactive segment tabs UI.
 */

import { useState } from "react";

import { Funnel2RowsResponse, Segment } from "@/types/funnel";

import { FunnelTable } from "./funnel-table";
import { LopBlocks } from "./lop-blocks";
import { SegmentTabs } from "./segment-tabs";
import { TargetBlocks } from "./target-blocks";

interface OverviewDashboardProps {
  data: Funnel2RowsResponse;
}

export function OverviewDashboard({ data }: OverviewDashboardProps) {
  const [selectedSegment, setSelectedSegment] = useState<Segment>("TOTAL");

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
