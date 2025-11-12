import { Card } from '@/components/ui/card'

/**
 * Funnel Stage Detail Page.
 *
 * Route: /funnel?stage=leads&segment=Total&from=...&to=...
 *
 * TODO: Implement a detailed drilldown view that shows:
 *   - Individual opportunities in the stage
 *   - Filterable table (company, value, owner, aging)
 *   - Stage transition times and conversion rates
 *   - Export to CSV
 */
export default function FunnelDetailPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[]>
}) {
  const stage = (searchParams?.stage as string) || 'leads'
  const segment = (searchParams?.segment as string) || 'Total'
  const from = searchParams?.from as string | undefined
  const to = searchParams?.to as string | undefined

  return (
    <main className="space-y-8 p-4 md:p-8">
      {/* Breadcrumb / Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <a href="/dashboard" className="hover:text-gray-700">
            Dashboard
          </a>
          <span>/</span>
          <span className="font-medium text-gray-900 capitalize">{stage}</span>
        </div>

        <h1 className="mt-4 text-3xl font-bold text-gray-900 capitalize">
          {stage} Pipeline
        </h1>
        <p className="mt-2 text-gray-600">
          Segment: <span className="font-medium">{segment}</span>
          {from && to && (
            <>
              {' '}
              | Period: <span className="font-medium">{from}</span> to{' '}
              <span className="font-medium">{to}</span>
            </>
          )}
        </p>
      </div>

      {/* Placeholder for drilldown content */}
      <Card className="p-6">
        <div className="text-center">
          <p className="text-gray-600">
            Detailed view for <strong className="capitalize">{stage}</strong> stage
          </p>
          <p className="mt-2 text-sm text-gray-500">
            TODO: Implement opportunities table, conversion metrics, and filters
          </p>
        </div>
      </Card>
    </main>
  )
}
