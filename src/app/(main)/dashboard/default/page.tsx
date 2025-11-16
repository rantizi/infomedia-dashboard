import { OverviewDashboard } from "@/app/_components/overview-dashboard";

/**
 * Dashboard Default Page
 *
 * Legacy `/dashboard/default` route now renders the same dashboard UI directly
 * to avoid redirect loops while keeping existing bookmarks functional.
 */
export default function DashboardDefaultPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <OverviewDashboard />
    </div>
  );
}
