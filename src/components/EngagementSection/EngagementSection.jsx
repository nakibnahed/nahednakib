"use client";

import { useState, useEffect } from "react";
import {
  FaHeart,
  FaThumbsUp,
  FaComment,
  FaRegHeart,
  FaRegThumbsUp,
  FaTrash,
  FaEdit,
} from "react-icons/fa";
import { FiShare2, FiSend, FiLoader } from "react-icons/fi";
import { useEngagement } from "@/hooks/useEngagement";
import ConfirmationModal from "@/components/ConfirmationModal/ConfirmationModal";
import styles from "./EngagementSection.module.css";

export default function EngagementSection({
  contentType,
  contentId,
  title,
  id,
}) {
  const { user, loading, engagement, actions } = useEngagement(
    contentType,
    contentId
  );
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [deletingComment, setDeletingComment] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;

      try {
        const response = await fetch("/api/test-session");
        const data = await response.json();
        if (data.user?.role === "admin") {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
      }
    };

    checkAdminStatus();
  }, [user]);

  const handleShare = () => {
    if (typeof window !== "undefined" && navigator.share) {
      navigator.share({
        title,
        url: window.location.href,
      });
    } else if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      // Show a nice toast notification instead of alert
      const toast = document.createElement("div");
      toast.className = styles.toast;
      toast.textContent = "Link copied to clipboard!";
      document.body.appendChild(toast);
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 3000);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await actions.addComment(newComment);
      setNewComment("");
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  const handleAddReply = async (e, parentId) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      await actions.addComment(replyText, parentId);
      setReplyText("");
      setReplyTo(null);
    } catch (error) {
      console.error("Failed to add reply:", error);
    }
  };

  const confirmDeleteComment = (commentId) => {
    setCommentToDelete(commentId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;

    setDeletingComment(commentToDelete);
    setShowDeleteConfirm(false);

    try {
      await actions.deleteComment(commentToDelete);

      // Show success toast
      const toast = document.createElement("div");
      toast.className = styles.toast;
      toast.textContent = "Comment deleted successfully!";
      toast.style.background = "#10b981";
      document.body.appendChild(toast);
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 3000);
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment. Please try again.");
    } finally {
      setDeletingComment(null);
      setCommentToDelete(null);
    }
  };

  const startEditing = (comment) => {
    setEditingComment(comment.id);
    setEditText(comment.comment);
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setEditText("");
  };

  const handleEditComment = async (commentId) => {
    if (!editText.trim()) return;

    try {
      // For now, we'll delete and recreate the comment
      // In a real app, you'd have an update endpoint
      await actions.deleteComment(commentId);
      await actions.addComment(editText);

      setEditingComment(null);
      setEditText("");

      // Show success toast
      const toast = document.createElement("div");
      toast.className = styles.toast;
      toast.textContent = "Comment updated successfully!";
      toast.style.background = "#10b981";
      document.body.appendChild(toast);
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 3000);
    } catch (error) {
      console.error("Error updating comment:", error);
      alert("Failed to update comment. Please try again.");
    }
  };

  const canEditComment = (comment) => {
    return user && (isAdmin || comment.user_id === user.id);
  };

  const canDeleteComment = (comment) => {
    return user && (isAdmin || comment.user_id === user.id);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingBar}>
          <FiLoader className={styles.spinner} size={20} />
          <span>Loading engagement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container} id={id}>
      {/* Action Buttons */}
      <div className={styles.actionRow}>
        <button
          className={`${styles.actionBtn} ${
            engagement.likes.userLiked ? styles.active : ""
          }`}
          onClick={actions.toggleLike}
          disabled={engagement.likes.loading}
          title={engagement.likes.userLiked ? "Unlike" : "Like"}
          style={{
            color: engagement.likes.userLiked
              ? "var(--primary-color)"
              : "inherit",
          }}
        >
          {engagement.likes.loading ? (
            <FiLoader className={styles.spinner} size={18} />
          ) : engagement.likes.userLiked ? (
            <FaThumbsUp size={18} style={{ fill: "var(--primary-color)" }} />
          ) : (
            <FaRegThumbsUp size={18} />
          )}
          <span>{engagement.likes.count}</span>
        </button>

        <button
          className={`${styles.actionBtn} ${
            engagement.favorites.userFavorited ? styles.active : ""
          }`}
          onClick={actions.toggleFavorite}
          disabled={engagement.favorites.loading}
          title={
            engagement.favorites.userFavorited
              ? "Remove from favorites"
              : "Add to favorites"
          }
          style={{
            color: engagement.favorites.userFavorited
              ? "var(--primary-color)"
              : "inherit",
          }}
        >
          {engagement.favorites.loading ? (
            <FiLoader className={styles.spinner} size={18} />
          ) : engagement.favorites.userFavorited ? (
            <FaHeart size={18} style={{ fill: "var(--primary-color)" }} />
          ) : (
            <FaRegHeart size={18} />
          )}
          <span>{engagement.favorites.count}</span>
        </button>

        <button
          className={`${styles.actionBtn} ${showComments ? styles.active : ""}`}
          onClick={() => setShowComments(!showComments)}
          title="Comments"
        >
          <FaComment size={18} />
          <span>{engagement.comments.count}</span>
        </button>

        <button
          className={styles.actionBtn}
          onClick={handleShare}
          title="Share"
        >
          <FiShare2 size={18} />
          <span>Share</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className={styles.commentsSection}>
          {/* Add Comment Form */}
          {user ? (
            <form onSubmit={handleAddComment} className={styles.commentForm}>
              <div className={styles.commentInputWrapper}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  className={styles.commentInput}
                  rows="3"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className={styles.submitBtn}
                >
                  <FiSend size={16} />
                </button>
              </div>
            </form>
          ) : (
            <div className={styles.loginPrompt}>
              <p>
                <a href="/login" className={styles.loginLink}>
                  Sign in
                </a>{" "}
                to join the conversation
              </p>
            </div>
          )}

          {/* Comments List */}
          <div className={styles.commentsList}>
            {engagement.comments.items.map((comment) => (
              <div key={comment.id} className={styles.comment}>
                <div className={styles.commentHeader}>
                  <div className={styles.commentInfo}>
                    <span className={styles.commentAuthor}>
                      {comment.profiles?.email?.split("@")[0] || "Anonymous"}
                    </span>
                    <span className={styles.commentDate}>
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  {/* Action Buttons for Main Comment */}
                  {(canEditComment(comment) || canDeleteComment(comment)) && (
                    <div className={styles.commentActions}>
                      {canEditComment(comment) &&
                        editingComment !== comment.id && (
                          <button
                            onClick={() => startEditing(comment)}
                            className={styles.editBtn}
                            title="Edit comment"
                          >
                            <FaEdit size={14} />
                          </button>
                        )}
                      {canDeleteComment(comment) && (
                        <button
                          onClick={() => confirmDeleteComment(comment.id)}
                          className={styles.deleteBtn}
                          title="Delete comment"
                          disabled={deletingComment === comment.id}
                        >
                          {deletingComment === comment.id ? (
                            <FiLoader className={styles.spinner} size={14} />
                          ) : (
                            <FaTrash size={14} />
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {editingComment === comment.id ? (
                  <div className={styles.editForm}>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className={styles.commentInput}
                      rows="3"
                    />
                    <div className={styles.editActions}>
                      <button
                        onClick={() => handleEditComment(comment.id)}
                        disabled={!editText.trim()}
                        className={styles.saveBtn}
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className={styles.cancelBtn}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className={styles.commentText}>{comment.comment}</p>
                )}

                {/* Reply Button */}
                {user && (
                  <button
                    onClick={() =>
                      setReplyTo(replyTo === comment.id ? null : comment.id)
                    }
                    className={styles.replyBtn}
                  >
                    Reply
                  </button>
                )}

                {/* Reply Form */}
                {replyTo === comment.id && (
                  <form
                    onSubmit={(e) => handleAddReply(e, comment.id)}
                    className={styles.replyForm}
                  >
                    <div className={styles.commentInputWrapper}>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Reply to ${
                          comment.profiles?.email?.split("@")[0] || "Anonymous"
                        }...`}
                        className={styles.commentInput}
                        rows="2"
                      />
                      <button
                        type="submit"
                        disabled={!replyText.trim()}
                        className={styles.submitBtn}
                      >
                        <FiSend size={14} />
                      </button>
                    </div>
                  </form>
                )}

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className={styles.replies}>
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className={styles.reply}>
                        <div className={styles.commentHeader}>
                          <div className={styles.commentInfo}>
                            <span className={styles.commentAuthor}>
                              {reply.profiles?.email?.split("@")[0] ||
                                "Anonymous"}
                            </span>
                            <span className={styles.commentDate}>
                              {formatDate(reply.created_at)}
                            </span>
                          </div>
                          {/* Action Buttons for Reply */}
                          {(canEditComment(reply) ||
                            canDeleteComment(reply)) && (
                            <div className={styles.commentActions}>
                              {canEditComment(reply) &&
                                editingComment !== reply.id && (
                                  <button
                                    onClick={() => startEditing(reply)}
                                    className={styles.editBtn}
                                    title="Edit reply"
                                  >
                                    <FaEdit size={12} />
                                  </button>
                                )}
                              {canDeleteComment(reply) && (
                                <button
                                  onClick={() => confirmDeleteComment(reply.id)}
                                  className={styles.deleteBtn}
                                  title="Delete reply"
                                  disabled={deletingComment === reply.id}
                                >
                                  {deletingComment === reply.id ? (
                                    <FiLoader
                                      className={styles.spinner}
                                      size={12}
                                    />
                                  ) : (
                                    <FaTrash size={12} />
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {editingComment === reply.id ? (
                          <div className={styles.editForm}>
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className={styles.commentInput}
                              rows="2"
                            />
                            <div className={styles.editActions}>
                              <button
                                onClick={() => handleEditComment(reply.id)}
                                disabled={!editText.trim()}
                                className={styles.saveBtn}
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEditing}
                                className={styles.cancelBtn}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className={styles.commentText}>{reply.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Load More Button */}
            {engagement.comments.hasMore && (
              <button
                onClick={actions.loadMoreComments}
                disabled={engagement.comments.loading}
                className={styles.loadMoreBtn}
              >
                {engagement.comments.loading ? (
                  <>
                    <FiLoader className={styles.spinner} />
                    Loading...
                  </>
                ) : (
                  "Load more comments"
                )}
              </button>
            )}

            {engagement.comments.count === 0 && (
              <div className={styles.noComments}>
                <p>No comments yet. Be the first to share your thoughts!</p>
              </div>
            )}
          </div>
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
  );
}
