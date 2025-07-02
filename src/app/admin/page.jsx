import DashboardSummary from "@/components/Admin/Dashboard/DashboardSummary";

export default function AdminHomePage() {
  // Authentication and role checking is now handled by middleware
  return <DashboardSummary />;
}
