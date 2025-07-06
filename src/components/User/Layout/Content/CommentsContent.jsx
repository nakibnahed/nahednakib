"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseClient";
import ConfirmationModal from "@/components/ConfirmationModal/ConfirmationModal";
import styles from "../../../../app/users/profile/Profile.module.css";

export default function CommentsContent({ user }) {
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  useEffect(() => {
    async function loadComments() {
      try {
        setLoading(true);

        // Fetch user's comments
        const { data: userComments, error: commentsError } = await supabase
          .from("user_comments")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (commentsError) {
          console.error("Error fetching comments:", commentsError);
          setError("Could not load comments");
        } else {
          // Fetch post details for each comment
          const commentsWithPostDetails = await Promise.all(
            (userComments || []).map(async (comment) => {
              try {
                if (comment.content_type === "blog") {
                  const { data: blogPost } = await supabase
                    .from("blogs")
                    .select("title")
                    .eq("id", comment.content_id)
                    .single();
                  return {
                    ...comment,
                    postTitle: blogPost?.title || "Unknown Blog Post",
                  };
                } else if (comment.content_type === "portfolio") {
                  const { data: portfolioItem } = await supabase
                    .from("portfolios")
                    .select("title")
                    .eq("id", comment.content_id)
                    .single();
                  return {
                    ...comment,
                    postTitle: portfolioItem?.title || "Unknown Portfolio Item",
                  };
                }
                return comment;
              } catch (err) {
                console.error("Error fetching post details:", err);
                return {
                  ...comment,
                  postTitle:
                    comment.content_type === "blog"
                      ? "Unknown Blog Post"
                      : "Unknown Portfolio Item",
                };
              }
            })
          );

          setComments(commentsWithPostDetails);
        }
      } catch (err) {
        console.error("Error loading comments:", err);
        setError("An error occurred while loading your comments");
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadComments();
    }
  }, [user]);

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
                  <h3>Comment on "{comment.postTitle}"</h3>
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
      />
    </div>
  );
}
