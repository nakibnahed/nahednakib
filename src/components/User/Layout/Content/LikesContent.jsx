"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseClient";
import styles from "../../../../app/users/profile/Profile.module.css";

export default function LikesContent({ user }) {
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadLikes() {
      try {
        setLoading(true);

        // Fetch user's likes
        const { data: userLikes, error: likesError } = await supabase
          .from("user_likes")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (likesError) {
          console.error("Error fetching likes:", likesError);
          setError("Could not load liked posts");
        } else {
          // Fetch post details for each like
          const likesWithPostDetails = await Promise.all(
            (userLikes || []).map(async (like) => {
              try {
                if (like.content_type === "blog") {
                  const { data: blogPost, error: blogError } = await supabase
                    .from("blogs")
                    .select("title")
                    .eq("id", like.content_id)
                    .single();

                  if (blogError) {
                    console.error("Error fetching blog:", blogError);
                    return {
                      ...like,
                      postTitle: "Unknown Blog Post",
                    };
                  }

                  return {
                    ...like,
                    postTitle: blogPost?.title || "Unknown Blog Post",
                  };
                } else if (like.content_type === "portfolio") {
                  const { data: portfolioItem, error: portfolioError } =
                    await supabase
                      .from("portfolios")
                      .select("title")
                      .eq("id", like.content_id)
                      .single();

                  if (portfolioError) {
                    console.error(
                      "Error fetching portfolio:",
                      portfolioError,
                      "for content_id:",
                      like.content_id
                    );
                    return {
                      ...like,
                      postTitle: "Unknown Portfolio Item",
                    };
                  }

                  return {
                    ...like,
                    postTitle: portfolioItem?.title || "Unknown Portfolio Item",
                  };
                }
                return like;
              } catch (err) {
                console.error("Error fetching post details:", err);
                return {
                  ...like,
                  postTitle:
                    like.content_type === "blog"
                      ? "Unknown Blog Post"
                      : "Unknown Portfolio Item",
                };
              }
            })
          );

          setLikes(likesWithPostDetails);
        }
      } catch (err) {
        console.error("Error loading likes:", err);
        setError("An error occurred while loading your liked posts");
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadLikes();
    }
  }, [user]);

  const handleUnlike = async (likeId) => {
    try {
      const { error } = await supabase
        .from("user_likes")
        .delete()
        .eq("id", likeId);

      if (error) {
        console.error("Error removing like:", error);
        alert("Failed to remove like");
      } else {
        setLikes(likes.filter((like) => like.id !== likeId));
      }
    } catch (err) {
      console.error("Error removing like:", err);
      alert("An error occurred while removing the like");
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          color: "#fff",
        }}
      >
        <p>Loading your liked posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          color: "#ff6b6b",
        }}
      >
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.profileContent}>
      <div className={styles.contentHeader}>
        <h1>Liked Posts</h1>
        <p>Posts you've liked</p>
      </div>

      {likes.length === 0 ? (
        <div className={styles.emptyState}>
          <p>You haven't liked any posts yet.</p>
        </div>
      ) : (
        <div className={styles.contentList}>
          {likes.map((like) => (
            <div key={like.id} className={styles.likeItem}>
              <div className={styles.likeHeader}>
                <div className={styles.postInfo}>
                  <h3>Liked "{like.postTitle}"</h3>
                  <span className={styles.likeDate}>
                    Liked on {new Date(like.created_at).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={() => handleUnlike(like.id)}
                  className={styles.unlikeButton}
                >
                  Unlike
                </button>
              </div>
              <div className={styles.likeContent}>
                <p>
                  You liked this{" "}
                  {like.content_type === "blog"
                    ? "blog post"
                    : "portfolio item"}
                  .
                </p>
              </div>
              <div className={styles.likeFooter}>
                <span className={styles.postType}>
                  {like.content_type === "blog"
                    ? "Blog Post"
                    : "Portfolio Item"}
                </span>
                <a
                  href={
                    like.content_type === "blog"
                      ? `/blog/${like.content_id}`
                      : `/portfolio/${like.content_id}`
                  }
                  className={styles.viewPostLink}
                >
                  View Post
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
