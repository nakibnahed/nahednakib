import AdminLayout from "@/components/Admin/Layout/AdminLayout";
import AdminAuthCheck from "@/components/Admin/AdminAuthCheck/AdminAuthCheck";

export default function Layout({ children }) {
  return (
    <AdminAuthCheck>
      <AdminLayout>{children}</AdminLayout>
    </AdminAuthCheck>
  );
}
