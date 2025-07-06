"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseClient";
import styles from "./UserDashboard.module.css";
import { MessageCircle, Heart, Star, Activity } from "lucide-react";

export default function UserDashboard({ user, profileData, setActiveTab }) {
  const [stats, setStats] = useState({
    comments: 0,
    likes: 0,
    favorites: 0,
    activities: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
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

        // Fetch user favorites count
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

    async function fetchRecentActivities() {
      if (!user?.id) return;

      try {
        // Fetch recent comments
        const { data: recentComments } = await supabase
          .from("user_comments")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3);

        // Fetch recent likes
        const { data: recentLikes } = await supabase
          .from("user_likes")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3);

        // Fetch recent favorites
        const { data: recentFavorites } = await supabase
          .from("user_favorites")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3);

        // Fetch post details for activities
        const activitiesWithPostDetails = await Promise.all([
          ...(recentComments || []).map(async (comment) => {
            try {
              if (comment.content_type === "blog") {
                const { data: blogPost } = await supabase
                  .from("blogs")
                  .select("title")
                  .eq("id", comment.content_id)
                  .single();
                return {
                  ...comment,
                  type: "comment",
                  icon: <MessageCircle size={16} />,
                  text: `Commented on "${
                    blogPost?.title || "Unknown Blog Post"
                  }"`,
                  date: comment.created_at,
                };
              } else if (comment.content_type === "portfolio") {
                const { data: portfolioItem } = await supabase
                  .from("portfolios")
                  .select("title")
                  .eq("id", comment.content_id)
                  .single();
                return {
                  ...comment,
                  type: "comment",
                  icon: <MessageCircle size={16} />,
                  text: `Commented on "${
                    portfolioItem?.title || "Unknown Portfolio Item"
                  }"`,
                  date: comment.created_at,
                };
              }
              return {
                ...comment,
                type: "comment",
                icon: <MessageCircle size={16} />,
                text: `Commented on ${
                  comment.content_type === "blog"
                    ? "blog post"
                    : "portfolio item"
                }`,
                date: comment.created_at,
              };
            } catch (err) {
              return {
                ...comment,
                type: "comment",
                icon: <MessageCircle size={16} />,
                text: `Commented on ${
                  comment.content_type === "blog"
                    ? "blog post"
                    : "portfolio item"
                }`,
                date: comment.created_at,
              };
            }
          }),
          ...(recentLikes || []).map(async (like) => {
            try {
              if (like.content_type === "blog") {
                const { data: blogPost } = await supabase
                  .from("blogs")
                  .select("title")
                  .eq("id", like.content_id)
                  .single();
                return {
                  ...like,
                  type: "like",
                  icon: <Heart size={16} />,
                  text: `Liked "${blogPost?.title || "Unknown Blog Post"}"`,
                  date: like.created_at,
                };
              } else if (like.content_type === "portfolio") {
                const { data: portfolioItem } = await supabase
                  .from("portfolios")
                  .select("title")
                  .eq("id", like.content_id)
                  .single();
                return {
                  ...like,
                  type: "like",
                  icon: <Heart size={16} />,
                  text: `Liked "${
                    portfolioItem?.title || "Unknown Portfolio Item"
                  }"`,
                  date: like.created_at,
                };
              }
              return {
                ...like,
                type: "like",
                icon: <Heart size={16} />,
                text: `Liked ${
                  like.content_type === "blog" ? "blog post" : "portfolio item"
                }`,
                date: like.created_at,
              };
            } catch (err) {
              return {
                ...like,
                type: "like",
                icon: <Heart size={16} />,
                text: `Liked ${
                  like.content_type === "blog" ? "blog post" : "portfolio item"
                }`,
                date: like.created_at,
              };
            }
          }),
          ...(recentFavorites || []).map(async (favorite) => {
            try {
              if (favorite.content_type === "blog") {
                const { data: blogPost } = await supabase
                  .from("blogs")
                  .select("title")
                  .eq("id", favorite.content_id)
                  .single();
                return {
                  ...favorite,
                  type: "favorite",
                  icon: <Star size={16} />,
                  text: `Favorited "${blogPost?.title || "Unknown Blog Post"}"`,
                  date: favorite.created_at,
                };
              } else if (favorite.content_type === "portfolio") {
                const { data: portfolioItem } = await supabase
                  .from("portfolios")
                  .select("title")
                  .eq("id", favorite.content_id)
                  .single();
                return {
                  ...favorite,
                  type: "favorite",
                  icon: <Star size={16} />,
                  text: `Favorited "${
                    portfolioItem?.title || "Unknown Portfolio Item"
                  }"`,
                  date: favorite.created_at,
                };
              }
              return {
                ...favorite,
                type: "favorite",
                icon: <Star size={16} />,
                text: `Favorited ${
                  favorite.content_type === "blog"
                    ? "blog post"
                    : "portfolio item"
                }`,
                date: favorite.created_at,
              };
            } catch (err) {
              return {
                ...favorite,
                type: "favorite",
                icon: <Star size={16} />,
                text: `Favorited ${
                  favorite.content_type === "blog"
                    ? "blog post"
                    : "portfolio item"
                }`,
                date: favorite.created_at,
              };
            }
          }),
        ]);

        // Flatten and sort all activities
        const allActivities = activitiesWithPostDetails
          .flat()
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5); // Show only the 5 most recent activities

        setRecentActivities(allActivities);
      } catch (error) {
        console.error("Error fetching recent activities:", error);
      }
    }

    fetchUserStats();
    fetchRecentActivities();
  }, [user]);

  // Get user's display name
  const getUserDisplayName = () => {
    if (profileData?.first_name || profileData?.last_name) {
      const firstName = profileData?.first_name || "";
      const lastName = profileData?.last_name || "";
      return `${firstName} ${lastName}`.trim();
    }
    return profileData?.full_name || "User";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString();
  };

  const handleCardClick = (tabName) => {
    if (setActiveTab) {
      setActiveTab(tabName);
    }
  };

  const dashboardCards = [
    {
      title: "My Comments",
      icon: <MessageCircle size={24} />,
      count: stats.comments,
      description: "View all your comments on posts",
      tab: "comments",
    },
    {
      title: "Liked Posts",
      icon: <Heart size={24} />,
      count: stats.likes,
      description: "Posts you've liked",
      tab: "likes",
    },
    {
      title: "Favorites",
      icon: <Star size={24} />,
      count: stats.favorites,
      description: "Your favorite posts and content",
      tab: "favorites",
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
        <h1 className={styles.title}>Welcome back, {getUserDisplayName()}!</h1>
        <p className={styles.subtitle}>
          Here's an overview of your account activity
        </p>
      </div>

      <div className={styles.grid}>
        {dashboardCards.map((card) => (
          <div
            key={card.title}
            className={styles.card}
            onClick={() => handleCardClick(card.tab)}
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
          {recentActivities.length === 0 ? (
            <p>
              No recent activity. Start engaging with posts to see your activity
              here!
            </p>
          ) : (
            <div className={styles.activityList}>
              {recentActivities.map((activity, index) => (
                <div
                  key={`${activity.type}-${activity.id}-${index}`}
                  className={styles.activityItem}
                >
                  <div className={styles.activityIcon}>{activity.icon}</div>
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
