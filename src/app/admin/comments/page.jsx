"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabaseClient";
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
      const { error } = await supabase
        .from("user_comments")
        .update({ is_approved: true })
        .eq("id", commentId);

      if (error) throw error;
      await fetchComments();
      await fetchStats();
    } catch (error) {
      console.error("Error approving comment:", error);
    }
  };

  const handleReject = async (commentId) => {
    try {
      const { error } = await supabase
        .from("user_comments")
        .update({ is_approved: false })
        .eq("id", commentId);

      if (error) throw error;
      await fetchComments();
      await fetchStats();
    } catch (error) {
      console.error("Error rejecting comment:", error);
    }
  };

  const handleDelete = async (commentId) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const { error } = await supabase
        .from("user_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
      await fetchComments();
      await fetchStats();
    } catch (error) {
      console.error("Error deleting comment:", error);
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
                    onClick={() => handleDelete(comment.id)}
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
    </div>
  );
}
