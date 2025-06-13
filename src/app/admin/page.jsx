"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseClient";
import styles from "./AdminHome.module.css";

export default function AdminHome() {
  const [counts, setCounts] = useState({
    users: 0,
    messages: 0,
    portfolios: 0,
    blogs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCounts() {
      setLoading(true);
      setError(null);

      try {
        const { count: usersCount, error: usersError } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true });
        if (usersError) throw usersError;

        const { count: messagesCount, error: messagesError } = await supabase
          .from("contact_messages")
          .select("*", { count: "exact", head: true });
        if (messagesError) throw messagesError;

        const { count: portfoliosCount, error: portfoliosError } =
          await supabase
            .from("portfolios")
            .select("*", { count: "exact", head: true });
        if (portfoliosError) throw portfoliosError;

        const { count: blogsCount, error: blogsError } = await supabase
          .from("blogs")
          .select("*", { count: "exact", head: true });
        if (blogsError) throw blogsError;

        setCounts({
          users: usersCount || 0,
          messages: messagesCount || 0,
          portfolios: portfoliosCount || 0,
          blogs: blogsCount || 0,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCounts();
  }, []);

  if (loading) {
    return (
      <div className={styles.loading}>
        <h1>Loading dashboard...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.error} ${styles.loading}`}>
        <h1>Error loading dashboard</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>Welcome to Admin Dashboard</h1>
      <p className={styles.subtitle}>
        Manage your site content and review contact messages here.
      </p>
      <div className={styles.countsContainer}>
        <div className={styles.countBox}>
          <h2>Users</h2>
          <p>{counts.users}</p>
        </div>
        <div className={styles.countBox}>
          <h2>Messages</h2>
          <p>{counts.messages}</p>
        </div>
        <div className={styles.countBox}>
          <h2>Portfolios</h2>
          <p>{counts.portfolios}</p>
        </div>
        <div className={styles.countBox}>
          <h2>Blogs</h2>
          <p>{counts.blogs}</p>
        </div>
      </div>
    </div>
  );
}
