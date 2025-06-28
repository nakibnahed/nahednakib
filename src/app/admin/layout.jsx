import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminLayout from "@/components/Admin/Layout/AdminLayout";

export default async function Layout({ children }) {
  const cookieStore = await cookies();
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

  // Debug log session before any redirect
  console.log("session", session);

  if (!session?.user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  // Debug logs after profile is defined
  console.log("profile", profile);
  console.log("error", error);

  if (error || !profile || profile.role !== "admin") {
    redirect("/users/profile");
  }

  return <AdminLayout>{children}</AdminLayout>;
}
