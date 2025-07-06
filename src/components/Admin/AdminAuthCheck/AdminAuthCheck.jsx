"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabaseClient";

export default function AdminAuthCheck({ children }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error || !session?.user) {
          router.push("/login");
          return;
        }

        // Check if user has admin role
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (profileError || profile?.role !== "admin") {
          router.push("/login");
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error("Admin auth check error:", error);
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  if (loading) return <div>Loading...</div>;
  return children;
}
