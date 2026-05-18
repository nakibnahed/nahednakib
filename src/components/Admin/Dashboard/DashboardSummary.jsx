"use client";

import { useEffect, useState, useMemo } from "react";
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
  MessageSquare,
  ChevronRight,
  ArrowUpRight,
  LayoutGrid,
  Tag,
  PenLine,
  Bell,
  Activity,
} from "lucide-react";

const statConfig = [
  {
    key: "users",
    label: "Users",
    description: "Registered accounts",
    path: "/admin/users",
    icon: Users,
    accent: "var(--admin-stat-1, #22c55e)",
  },
  {
    key: "portfolios",
    label: "Portfolios",
    description: "Projects published",
    path: "/admin/portfolio",
    icon: Briefcase,
    accent: "var(--admin-stat-2, #a855f7)",
  },
  {
    key: "blogs",
    label: "Blogs",
    description: "Articles live",
    path: "/admin/blogs",
    icon: BookOpen,
    accent: "var(--admin-stat-3, #f97316)",
  },
  {
    key: "categories",
    label: "Categories",
    description: "Blog taxonomy",
    path: "/admin/categories",
    icon: Tag,
    accent: "var(--admin-stat-4, #ec4899)",
  },
  {
    key: "authors",
    label: "Authors",
    description: "Byline profiles",
    path: "/admin/authors",
    icon: PenLine,
    accent: "var(--admin-stat-5, #8b5cf6)",
  },
  {
    key: "messages",
    label: "Forms",
    description: "Contact submissions",
    path: "/admin/contact",
    icon: Mail,
    accent: "var(--admin-stat-6, #3b82f6)",
  },
  {
    key: "feedback",
    label: "Feedback",
    description: "Product feedback",
    path: "/admin/feedback",
    icon: MessageSquare,
    accent: "var(--admin-stat-7, #06b6d4)",
  },
  {
    key: "newsletter",
    label: "Newsletter",
    description: "Subscribers",
    path: "/admin/newsletter",
    icon: Send,
    accent: "var(--admin-stat-8, #14b8a6)",
  },
  {
    key: "comments",
    label: "Comments",
    description: "Approved comments",
    path: "/admin/comments",
    icon: MessageCircle,
    accent: "var(--admin-stat-9, #eab308)",
  },
  {
    key: "notifications",
    label: "Notifications",
    description: "Sent to users",
    path: "/admin/notifications",
    icon: Bell,
    accent: "var(--admin-stat-10, #f43f5e)",
  },
];


