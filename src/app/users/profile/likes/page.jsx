"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabaseClient";
import UserLayout from "@/components/User/Layout/UserLayout";
import styles from "../Profile.module.css";

export default function LikesPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [likes, setLikes] = useState([]);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function loadUserData() {
      try {
        setLoading(true);

        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        setUser(user);

        // Fetch profile data
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          setError("Could not load profile data");
        } else {
          setProfileData(profile);
        }

        // Fetch user's likes from the correct table
        const { data: userLikes, error: likesError } = await supabase
          .from("user_likes")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (likesError) {
          console.error("Error fetching likes:", likesError);
          setError("Could not load liked posts");
        } else {
          setLikes(userLikes || []);
        }
      } catch (err) {
        console.error("Error loading user data:", err);
        setError("An error occurred while loading your data");
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [router]);

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
    <UserLayout user={user} profileData={profileData}>
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
                    <h3>
                      Liked{" "}
                      {like.content_type === "blog"
                        ? "Blog Post"
                        : "Portfolio Item"}
                    </h3>
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
    </UserLayout>
  );
}
