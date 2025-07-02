"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./Login.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const confirmed = searchParams.get("confirmed");
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    // Fetch user role from profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profile?.role === "admin") {
      router.push("/admin/");
    } else {
      router.push("/users/profile");
    }
    setLoading(false);
  }

  return (
    <div className="pageMainContainer">
      <div className={styles.container}>
        <h1 className={styles.title}>Login</h1>
        {confirmed && (
          <p style={{ color: "green", marginBottom: 16 }}>
            Email confirmed successfully! You can login now.
          </p>
        )}
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.input}
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={styles.input}
            disabled={loading}
          />
          {errorMsg && <p className={styles.error}>{errorMsg}</p>}

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? (
              "Logging in..."
            ) : (
              <>
                <span>Login</span>
                <span className={styles.arrow}>→</span>
              </>
            )}
          </button>
        </form>
        <div className={styles.links}>
          <a href="/register" className={styles.link}>
            Register now
          </a>
          <a href="/forgot-password" className={styles.link}>
            Forgot password?
          </a>
        </div>
      </div>
    </div>
  );
}
