import Link from 'next/link'
import { Card } from '@/components/ui/card'

/**
 * Format a number as Indonesian Rupiah currency.
 * @example formatCurrency(150.5) → "Rp 150,50 M"
 */
function formatCurrency(valueM: number): string {
  return `Rp ${valueM.toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} M`
}

/**
 * Format project count with label.
 * @example formatProjects(45) → "45 prj"
 */
function formatProjects(count: number): string {
  return `${count} prj`
}

/**
 * Type for a single stage row from API.
 */
export interface FunnelStageRow {
  stage: 'leads' | 'prospect' | 'qualified' | 'submission' | 'win' | 'qualified_lop'
  value_m: number
  projects: number
}

/**
 * Props for StageTwoRowTable.
 */
interface StageTwoRowTableProps {
  stages: FunnelStageRow[]
  segment: string
  from?: string // ISO datetime
  to?: string // ISO datetime
}

/**
 * StageTwoRowTable — Renders a 5×2 grid of funnel stages + Qualified LOP block.
 *
 * Each stage cell displays:
 *   Row 1: Formatted currency value (Rp X,XXX M)
 *   Row 2: Project count (N prj)
 *
 * Clicking a stage navigates to /funnel?stage=...&segment=...&from=...&to=...
 *
 * Accessibility:
 *   - Semantic HTML (article, header, section)
 *   - Screen reader: Stage name as heading + values as data
 *   - Keyboard: All links focusable and keyboard-navigable
 *
 * Responsive:
 *   - md: Grid 5 columns
 *   - sm: Stack to 2 columns
 */
export function StageTwoRowTable({
  stages,
  segment,
  from,
  to,
}: StageTwoRowTableProps) {
  // Extract main 5 stages (exclude qualified_lop for the grid)
  const mainStages = stages.filter((s) => s.stage !== 'qualified_lop')

  // Find qualified_lop block
  const qualifiedLOP = stages.find((s) => s.stage === 'qualified_lop')

  /**
   * Build query string for navigation link.
   */
  function buildFunnelLink(stageName: string): string {
    const params = new URLSearchParams({
      stage: stageName,
      segment,
      ...(from && { from }),
      ...(to && { to }),
    })
    return `/funnel?${params.toString()}`
  }

  /**
   * Render a single stage cell (2 rows: value + projects).
   */
  function StageCell({ stage }: { stage: FunnelStageRow }) {
    const href = buildFunnelLink(stage.stage)

    return (
      <Link href={href}>
        <Card className="group relative flex cursor-pointer flex-col gap-2 p-4 transition-all hover:shadow-md hover:ring-2 hover:ring-blue-400 md:p-6">
          {/* Stage name header */}
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-700 md:text-sm">
            {stage.stage}
          </h3>

          {/* Value row */}
          <div className="text-xl font-bold text-gray-900 md:text-2xl">
            {formatCurrency(stage.value_m)}
          </div>

          {/* Projects row */}
          <div className="text-sm text-gray-600">
            {formatProjects(stage.projects)}
          </div>

          {/* Hover indicator */}
          <span className="absolute bottom-2 right-2 text-xs opacity-0 transition-opacity group-hover:opacity-100">
            →
          </span>
        </Card>
      </Link>
    )
  }

  return (
    <article className="space-y-6">
      {/* Main funnel stages grid */}
      <section>
        <header className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Funnel by Stage
          </h2>
          {segment && (
            <p className="text-sm text-gray-500">
              Segment: <span className="font-medium">{segment}</span>
            </p>
          )}
        </header>

        {/* 5-column grid (responsive: sm=2, md=5) */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
          {mainStages.map((stage) => (
            <StageCell key={stage.stage} stage={stage} />
          ))}
        </div>
      </section>

      {/* Qualified LOP block */}
      {qualifiedLOP && (
        <section>
          <header className="mb-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Qualified LOP
            </h2>
            <p className="text-xs text-gray-500">
              Qualified + Submission + Win
            </p>
          </header>

          <Link href={buildFunnelLink('qualified_lop')}>
            <Card className="group relative flex cursor-pointer flex-col gap-2 p-4 transition-all hover:shadow-md hover:ring-2 hover:ring-green-400 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                    Total Pipeline
                  </h3>
                  <div className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">
                    {formatCurrency(qualifiedLOP.value_m)}
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    {formatProjects(qualifiedLOP.projects)}
                  </div>
                </div>
                <span className="text-2xl opacity-0 transition-opacity group-hover:opacity-100">
                  →
                </span>
              </div>
            </Card>
          </Link>
        </section>
      )}
    </article>
  )
}
