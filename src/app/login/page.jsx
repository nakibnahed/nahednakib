"use client";

import { useState } from "react";
import styles from "./Login.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

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

    // Import supabase client inside or at top of file
    const { supabase } = await import("@/services/supabaseClient");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      // Set the access and refresh tokens as cookies so server middleware/layout can read them
      setCookie("sb-access-token", data.session.access_token, 1); // 1 day expiry
      setCookie("sb-refresh-token", data.session.refresh_token, 7); // 7 day expiry

      // Redirect to admin page after login
      window.location.href = "/admin";
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Admin Login</h1>
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
    </div>
  );
}
