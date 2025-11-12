import { Suspense } from "react";

import { headers } from "next/headers";

import { StageTwoRowTable } from "@/components/StageTwoRowTable";
import { Card } from "@/components/ui/card";

/**
 * Type for the API response.
 */
interface FunnelResponse {
  segment: string;
  stages: Array<{
    stage: "leads" | "prospect" | "qualified" | "submission" | "win" | "qualified_lop";
    value_m: number;
    projects: number;
  }>;
}

interface FunnelRequestParams {
  segment: string;
  from?: string;
  to?: string;
  tenantId: string;
}

type FunnelResult =
  | { status: "success"; data: FunnelResponse }
  | { status: "error"; title: string; description: string };

/**
 * Server component that fetches funnel data and renders the dashboard.
 *
 * TODO: Extract tenant_id and date range from auth context / query params.
 * For now, uses mock values.
 */
function resolveApiBaseUrl(): string {
  const explicitBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_URL;

  if (explicitBaseUrl) {
    return explicitBaseUrl.startsWith("http") ? explicitBaseUrl : `https://${explicitBaseUrl}`;
  }

  const requestHeaders = headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (!host) {
    return "http://localhost:3000";
  }

  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

function ErrorCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="p-6">
      <div className="text-center">
        <p className="text-red-600">{title}</p>
        <p className="mt-2 text-sm text-gray-500">{description}</p>
      </div>
    </Card>
  );
}

function ensureMessage(message: string | undefined, fallback: string): string {
  if (message && message.trim().length > 0) {
    return message;
  }

  return fallback;
}

function createFunnelRequestUrl({ segment, from, to, tenantId }: FunnelRequestParams): URL {
  const params = new URLSearchParams({
    tenant_id: tenantId,
    segment,
  });

  if (from) {
    params.set("from", from);
  }

  if (to) {
    params.set("to", to);
  }

  const baseUrl = resolveApiBaseUrl();
  const requestUrl = new URL("/api/funnel-2rows", baseUrl);
  requestUrl.search = params.toString();

  return requestUrl;
}

async function parseApiError(response: Response): Promise<{ title: string; description: string }> {
  let errorDetails: { error?: string; message?: string; details?: string } | null = null;

  try {
    errorDetails = await response.json();
  } catch (parseError) {
    console.error("Failed to parse funnel API error response", parseError);
  }

  const title =
    response.status === 404 ? "No funnel data available" : (errorDetails?.error ?? "Failed to load funnel data");
  const description =
    errorDetails?.details ??
    errorDetails?.message ??
    (response.status === 404
      ? "We could not find any funnel metrics for the selected filters."
      : "Please try again in a moment or adjust your filters.");

  return { title, description };
}

async function getFunnelData(params: FunnelRequestParams): Promise<FunnelResult> {
  const requestUrl = createFunnelRequestUrl(params);

  let response: Response;

  try {
    response = await fetch(requestUrl, { cache: "no-store" });
  } catch (error) {
    const message = ensureMessage(
      error instanceof Error ? error.message : String(error),
      "Unexpected error while contacting the funnel service.",
    );

    return {
      status: "error",
      title: "Error fetching funnel data",
      description: message,
    };
  }

  if (!response.ok) {
    const { title, description } = await parseApiError(response);

    return {
      status: "error",
      title,
      description,
    };
  }

  try {
    const data = (await response.json()) as FunnelResponse;

    return {
      status: "success",
      data,
    };
  } catch (error) {
    const message = ensureMessage(
      error instanceof Error ? error.message : String(error),
      "Unexpected response received from the funnel service.",
    );

    return {
      status: "error",
      title: "Error parsing funnel data",
      description: message,
    };
  }
}

async function FunnelKPIContent({
  segment = "Total",
  from,
  to,
  tenantId = "mock-tenant", // TODO: Get from auth
}: {
  segment?: string;
  from?: string;
  to?: string;
  tenantId?: string;
}) {
  const result = await getFunnelData({ segment, from, to, tenantId });

  if (result.status === "error") {
    return <ErrorCard title={result.title} description={result.description} />;
  }

  return <StageTwoRowTable stages={result.data.stages} segment={result.data.segment} from={from} to={to} />;
}

/**
 * Loading skeleton for the funnel grid.
 */
function FunnelLoadingSkeleton() {
  const skeletonStages = ["leads", "prospect", "qualified", "submission", "win"];

  return (
    <div className="space-y-6">
      {/* Main stages skeleton */}
      <div>
        <div className="mb-4 h-6 w-40 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
          {skeletonStages.map((stageKey) => (
            <div key={stageKey} className="h-32 animate-pulse rounded-lg bg-gray-200 md:h-40" />
          ))}
        </div>
      </div>

      {/* Qualified LOP skeleton */}
      <div>
        <div className="mb-3 h-6 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-40 animate-pulse rounded-lg bg-gray-200" />
      </div>
    </div>
  );
}

/**
 * Dashboard Page (Server Component).
 *
 * Displays:
 *   1. Segment tabs (TODO: implement)
 *   2. Date range picker (TODO: implement)
 *   3. StageTwoRowTable with KPI grid
 *
 * Query parameters (for future implementation):
 *   - segment: Active segment (default "Total")
 *   - from: Start date (ISO datetime)
 *   - to: End date (ISO datetime)
 */
export default function DashboardPage({ searchParams }: { searchParams?: Record<string, string | string[]> }) {
  const segment = (searchParams?.segment as string) || "Total";
  const from = searchParams?.from as string | undefined;
  const to = searchParams?.to as string | undefined;

  return (
    <main className="space-y-8 p-4 md:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sales Funnel Dashboard</h1>
        <p className="mt-2 text-gray-600">Monitor your B2B sales pipeline across stages and segments</p>
      </div>

      {/* TODO: Segment Tabs Component */}
      {/* TODO: Date Range Picker Component */}

      {/* KPI Grid with Suspense boundary */}
      <Suspense fallback={<FunnelLoadingSkeleton />}>
        <FunnelKPIContent segment={segment} from={from} to={to} tenantId="mock-tenant" />
      </Suspense>

      {/* TODO: Drilldown table (stage detail view) */}
    </main>
  );
}
