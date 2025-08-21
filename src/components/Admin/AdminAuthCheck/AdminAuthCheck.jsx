"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabaseClient";

export default function AdminAuthCheck({ children }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    let timeoutId;

    const checkAuth = async () => {
      try {
        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn("Admin auth check timeout, redirecting to login");
            setLoading(false);
            router.push("/login");
          }
        }, 5000); // 5 second timeout

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error || !session?.user) {
          clearTimeout(timeoutId);
          router.push("/login");
          return;
        }

        // Check if user has admin role
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (!mounted) return;

        if (profileError || profile?.role !== "admin") {
          clearTimeout(timeoutId);
          router.push("/login");
          return;
        }

        clearTimeout(timeoutId);
        setLoading(false);
      } catch (error) {
        if (!mounted) return;
        console.error("Admin auth check error:", error);
        clearTimeout(timeoutId);
        router.push("/login");
      }
    };

    checkAuth();

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [router]);

  if (loading) return <div>Loading...</div>;
  return children;
}
