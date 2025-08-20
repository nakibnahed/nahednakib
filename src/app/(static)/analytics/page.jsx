import PublicAnalytics from "@/components/PublicAnalytics/PublicAnalytics";
import styles from "./analytics.module.css";

export const metadata = {
  title: "Site Analytics - Nahed",
  description: "Real-time site statistics and community engagement metrics",
};

export default function AnalyticsPage() {
  return (
    <div className={styles.container}>
      <PublicAnalytics />
    </div>
  );
}
