import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardSummary from "@/components/Admin/Dashboard/DashboardSummary";

export default async function AdminHomePage() {
  const cookieStore = await cookies(); // استدعِ الدالة هنا
  const supabase = createServerComponentClient({ cookies: cookieStore });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (error || !profile || profile.role !== "admin") {
    redirect("/users/profile");
  }

  return <DashboardSummary />;
}
