"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./Login.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const confirmed = searchParams.get("confirmed");

  function setCookie(name, value, days) {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const { supabase } = await import("@/services/supabaseClient");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      setCookie("sb-access-token", data.session.access_token, 1);
      setCookie("sb-refresh-token", data.session.refresh_token, 7);

      // Redirect to user profile page after login
      window.location.href = "/users/profile";
    }
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
