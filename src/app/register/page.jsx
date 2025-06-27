"use client";
import { useState } from "react";
import styles from "../login/Login.module.css";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const { supabase } = await import("@/services/supabaseClient");

    // Check if username is unique
    let { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single();

    if (existingUser) {
      setErrorMsg("Username is already taken.");
      setLoading(false);
      return;
    }

    // Register user
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    // Insert profile row
    if (data.user) {
      await supabase.from("profiles").insert([
        {
          id: data.user.id,
          email,
          username,
        },
      ]);
    }

    window.location.href = "/login";
    setLoading(false);
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Register</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className={styles.input}
          disabled={loading}
        />
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
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}
