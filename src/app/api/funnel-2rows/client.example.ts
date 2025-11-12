/**
 * Example client code for calling GET /api/funnel-2rows
 * File: src/app/api/funnel-2rows/client.example.ts
 * Status: Reference, do NOT commit to repo
 */

/**
 * Type definition for the funnel stage row.
 * Matches the route response.
 */
export interface FunnelStageRow {
  stage: 'leads' | 'prospect' | 'qualified' | 'submission' | 'win' | 'qualified_lop'
  value_m: number
  projects: number
}

/**
 * Type definition for the full API response.
 */
export interface FunnelResponse {
  segment: string
  stages: FunnelStageRow[]
}

/**
 * Query parameters for the funnel endpoint.
 */
export interface FunnelQueryParams {
  tenant_id: string
  segment?: string
  from?: string // ISO datetime
  to?: string // ISO datetime
}

/**
 * Fetch funnel KPI data from the API.
 *
 * @example
 *   const data = await getFunnelData({
 *     tenant_id: 'acme-corp',
 *     segment: 'Telkom Group',
 *     from: '2025-01-01T00:00:00Z',
 *     to: '2025-12-31T23:59:59Z'
 *   })
 *   console.log(data.stages)
 */
export async function getFunnelData(params: FunnelQueryParams): Promise<FunnelResponse> {
  const searchParams = new URLSearchParams({
    tenant_id: params.tenant_id,
    ...(params.segment && { segment: params.segment }),
    ...(params.from && { from: params.from }),
    ...(params.to && { to: params.to }),
  })

  const response = await fetch(`/api/funnel-2rows?${searchParams.toString()}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(
      `Funnel API error [${response.status}]: ${error.error} (${error.details || error.message || ''})`
    )
  }

  return response.json()
}

/**
 * Example usage in a React component (Client Component).
 */
// 'use client'
// import { useEffect, useState } from 'react'
// import { getFunnelData, type FunnelResponse } from '@/app/api/funnel-2rows/client.example'
//
// export function FunnelKPICards() {
//   const [data, setData] = useState<FunnelResponse | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)
//
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const result = await getFunnelData({
//           tenant_id: 'my-tenant', // TODO: Get from auth context
//           segment: 'Total',
//           from: '2025-11-01T00:00:00Z',
//           to: '2025-11-30T23:59:59Z',
//         })
//         setData(result)
//       } catch (err) {
//         setError(err instanceof Error ? err.message : String(err))
//       } finally {
//         setLoading(false)
//       }
//     }
//     fetchData()
//   }, [])
//
//   if (loading) return <div>Loading...</div>
//   if (error) return <div>Error: {error}</div>
//   if (!data) return <div>No data</div>
//
//   return (
//     <div className="grid grid-cols-2 gap-4">
//       {data.stages.map((stage) => (
//         <div key={stage.stage} className="border p-4 rounded">
//           <div className="text-sm font-semibold text-gray-600 uppercase">
//             {stage.stage}
//           </div>
//           <div className="text-2xl font-bold">${stage.value_m}M</div>
//           <div className="text-xs text-gray-500">{stage.projects} projects</div>
//         </div>
//       ))}
//     </div>
//   )
// }
