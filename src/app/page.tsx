import { redirect } from "next/navigation";

/**
 * Root page - redirects to the main dashboard
 *
 * This ensures that visiting http://localhost:3000/ shows the Infomedia funnel dashboard.
 * The actual dashboard UI is rendered at /dashboard which has its own layout with sidebar.
 */
export default function HomePage() {
  redirect("/dashboard");
}
