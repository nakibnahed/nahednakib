"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Finishing sign-in...");

  useEffect(() => {
    let mounted = true;

    const finishAuth = async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const next = searchParams.get("next") || "/users/profile";
        const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/users/profile";

        // PKCE flow: exchange the code from the URL for a session
        const code = searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          // Implicit flow fallback (hash-based tokens)
          await supabase.auth.getSession();
        }

        if (!mounted) return;
        router.replace(safeNext);
      } catch (error) {
        if (!mounted) return;
        setMessage("Could not complete authentication. Please try again.");
        setTimeout(() => {
          router.replace("/login");
        }, 1800);
      }
    };

    finishAuth();
    return () => {
      mounted = false;
    };
  }, [router, searchParams]);

  return (
    <div className="pageMainContainer" style={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
      <div style={{ opacity: 0.85 }}>{message}</div>
    </div>
  );
}
