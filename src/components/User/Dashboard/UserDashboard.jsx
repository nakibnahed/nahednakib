"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseClient";
import styles from "./UserDashboard.module.css";
import {
  User,
  Heart,
  MessageCircle,
  Star,
  Activity,
  Edit,
  Settings,
} from "lucide-react";

export default function UserDashboard({ user, profileData }) {
  const [stats, setStats] = useState({
    comments: 0,
    likes: 0,
    favorites: 0,
    activities: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserStats() {
      if (!user?.id) return;

      try {
        // Fetch user comments count
        const { count: commentsCount } = await supabase
          .from("user_comments")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        // Fetch user likes count
        const { count: likesCount } = await supabase
          .from("user_likes")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        // Fetch user favorites count (assuming we have a favorites table)
        const { count: favoritesCount } = await supabase
          .from("user_favorites")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        // Calculate activities (comments + likes + favorites)
        const totalActivities =
          (commentsCount || 0) + (likesCount || 0) + (favoritesCount || 0);

        setStats({
          comments: commentsCount || 0,
          likes: likesCount || 0,
          favorites: favoritesCount || 0,
          activities: totalActivities,
        });
      } catch (error) {
        console.error("Error fetching user stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserStats();
  }, [user]);

  const dashboardCards = [
    {
      title: "Profile",
      icon: <User size={24} />,
      count: "Complete",
      description: "View and edit your profile information",
      path: "/users/profile/edit",
      color: "#4CAF50",
    },
    {
      title: "My Comments",
      icon: <MessageCircle size={24} />,
      count: stats.comments,
      description: "View all your comments on posts",
      path: "/users/profile/comments",
      color: "#2196F3",
    },
    {
      title: "Liked Posts",
      icon: <Heart size={24} />,
      count: stats.likes,
      description: "Posts you've liked",
      path: "/users/profile/likes",
      color: "#E91E63",
    },
    {
      title: "Favorites",
      icon: <Star size={24} />,
      count: stats.favorites,
      description: "Your favorite posts and content",
      path: "/users/profile/favorites",
      color: "#FF9800",
    },
    {
      title: "Activity",
      icon: <Activity size={24} />,
      count: stats.activities,
      description: "Your recent activity summary",
      path: "/users/profile/activity",
      color: "#9C27B0",
    },
    {
      title: "Settings",
      icon: <Settings size={24} />,
      count: "Manage",
      description: "Account settings and preferences",
      path: "/users/profile/settings",
      color: "#607D8B",
    },
  ];

  if (loading) {
    return (
      <div className={styles.loading}>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          Welcome back,{" "}
          {profileData?.first_name || profileData?.last_name
            ? profileData?.first_name || "User"
            : profileData?.full_name?.split(" ")[0] || "User"}
          !
        </h1>
        <p className={styles.subtitle}>
          Here's an overview of your account activity
        </p>
      </div>

      <div className={styles.grid}>
        {dashboardCards.map((card) => (
          <div
            key={card.title}
            className={styles.card}
            onClick={() => (window.location.href = card.path)}
            style={{ "--card-color": card.color }}
          >
            <div className={styles.cardIcon}>{card.icon}</div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>{card.title}</h3>
              <p className={styles.cardCount}>{card.count}</p>
              <p className={styles.cardDescription}>{card.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.recentActivity}>
        <h2>Recent Activity</h2>
        <div className={styles.activityCard}>
          <p>Your recent interactions and engagement will appear here.</p>
        </div>
      </div>
    </div>
  );
}
