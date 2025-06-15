"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseClient";
import styles from "./DashboardSummary.module.css";
import { Users, Mail, Briefcase, BookOpen } from "lucide-react"; // Import icons

export default function DashboardSummary() {
  const [counts, setCounts] = useState({
    users: 0,
    messages: 0,
    portfolios: 0,
    blogs: 0,
  });

  useEffect(() => {
    async function fetchCounts() {
      const tables = ["users", "contact_messages", "portfolios", "blogs"];
      const results = await Promise.all(
        tables.map((table) =>
          supabase.from(table).select("*", { count: "exact", head: true })
        )
      );
      setCounts({
        users: results[0].count || 0,
        messages: results[1].count || 0,
        portfolios: results[2].count || 0,
        blogs: results[3].count || 0,
      });
    }
    fetchCounts();
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.containerTitle}>Admin Dashboard</h1>
      <div className={styles.grid}>
        <div className={styles.card}>
          <h3 className={styles.title}>
            <Users size={20} className={styles.icon} /> Users
          </h3>
          <p className={styles.counts}>{counts.users}</p>
        </div>
        <div className={styles.card}>
          <h3 className={styles.title}>
            <Mail size={20} className={styles.icon} /> Messages
          </h3>
          <p className={styles.counts}>{counts.messages}</p>
        </div>
        <div className={styles.card}>
          <h3 className={styles.title}>
            <Briefcase size={20} className={styles.icon} /> Portfolios
          </h3>
          <p className={styles.counts}>{counts.portfolios}</p>
        </div>
        <div className={styles.card}>
          <h3 className={styles.title}>
            <BookOpen size={20} className={styles.icon} /> Blogs
          </h3>
          <p className={styles.counts}>{counts.blogs}</p>
        </div>
      </div>
    </div>
  );
}
