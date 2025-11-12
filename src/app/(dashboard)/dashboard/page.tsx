import { StageTwoRowTable } from '@/components/StageTwoRowTable'
import { Card } from '@/components/ui/card'
import { Suspense } from 'react'

/**
 * Type for the API response.
 */
interface FunnelResponse {
  segment: string
  stages: Array<{
    stage: 'leads' | 'prospect' | 'qualified' | 'submission' | 'win' | 'qualified_lop'
    value_m: number
    projects: number
  }>
}

/**
 * Server component that fetches funnel data and renders the dashboard.
 * 
 * TODO: Extract tenant_id and date range from auth context / query params.
 * For now, uses mock values.
 */
async function FunnelKPIContent({
  segment = 'Total',
  from,
  to,
  tenantId = 'mock-tenant', // TODO: Get from auth
}: {
  segment?: string
  from?: string
  to?: string
  tenantId?: string
}) {
  try {
    // Build query string
    const params = new URLSearchParams({
      tenant_id: tenantId,
      segment,
      ...(from && { from }),
      ...(to && { to }),
    })

    // Fetch from API (no cache = always fresh)
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/funnel-2rows?${params.toString()}`,
      { cache: 'no-store' }
    )

    if (!response.ok) {
      const error = await response.json()
      return (
        <Card className="p-6">
          <div className="text-center">
            <p className="text-red-600">Failed to load funnel data</p>
            <p className="mt-2 text-sm text-gray-500">
              {error.error}: {error.details || error.message}
            </p>
          </div>
        </Card>
      )
    }

    const data: FunnelResponse = await response.json()

    return (
      <StageTwoRowTable
        stages={data.stages}
        segment={data.segment}
        from={from}
        to={to}
      />
    )
  } catch (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-red-600">Error fetching funnel data</p>
          <p className="mt-2 text-sm text-gray-500">
            {error instanceof Error ? error.message : String(error)}
          </p>
        </div>
      </Card>
    )
  }
}

/**
 * Loading skeleton for the funnel grid.
 */
function FunnelLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Main stages skeleton */}
      <div>
        <div className="mb-4 h-6 w-40 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-lg bg-gray-200 md:h-40"
            />
          ))}
        </div>
      </div>

      {/* Qualified LOP skeleton */}
      <div>
        <div className="mb-3 h-6 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-40 animate-pulse rounded-lg bg-gray-200" />
      </div>
    </div>
  )
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
export default function DashboardPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[]>
}) {
  const segment = (searchParams?.segment as string) || 'Total'
  const from = searchParams?.from as string | undefined
  const to = searchParams?.to as string | undefined

  return (
    <main className="space-y-8 p-4 md:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sales Funnel Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Monitor your B2B sales pipeline across stages and segments
        </p>
      </div>

      {/* TODO: Segment Tabs Component */}
      {/* TODO: Date Range Picker Component */}

      {/* KPI Grid with Suspense boundary */}
      <Suspense fallback={<FunnelLoadingSkeleton />}>
        <FunnelKPIContent
          segment={segment}
          from={from}
          to={to}
          tenantId="mock-tenant"
        />
      </Suspense>

      {/* TODO: Drilldown table (stage detail view) */}
    </main>
  )
}
