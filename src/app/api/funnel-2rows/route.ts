import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * Query schema for funnel-2rows endpoint.
 * - from, to: ISO date strings for filtering (optional)
 * - segment: segment name (default "Total")
 * - tenant_id: mock tenant ID for now (TODO: derive from JWT)
 */
const FunnelQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  segment: z.string().default('Total'),
  tenant_id: z.string().min(1, 'tenant_id is required'),
})

type FunnelQuery = z.infer<typeof FunnelQuerySchema>

/**
 * Response shape for a single stage in the funnel.
 */
interface FunnelStageRow {
  stage: 'leads' | 'prospect' | 'qualified' | 'submission' | 'win' | 'qualified_lop'
  value_m: number
  projects: number
}

/**
 * Parse query parameters from NextRequest.
 * Returns parsed query or null if validation fails.
 */
function parseQuery(request: NextRequest): FunnelQuery | null {
  try {
    const { searchParams } = new URL(request.url)
    const queryData = {
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      segment: searchParams.get('segment') || 'Total',
      tenant_id: searchParams.get('tenant_id'),
    }
    return FunnelQuerySchema.parse(queryData)
  } catch (error) {
    return null
  }
}

/**
 * Fetch funnel KPI data from the vw_funnel_kpi_per_segment view.
 * The view returns columns:
 *   - segment, leads_value_m, leads_projects, prospect_value_m, ...
 *     ..., win_value_m, win_projects, qualified_lop_value_m, qualified_lop_projects
 */
async function fetchFunnelData(
  query: FunnelQuery
): Promise<Record<string, unknown> | null> {
  const supabase = createServerClient()

  try {
    let queryBuilder = supabase
      .from('vw_funnel_kpi_per_segment')
      .select('*')
      .eq('tenant_id', query.tenant_id)
      .eq('segment', query.segment)

    // Optional date filtering
    if (query.from) {
      queryBuilder = queryBuilder.gte('date_from', query.from)
    }
    if (query.to) {
      queryBuilder = queryBuilder.lte('date_to', query.to)
    }

    const { data, error } = await queryBuilder.single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    throw error
  }
}

/**
 * Transform view row into array of stage rows.
 * The view columns follow pattern: {stage}_value_m, {stage}_projects
 */
function transformViewRow(row: Record<string, unknown>): FunnelStageRow[] {
  const stages = [
    'leads',
    'prospect',
    'qualified',
    'submission',
    'win',
    'qualified_lop',
  ] as const

  return stages.map((stage) => ({
    stage,
    value_m: (row[`${stage}_value_m`] as number) || 0,
    projects: (row[`${stage}_projects`] as number) || 0,
  }))
}

/**
 * GET /api/funnel-2rows
 *
 * Query parameters:
 *   - from (optional): ISO datetime, start date filter
 *   - to (optional): ISO datetime, end date filter
 *   - segment (optional, default "Total"): segment name
 *   - tenant_id (required): tenant ID (mock, TODO: derive from JWT)
 *
 * Response: Array of 6 stage rows (leads, prospect, qualified, submission, win, qualified_lop)
 *
 * Errors:
 *   - 400: Invalid query parameters
 *   - 404: No data found for the segment/tenant
 *   - 500: Database error
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse and validate query parameters
    const query = parseQuery(request)
    if (!query) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details:
            'Required: tenant_id (string). Optional: from, to (ISO datetime), segment (string, default "Total")',
        },
        { status: 400 }
      )
    }

    // Fetch data from view
    const row = await fetchFunnelData(query)
    if (!row) {
      return NextResponse.json(
        { error: 'No data found for the given segment and tenant' },
        { status: 404 }
      )
    }

    // Transform to response shape
    const stages = transformViewRow(row)

    return NextResponse.json(
      {
        segment: query.segment,
        stages,
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    // Log error for debugging (in production, use structured logging)
    console.error('[/api/funnel-2rows] Database error:', message)

    return NextResponse.json(
      {
        error: 'Failed to fetch funnel data',
        message: process.env.NODE_ENV === 'development' ? message : undefined,
      },
      { status: 500 }
    )
  }
}
