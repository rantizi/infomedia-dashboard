import { OverviewDashboard } from "@/app/_components/overview-dashboard";

/**
 * Overview Dashboard Page
 *
 * Main dashboard page that displays the Infomedia sales funnel overview:
 * - Funnel stages (Leads → Prospects → Qualified → Submissions → Win)
 * - 6 customer segments (Telkom Group, SOE, Private, Gov, SME & Reg, Total)
 * - Target RKAP and STG
 * - Kecukupan LOP and Qualified LOP metrics
 */
export default function Page() {
  return (
    <div className="container mx-auto px-4 py-8">
      <OverviewDashboard />
    </div>
  );
}
