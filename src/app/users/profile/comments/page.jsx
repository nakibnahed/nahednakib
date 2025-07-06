"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabaseClient";
import UserLayout from "@/components/User/Layout/UserLayout";
import ConfirmationModal from "@/components/ConfirmationModal/ConfirmationModal";
import styles from "../Profile.module.css";

export default function CommentsPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [comments, setComments] = useState([]);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
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

        // Fetch user's comments from the correct table
        const { data: userComments, error: commentsError } = await supabase
          .from("user_comments")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (commentsError) {
          console.error("Error fetching comments:", commentsError);
          setError("Could not load comments");
        } else {
          setComments(userComments || []);
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

  const confirmDelete = (commentId) => {
    setCommentToDelete(commentId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;

    try {
      const { error } = await supabase
        .from("user_comments")
        .delete()
        .eq("id", commentToDelete);

      if (error) {
        console.error("Error deleting comment:", error);
        alert("Failed to delete comment");
      } else {
        setComments(
          comments.filter((comment) => comment.id !== commentToDelete)
        );
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
      alert("An error occurred while deleting the comment");
    } finally {
      setShowDeleteConfirm(false);
      setCommentToDelete(null);
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
        <p>Loading your comments...</p>
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
          <h1>My Comments</h1>
          <p>View and manage all your comments</p>
        </div>

        {comments.length === 0 ? (
          <div className={styles.emptyState}>
            <p>You haven't made any comments yet.</p>
          </div>
        ) : (
          <div className={styles.contentList}>
            {comments.map((comment) => (
              <div key={comment.id} className={styles.commentItem}>
                <div className={styles.commentHeader}>
                  <div className={styles.postInfo}>
                    <h3>
                      Comment on{" "}
                      {comment.content_type === "blog"
                        ? "Blog Post"
                        : "Portfolio Item"}
                    </h3>
                    <span className={styles.commentDate}>
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => confirmDelete(comment.id)}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                </div>
                <div className={styles.commentContent}>
                  <p>{comment.comment || "No content"}</p>
                </div>
                <div className={styles.commentFooter}>
                  <span className={styles.postType}>
                    {comment.content_type === "blog"
                      ? "Blog Post"
                      : "Portfolio Item"}
                  </span>
                  <a
                    href={
                      comment.content_type === "blog"
                        ? `/blog/${comment.content_id}`
                        : `/portfolio/${comment.content_id}`
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

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteComment}
          title="Delete Comment"
          message="Are you sure you want to delete this comment? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      </div>
    </UserLayout>
  );
}
