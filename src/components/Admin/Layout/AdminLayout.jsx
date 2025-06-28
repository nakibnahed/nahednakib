import Sidebar from "@/components/Admin/Sidebar/Sidebar";
import styles from "./AdminLayout.module.css";

export default function AdminLayout({ children }) {
  return (
    <div className={styles.container}>
      <Sidebar />
      <main className={styles.content}>{children}</main>
    </div>
  );
}
