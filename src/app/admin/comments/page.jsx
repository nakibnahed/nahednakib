"use client";

import admin from "@/components/Admin/adminPage.module.css";
import AdminListSkeleton from "@/components/Skeletons/AdminListSkeleton";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/services/supabaseClient";
import ConfirmationModal from "@/components/ConfirmationModal/ConfirmationModal";
import { showAppToast } from "@/lib/showAppToast";
import { isUuid } from "@/lib/utils/isUuid";
import styles from "./Comments.module.css";
import {
  MessageCircle,
  CheckCircle,
  Clock,
  XCircle,
  Trash2,
  ExternalLink,
  BookOpen,
  Briefcase,
  MessageSquare,
} from "lucide-react";

async function enrichComments(rawComments) {
  const blogIds = [
    ...new Set(
      rawComments
        .filter((c) => c.content_type === "blog")
        .map((c) => c.content_id)
    ),
  ];
  const portfolioIds = [
    ...new Set(
      rawComments
        .filter((c) => c.content_type === "portfolio")
        .map((c) => c.content_id)
    ),
  ];

  const blogMap = {};
  const portfolioMap = {};

  if (blogIds.length > 0) {
    const { data } = await supabase
      .from("blogs")
      .select("id, title, slug")
      .in("id", blogIds);
    (data || []).forEach((b) => {
      blogMap[b.id] = b;
    });
  }

  if (portfolioIds.length > 0) {
    const uuidIds = portfolioIds.filter((id) => isUuid(id));
    const slugIds = portfolioIds.filter((id) => !isUuid(id));

    if (uuidIds.length > 0) {
      const { data } = await supabase
        .from("portfolios")
        .select("id, title, slug")
        .in("id", uuidIds);
      (data || []).forEach((p) => {
        portfolioMap[p.id] = p;
        portfolioMap[p.slug] = p;
      });
    }
    if (slugIds.length > 0) {
      const { data } = await supabase
        .from("portfolios")
        .select("id, title, slug")
        .in("slug", slugIds);
      (data || []).forEach((p) => {
        portfolioMap[p.slug] = p;
        portfolioMap[p.id] = p;
      });
    }
  }

  return rawComments.map((comment) => {
    let post = null;
    if (comment.content_type === "blog") {
      post = blogMap[comment.content_id];
    } else if (comment.content_type === "portfolio") {
      post = portfolioMap[comment.content_id];
    }
    return {
      ...comment,
      postTitle: post?.title ?? null,
      postUrl: post
        ? comment.content_type === "blog"
          ? `/blog/${post.slug}`
          : `/portfolio/${post.slug}`
        : null,
    };
  });
}

const FILTERS = ["all", "pending", "approved"];

