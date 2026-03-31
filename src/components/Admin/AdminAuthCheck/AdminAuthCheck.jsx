"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuthSession } from "@/context/AuthSessionContext";

export default function AdminAuthCheck({ children }) {
  const { user, loading: authLoading } = useAuthSession();
  const [checkingRole, setCheckingRole] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    let timeoutId = null;

    const checkAuth = async () => {
      try {
        timeoutId = setTimeout(() => {
          if (!active) return;
          setCheckingRole(false);
          router.push("/login");
        }, 5000);

        if (authLoading) return;
        if (!user) {
          clearTimeout(timeoutId);
          setCheckingRole(false);
          router.push("/login");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (!active) return;

        if (profileError || profile?.role !== "admin") {
          clearTimeout(timeoutId);
          setCheckingRole(false);
          router.push("/login");
          return;
        }

        clearTimeout(timeoutId);
        setCheckingRole(false);
      } catch {
        if (!active) return;
        clearTimeout(timeoutId);
        setCheckingRole(false);
        router.push("/login");
      }
    };

    checkAuth();

    return () => {
      active = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [authLoading, router, user]);

  if (authLoading || checkingRole) return <div>Loading...</div>;
  return children;
}