export default function DashboardSummary() {
  const [counts, setCounts] = useState({
    users: 0,
    messages: 0,
    portfolios: 0,
    blogs: 0,
    newsletter: 0,
    comments: 0,
    categories: 0,
    authors: 0,
    feedback: 0,
    notifications: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const todayLabel = useMemo(() => {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date());
  }, []);

  useEffect(() => {
    async function fetchCounts() {
      const tables = [
        "profiles",
        "contact_messages",
        "portfolios",
        "blogs",
        "newsletter_subscribers",
        "categories",
        "authors",
        "feedback_messages",
        "notifications",
      ];

      const results = await Promise.all(
        tables.map((table) =>
          supabase.from(table).select("*", { count: "exact", head: true }),
        ),
      );

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
        console.log("user_comments table not available:", error.message);
        commentsCount = 0;
      }

      setCounts({
        users: results[0].count || 0,
        messages: results[1].count || 0,
        portfolios: results[2].count || 0,
        blogs: results[3].count || 0,
        newsletter: results[4].count || 0,
        categories: results[5].count || 0,
        authors: results[6].count || 0,
        feedback: results[7].count || 0,
        notifications: results[8].count || 0,
        comments: commentsCount,
      });
    }

    async function fetchRecentActivity() {
      try {
        const { data: recentMessages } = await supabase
          .from("contact_messages")
          .select("id, name, email, created_at")
          .order("created_at", { ascending: false })
          .limit(4);

        const { data: recentUsers } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, full_name, created_at")
          .order("created_at", { ascending: false })
          .limit(4);

        const { data: recentComments } = await supabase
          .from("user_comments")
          .select("id, content_type, content_id, created_at")
          .eq("is_approved", true)
          .order("created_at", { ascending: false })
          .limit(4);

        const commentActivities = await Promise.all(
          (recentComments || []).map(async (comment) => {
            let postTitle = null;
            try {
              if (comment.content_type === "blog") {
                const { data } = await supabase
                  .from("blogs")
                  .select("title")
                  .eq("id", comment.content_id)
                  .single();
                postTitle = data?.title;
              } else if (comment.content_type === "portfolio") {
                const { data } = await supabase
                  .from("portfolios")
                  .select("title")
                  .eq("id", comment.content_id)
                  .single();
                postTitle = data?.title;
              }
            } catch {}
            return {
              type: "comment",
              label: "Comment",
              icon: <MessageCircle size={15} strokeWidth={2} />,
              text: postTitle
                ? `New comment on "${postTitle}"`
                : `New comment on ${comment.content_type}`,
              date: comment.created_at,
              color: "#f59e0b",
              href: "/admin/comments",
            };
          })
        );

        const activities = [
          ...(recentMessages || []).map((msg) => ({
            type: "message",
            label: "Message",
            icon: <Mail size={15} strokeWidth={2} />,
            text: `New message from ${msg.name || msg.email || "Unknown"}`,
            date: msg.created_at,
            color: "#3b82f6",
            href: "/admin/contact",
          })),
          ...(recentUsers || []).map((user) => {
            const name =
              [user.first_name, user.last_name].filter(Boolean).join(" ") ||
              user.full_name ||
              "Unknown";
            return {
              type: "user",
              label: "Signup",
              icon: <Users size={15} strokeWidth={2} />,
              text: `${name} signed up`,
              date: user.created_at,
              color: "#22c55e",
              href: "/admin/users",
            };
          }),
          ...commentActivities,
        ];

        const sortedActivities = activities
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 10);

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
      <div className={styles.page}>
        <div className={styles.skeletonHero}>
          <div className={styles.skeletonLine} style={{ width: "40%" }} />
          <div className={styles.skeletonLine} style={{ width: "65%" }} />
          <div className={styles.skeletonLine} style={{ width: "50%" }} />
        </div>
        <div className={styles.skeletonGrid}>
          {Array.from({ length: statConfig.length }, (_, i) => (
            <div key={i} className={styles.skeletonCard} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>
            <LayoutGrid size={14} strokeWidth={2} aria-hidden />
            Overview
          </p>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.lead}></p>
        </div>
        <div className={styles.heroMeta}>
          <span className={styles.metaLabel}>Today</span>
          <time className={styles.metaDate} dateTime={new Date().toISOString()}>
            {todayLabel}
          </time>
        </div>
      </header>

      <section className={styles.kpiSection} aria-label="Key metrics">
        <div className={styles.kpiGrid}>
          {statConfig.map((item) => {
            const Icon = item.icon;
            const value = counts[item.key];
            return (
              <button
                key={item.key}
                type="button"
                className={styles.kpiCard}
                onClick={() => router.push(item.path)}
              >
                <span
                  className={styles.kpiIcon}
                  style={{
                    color: item.accent,
                    background: `color-mix(in srgb, ${item.accent} 18%, transparent)`,
                    borderColor: `color-mix(in srgb, ${item.accent} 45%, transparent)`,
                  }}
                >
                  <Icon size={20} strokeWidth={2} />
                </span>
                <span className={styles.kpiTop}>
                  <span className={styles.kpiLabel}>{item.label}</span>
                  <ChevronRight
                    className={styles.kpiChevron}
                    size={18}
                    strokeWidth={2}
                    aria-hidden
                  />
                </span>
                <span className={styles.kpiValue}>{value}</span>
                <span className={styles.kpiHint}>{item.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section
        className={styles.activitySection}
        aria-labelledby="activity-heading"
      >
        <div className={styles.sectionHead}>
          <div className={styles.sectionHeadInner}>
            <span className={styles.sectionIcon} aria-hidden>
              <Activity size={18} strokeWidth={1.75} />
            </span>
            <div>
              <p className={styles.sectionKicker}>Timeline</p>
              <h2 id="activity-heading" className={styles.sectionTitle}>
                Recent activity
              </h2>
            </div>
          </div>
          <button
            type="button"
            className={styles.viewAllBtn}
            onClick={() => router.push("/admin/contact")}
          >
            View all
            <ArrowUpRight size={14} strokeWidth={2} aria-hidden />
          </button>
        </div>
        <div className={styles.activityCard}>
          {recentActivity.length === 0 ? (
            <p className={styles.emptyState}>No recent activity yet.</p>
          ) : (
            <ul className={styles.activityList}>
              {recentActivity.map((activity, index) => (
                <li
                  key={`${activity.type}-${index}`}
                  className={styles.activityItem}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(activity.href)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(activity.href);
                    }
                  }}
                >
                  <div
                    className={styles.activityIcon}
                    style={{
                      backgroundColor: `color-mix(in srgb, ${activity.color} 18%, transparent)`,
                      borderColor: `color-mix(in srgb, ${activity.color} 40%, transparent)`,
                      color: activity.color,
                    }}
                  >
                    {activity.icon}
                  </div>
                  <div className={styles.activityContent}>
                    <div className={styles.activityRow}>
                      <p className={styles.activityText}>{activity.text}</p>
                      <span
                        className={styles.activityBadge}
                        style={{
                          color: activity.color,
                          background: `color-mix(in srgb, ${activity.color} 14%, transparent)`,
                          borderColor: `color-mix(in srgb, ${activity.color} 35%, transparent)`,
                        }}
                      >
                        {activity.label}
                      </span>
                    </div>
                    <span className={styles.activityDate}>
                      {formatDate(activity.date)}
                    </span>
                  </div>
                  <ChevronRight
                    className={styles.activityArrow}
                    size={16}
                    strokeWidth={2}
                    aria-hidden
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
