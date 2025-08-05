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

    // Send welcome notification for authenticated users
    try {
      console.log("Sending welcome notification for user:", data.user.email);
      const welcomeResponse = await fetch("/api/notifications/send-welcome", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (welcomeResponse.ok) {
        const welcomeData = await welcomeResponse.json();
        console.log("Welcome notification sent successfully:", welcomeData);
      } else {
        const errorData = await welcomeResponse.json();
        console.error("Welcome notification failed:", errorData);
      }
    } catch (error) {
      console.error("Error sending welcome notification:", error);
    }

    // Simple admin check for routing
    const adminEmails = ["admin@example.com", "nahednakibyos@gmail.com"];
    if (adminEmails.includes(data.user.email)) {
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