export default function CommentsPage() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0 });
  const [filter, setFilter] = useState("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchComments(), fetchStats()]);
    setLoading(false);
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("user_comments")
        .select(
          `id, comment, content_type, content_id, is_approved, created_at,
           profiles!inner(email, first_name, last_name, full_name)`
        )
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      const enriched = await enrichComments(data || []);
      setComments(enriched);
    } catch (error) {
      console.error("Error fetching comments:", error);
      setComments([]);
    }
  };

  const fetchStats = async () => {
    try {
      const [{ count: total }, { count: approved }] = await Promise.all([
        supabase.from("user_comments").select("*", { count: "exact", head: true }),
        supabase
          .from("user_comments")
          .select("*", { count: "exact", head: true })
          .eq("is_approved", true),
      ]);
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
      const res = await fetch(`/api/engagement/comments?id=${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_approved: true }),
      });
      if (!res.ok) throw new Error();
      await fetchAll();
      showAppToast("Comment approved.", "success");
    } catch {
      showAppToast("Failed to approve comment.", "error");
    }
  };

  const handleReject = async (commentId) => {
    try {
      const res = await fetch(`/api/engagement/comments?id=${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_approved: false }),
      });
      if (!res.ok) throw new Error();
      await fetchAll();
      showAppToast("Comment unapproved.", "success");
    } catch {
      showAppToast("Failed to unapprove comment.", "error");
    }
  };

  const confirmDelete = (commentId) => {
    setCommentToDelete(commentId);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!commentToDelete) return;
    try {
      const res = await fetch(`/api/engagement/comments?id=${commentToDelete}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      await fetchAll();
      showAppToast("Comment deleted.", "success");
    } catch (error) {
      showAppToast(error.message || "Failed to delete comment.", "error");
    } finally {
      setShowDeleteConfirm(false);
      setCommentToDelete(null);
    }
  };

  const filteredComments = useMemo(() => {
    if (filter === "pending") return comments.filter((c) => !c.is_approved);
    if (filter === "approved") return comments.filter((c) => c.is_approved);
    return comments;
  }, [comments, filter]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffH = Math.floor((now - date) / 3_600_000);
    if (diffH < 1) return "Just now";
    if (diffH < 24) return `${diffH}h ago`;
    if (diffH < 48) return "Yesterday";
    return date.toLocaleDateString();
  };

  const getDisplayName = (profile) => {
    if (!profile) return "Anonymous";
    const full = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
    return full || profile.full_name || profile.email?.split("@")[0] || "Anonymous";
  };

  if (loading) return <AdminListSkeleton />;

  return (
    <div className={admin.page}>
      <header className={admin.pageHeader}>
        <p className={admin.eyebrow}>Moderation</p>
        <h1 className={admin.pageTitle}>Comments</h1>
        <p className={admin.lead}>
          Review, approve, and manage user comments across all content.
        </p>
      </header>

      <section className={admin.statsSection} aria-label="Summary">
        <div className={admin.statsGrid}>
          <div className={admin.statCard}>
            <MessageCircle size={24} aria-hidden />
            <div>
              <h3>{stats.total}</h3>
              <p>Total comments</p>
            </div>
          </div>
          <div className={admin.statCard}>
            <CheckCircle size={24} aria-hidden />
            <div>
              <h3>{stats.approved}</h3>
              <p>Approved</p>
            </div>
          </div>
          <div className={admin.statCard}>
            <Clock size={24} aria-hidden />
            <div>
              <h3>{stats.pending}</h3>
              <p>Pending review</p>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.filterBar} role="tablist" aria-label="Filter comments">
        {FILTERS.map((f) => {
          const count =
            f === "all" ? stats.total : f === "pending" ? stats.pending : stats.approved;
          return (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              className={`${styles.filterTab} ${filter === f ? styles.filterTabActive : ""}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className={styles.filterCount}>{count}</span>
            </button>
          );
        })}
      </div>

      {filteredComments.length === 0 ? (
        <div className={admin.emptyPanel}>
          <MessageCircle size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ margin: 0 }}>
            {filter === "all"
              ? "No comments yet."
              : `No ${filter} comments.`}
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {filteredComments.map((comment) => (
            <div
              key={comment.id}
              className={`${styles.card} ${!comment.is_approved ? styles.cardPending : ""}`}
            >
              {/* Avatar */}
              <div className={styles.avatar}>
                {(comment.profiles?.email?.[0] ?? "?").toUpperCase()}
              </div>

              {/* Info */}
              <div className={styles.info}>
                {/* Name row */}
                <div className={styles.nameRow}>
                  <span className={styles.authorName}>
                    {getDisplayName(comment.profiles)}
                  </span>
                  <span className={styles.authorEmail}>
                    {comment.profiles?.email}
                  </span>
                  <span className={styles.typePill}>
                    {comment.content_type === "blog" ? (
                      <><BookOpen size={10} /> Blog</>
                    ) : (
                      <><Briefcase size={10} /> Portfolio</>
                    )}
                  </span>
                </div>

                {/* Pills row: status + time + post link */}
                <div className={styles.pillsRow}>
                  {comment.is_approved ? (
                    <span className={styles.badgeApproved}>
                      <CheckCircle size={10} />
                      Approved
                    </span>
                  ) : (
                    <span className={styles.badgePending}>
                      <Clock size={10} />
                      Pending
                    </span>
                  )}
                  <span className={styles.timeChip}>
                    <Clock size={11} />
                    {formatDate(comment.created_at)}
                  </span>
                  {comment.postUrl ? (
                    <a
                      href={comment.postUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.postChip}
                    >
                      {comment.postTitle ?? comment.content_id}
                      <ExternalLink size={10} />
                    </a>
                  ) : (
                    <span className={styles.postChipUnknown}>
                      {comment.postTitle ?? comment.content_id}
                    </span>
                  )}
                </div>

                {/* Comment body — left-bordered quote */}
                <p className={styles.body}>
                  <MessageSquare size={12} style={{ flexShrink: 0, marginTop: 2, opacity: 0.5 }} />
                  {comment.comment}
                </p>
              </div>

              {/* Actions — right side, stacked */}
              <div className={styles.actions}>
                {!comment.is_approved ? (
                  <button
                    type="button"
                    className={styles.approveBtn}
                    onClick={() => handleApprove(comment.id)}
                  >
                    <CheckCircle size={13} />
                    Approve
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.unapproveBtn}
                    onClick={() => handleReject(comment.id)}
                  >
                    <XCircle size={13} />
                    Unapprove
                  </button>
                )}
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={() => confirmDelete(comment.id)}
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
