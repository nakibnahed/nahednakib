"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminAuthCheck({ children }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setLoading(false);
        } else {
          router.push("/login");
        }
      });
    };

    checkAuth();
  }, [router]);

  if (loading) return <div>Loading...</div>;
  return children;
}
