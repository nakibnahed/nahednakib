"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabaseClient";
import ConfirmationModal from "@/components/ConfirmationModal/ConfirmationModal";
import styles from "./Comments.module.css";
import {
  MessageCircle,
  ArrowLeft,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function CommentsPage() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0 });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchComments();
    fetchStats();
  }, []);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("user_comments")
        .select(
          `
          id,
          comment,
          content_type,
          content_id,
          is_approved,
          created_at,
          profiles!inner(email)
        `
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { count: total } = await supabase
        .from("user_comments")
        .select("*", { count: "exact", head: true });

      const { count: approved } = await supabase
        .from("user_comments")
        .select("*", { count: "exact", head: true })
        .eq("is_approved", true);

      setStats({
        total: total || 0,
        approved: approved || 0,
        pending: (total || 0) - (approved || 0),
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleApprove = async (commentId) => {
    try {
      const response = await fetch(`/api/engagement/comments?id=${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_approved: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve comment");
      }

      await fetchComments();
      await fetchStats();
    } catch (error) {
      console.error("Error approving comment:", error);
      alert("Failed to approve comment. Please try again.");
    }
  };

  const handleReject = async (commentId) => {
    try {
      const response = await fetch(`/api/engagement/comments?id=${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_approved: false }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject comment");
      }

      await fetchComments();
      await fetchStats();
    } catch (error) {
      console.error("Error rejecting comment:", error);
      alert("Failed to reject comment. Please try again.");
    }
  };

  const confirmDelete = (commentId) => {
    setCommentToDelete(commentId);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!commentToDelete) return;

    try {
      console.log("Attempting to delete comment:", commentToDelete);

      const response = await fetch(
        `/api/engagement/comments?id=${commentToDelete}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();
      console.log("Delete response:", { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete comment");
      }

      console.log("Comment deleted successfully");
      await fetchComments();
      await fetchStats();
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert(`Failed to delete comment: ${error.message}`);
    } finally {
      setShowDeleteConfirm(false);
      setCommentToDelete(null);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading comments...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>
          <ArrowLeft size={20} />
          Back
        </button>
        <h1 className={styles.title}>
          <MessageCircle size={24} />
          Comments Management
        </h1>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <h3>Total Comments</h3>
          <p>{stats.total}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Approved</h3>
          <p>{stats.approved}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Pending</h3>
          <p>{stats.pending}</p>
        </div>
      </div>

      {/* Comments List */}
      <div className={styles.commentsContainer}>
        {comments.length === 0 ? (
          <div className={styles.noComments}>
            <MessageCircle size={64} className={styles.icon} />
            <h2>No Comments Yet</h2>
            <p>
              Comments will appear here once users start engaging with your
              content.
            </p>
          </div>
        ) : (
          <div className={styles.commentsList}>
            {comments.map((comment) => (
              <div
                key={comment.id}
                className={`${styles.commentCard} ${
                  !comment.is_approved ? styles.pending : ""
                }`}
              >
                <div className={styles.commentHeader}>
                  <div className={styles.commentMeta}>
                    <span className={styles.author}>
                      {comment.profiles?.email?.split("@")[0] || "Anonymous"}
                    </span>
                    <span className={styles.contentType}>
                      on {comment.content_type}
                    </span>
                    <span className={styles.date}>
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={styles.status}>
                    {comment.is_approved ? (
                      <span className={styles.approved}>
                        <CheckCircle size={16} />
                        Approved
                      </span>
                    ) : (
                      <span className={styles.pendingStatus}>
                        <XCircle size={16} />
                        Pending
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.commentContent}>
                  <p>{comment.comment}</p>
                </div>

                <div className={styles.commentActions}>
                  {!comment.is_approved ? (
                    <button
                      onClick={() => handleApprove(comment.id)}
                      className={styles.approveBtn}
                    >
                      <CheckCircle size={16} />
                      Approve
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReject(comment.id)}
                      className={styles.rejectBtn}
                    >
                      <XCircle size={16} />
                      Unapprove
                    </button>
                  )}

                  <button
                    onClick={() => confirmDelete(comment.id)}
                    className={styles.deleteBtn}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
