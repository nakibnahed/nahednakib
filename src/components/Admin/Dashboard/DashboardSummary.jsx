"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabaseClient";
import styles from "./DashboardSummary.module.css";
import {
  Users,
  Mail,
  Briefcase,
  BookOpen,
  Send,
  MessageCircle,
} from "lucide-react";

export default function DashboardSummary() {
  const [counts, setCounts] = useState({
    users: 0,
    messages: 0,
    portfolios: 0,
    blogs: 0,
    newsletter: 0,
    comments: 0,
  });

  const router = useRouter();

  useEffect(() => {
    async function fetchCounts() {
      const tables = [
        "profiles",
        "contact_messages",
        "portfolios",
        "blogs",
        "newsletter_subscribers",
      ];

      const results = await Promise.all(
        tables.map((table) =>
          supabase.from(table).select("*", { count: "exact", head: true })
        )
      );

      // For comments, we'll get the actual count from the user_comments table
      let commentsCount = 0;
      try {
        const { count } = await supabase
          .from("user_comments")
          .select("*", { count: "exact", head: true })
          .eq("is_approved", true);
        commentsCount = count || 0;
      } catch (error) {
        // If table doesn't exist yet, keep it at 0
        commentsCount = 0;
      }

      setCounts({
        users: results[0].count || 0,
        messages: results[1].count || 0,
        portfolios: results[2].count || 0,
        blogs: results[3].count || 0,
        newsletter: results[4].count || 0,
        comments: commentsCount,
      });
    }
    fetchCounts();
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.containerTitle}>Admin Dashboard</h1>
      <div className={styles.grid}>
        <div
          className={styles.card}
          onClick={() => router.push("/admin/users")}
        >
          <h3 className={styles.title}>
            <Users size={20} className={styles.icon} /> Users
          </h3>
          <p className={styles.counts}>{counts.users}</p>
        </div>
        <div
          className={styles.card}
          onClick={() => router.push("/admin/contact")}
        >
          <h3 className={styles.title}>
            <Mail size={20} className={styles.icon} /> Messages
          </h3>
          <p className={styles.counts}>{counts.messages}</p>
        </div>
        <div
          className={styles.card}
          onClick={() => router.push("/admin/portfolio")}
        >
          <h3 className={styles.title}>
            <Briefcase size={20} className={styles.icon} /> Portfolios
          </h3>
          <p className={styles.counts}>{counts.portfolios}</p>
        </div>
        <div
          className={styles.card}
          onClick={() => router.push("/admin/blogs")}
        >
          <h3 className={styles.title}>
            <BookOpen size={20} className={styles.icon} /> Blogs
          </h3>
          <p className={styles.counts}>{counts.blogs}</p>
        </div>
        <div
          className={styles.card}
          onClick={() => router.push("/admin/newsletter")}
        >
          <h3 className={styles.title}>
            <Send size={20} className={styles.icon} /> Newsletter
          </h3>
          <p className={styles.counts}>{counts.newsletter}</p>
        </div>
        <div
          className={styles.card}
          onClick={() => router.push("/admin/comments")}
        >
          <h3 className={styles.title}>
            <MessageCircle size={20} className={styles.icon} /> Comments
          </h3>
          <p className={styles.counts}>{counts.comments}</p>
        </div>
      </div>
    </div>
  );
}
