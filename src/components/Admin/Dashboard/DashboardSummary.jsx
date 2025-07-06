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
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

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
        const { count, error } = await supabase
          .from("user_comments")
          .select("*", { count: "exact", head: true })
          .eq("is_approved", true);

        if (error) {
          console.log("user_comments table not found, using default count");
          commentsCount = 0;
        } else {
          commentsCount = count || 0;
        }
      } catch (error) {
        // If table doesn't exist yet, keep it at 0
        console.log("user_comments table not available:", error.message);
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

    async function fetchRecentActivity() {
      try {
        // Fetch recent messages
        const { data: recentMessages } = await supabase
          .from("contact_messages")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(3);

        // Fetch recent users
        const { data: recentUsers } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(3);

        // Fetch recent comments
        const { data: recentComments } = await supabase
          .from("user_comments")
          .select("*")
          .eq("is_approved", true)
          .order("created_at", { ascending: false })
          .limit(3);

        const activities = [
          ...(recentMessages || []).map((msg) => ({
            type: "message",
            icon: <Mail size={16} />,
            text: `New message from ${msg.name || msg.email}`,
            date: msg.created_at,
            color: "#3b82f6",
          })),
          ...(recentUsers || []).map((user) => ({
            type: "user",
            icon: <Users size={16} />,
            text: `New user registered: ${
              user.first_name || user.full_name || "User"
            }`,
            date: user.created_at,
            color: "#10b981",
          })),
          ...(recentComments || []).map((comment) => ({
            type: "comment",
            icon: <MessageCircle size={16} />,
            text: `New comment on ${comment.content_type}`,
            date: comment.created_at,
            color: "#f59e0b",
          })),
        ];

        // Sort by date and take the 5 most recent
        const sortedActivities = activities
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5);

        setRecentActivity(sortedActivities);
      } catch (error) {
        console.error("Error fetching recent activity:", error);
      }
    }

    async function loadData() {
      setLoading(true);
      await Promise.all([fetchCounts(), fetchRecentActivity()]);
      setLoading(false);
    }

    loadData();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Admin Dashboard</h1>
        <p className={styles.subtitle}>
          Welcome back! Here's an overview of your system
        </p>
      </div>

      <div className={styles.grid}>
        <div
          className={styles.card}
          onClick={() => router.push("/admin/users")}
        >
          <h3 className={styles.cardTitle}>
            <Users size={20} className={styles.cardIcon} /> Users
          </h3>
          <p className={styles.cardCount}>{counts.users}</p>
          <p className={styles.cardDescription}>
            Registered users in the system
          </p>
        </div>
        <div
          className={styles.card}
          onClick={() => router.push("/admin/contact")}
        >
          <h3 className={styles.cardTitle}>
            <Mail size={20} className={styles.cardIcon} /> Messages
          </h3>
          <p className={styles.cardCount}>{counts.messages}</p>
          <p className={styles.cardDescription}>Messages from contact forms</p>
        </div>
        <div
          className={styles.card}
          onClick={() => router.push("/admin/portfolio")}
        >
          <h3 className={styles.cardTitle}>
            <Briefcase size={20} className={styles.cardIcon} /> Portfolios
          </h3>
          <p className={styles.cardCount}>{counts.portfolios}</p>
          <p className={styles.cardDescription}>Portfolio projects created</p>
        </div>
        <div
          className={styles.card}
          onClick={() => router.push("/admin/blogs")}
        >
          <h3 className={styles.cardTitle}>
            <BookOpen size={20} className={styles.cardIcon} /> Blogs
          </h3>
          <p className={styles.cardCount}>{counts.blogs}</p>
          <p className={styles.cardDescription}>Published blog articles</p>
        </div>
        <div
          className={styles.card}
          onClick={() => router.push("/admin/newsletter")}
        >
          <h3 className={styles.cardTitle}>
            <Send size={20} className={styles.cardIcon} /> Newsletter
          </h3>
          <p className={styles.cardCount}>{counts.newsletter}</p>
          <p className={styles.cardDescription}>
            Active newsletter subscribers
          </p>
        </div>
        <div
          className={styles.card}
          onClick={() => router.push("/admin/comments")}
        >
          <h3 className={styles.cardTitle}>
            <MessageCircle size={20} className={styles.cardIcon} /> Comments
          </h3>
          <p className={styles.cardCount}>{counts.comments}</p>
          <p className={styles.cardDescription}>User comments on content</p>
        </div>
      </div>

      <div className={styles.recentActivity}>
        <h2>Recent Activity</h2>
        <div className={styles.activityCard}>
          {recentActivity.length === 0 ? (
            <p>No recent activity to display.</p>
          ) : (
            <div className={styles.activityList}>
              {recentActivity.map((activity, index) => (
                <div
                  key={`${activity.type}-${index}`}
                  className={styles.activityItem}
                >
                  <div
                    className={styles.activityIcon}
                    style={{ backgroundColor: activity.color }}
                  >
                    {activity.icon}
                  </div>
                  <div className={styles.activityContent}>
                    <p className={styles.activityText}>{activity.text}</p>
                    <span className={styles.activityDate}>
                      {formatDate(activity.date)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
