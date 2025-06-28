import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminLayout from "@/components/Admin/Layout/AdminLayout";

export default async function Layout({ children }) {
  const cookieStore = await cookies(); // <-- Await here!

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () =>
          cookieStore.getAll().map((c) => ({
            name: c.name,
            value: c.value,
          })),
        setAll: () => {
          // No-op: can't set cookies in a server component
        },
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

  return <AdminLayout>{children}</AdminLayout>;
}
