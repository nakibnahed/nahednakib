import DashboardSummary from "@/components/Admin/Dashboard/DashboardSummary";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminHomePage() {
  const cookieStore = await cookies(); // <-- await here!
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (key) => cookieStore.get(key)?.value,
        set: (key, value, options) => cookieStore.set(key, value, options),
        remove: (key, options) =>
          cookieStore.set(key, "", { ...options, maxAge: -1 }),
      },
    }
  );

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
