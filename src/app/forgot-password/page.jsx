"use client";
import { useState } from "react";
import styles from "../login/Login.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    const { supabase } = await import("@/services/supabaseClient");
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) setError(error.message);
    else setMessage("Password reset email sent!");

    setLoading(false);
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Forgot Password</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={styles.input}
          disabled={loading}
        />
        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? "Sending..." : "Send Reset Email"}
        </button>
      </form>
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
