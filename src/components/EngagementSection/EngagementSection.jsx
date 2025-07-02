"use client";

import { useState } from "react";
import {
  FaHeart,
  FaThumbsUp,
  FaComment,
  FaRegHeart,
  FaRegThumbsUp,
} from "react-icons/fa";
import { FiShare2, FiSend, FiLoader } from "react-icons/fi";
import { useEngagement } from "@/hooks/useEngagement";
import styles from "./EngagementSection.module.css";

export default function EngagementSection({ contentType, contentId, title }) {
  const { user, loading, engagement, actions } = useEngagement(
    contentType,
    contentId
  );
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState("");

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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 43200)
      return `${Math.floor(diffInMinutes / 1440)}d ago`;

    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingBar}>
          <FiLoader className={styles.spinner} />
          Loading engagement data...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Action Buttons */}
      <div className={styles.actionRow}>
        <button
          className={`${styles.actionBtn} ${
            engagement.likes.userLiked ? styles.active : ""
          }`}
          onClick={actions.toggleLike}
          disabled={engagement.likes.loading}
          title={engagement.likes.userLiked ? "Unlike" : "Like"}
        >
          {engagement.likes.loading ? (
            <FiLoader className={styles.spinner} size={18} />
          ) : engagement.likes.userLiked ? (
            <FaThumbsUp size={18} />
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
        >
          {engagement.favorites.loading ? (
            <FiLoader className={styles.spinner} size={18} />
          ) : engagement.favorites.userFavorited ? (
            <FaHeart size={18} />
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
                  <span className={styles.commentAuthor}>
                    {comment.profiles?.email?.split("@")[0] || "Anonymous"}
                  </span>
                  <span className={styles.commentDate}>
                    {formatDate(comment.created_at)}
                  </span>
                </div>
                <p className={styles.commentText}>{comment.comment}</p>

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
                          <span className={styles.commentAuthor}>
                            {reply.profiles?.email?.split("@")[0] ||
                              "Anonymous"}
                          </span>
                          <span className={styles.commentDate}>
                            {formatDate(reply.created_at)}
                          </span>
                        </div>
                        <p className={styles.commentText}>{reply.comment}</p>
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
    </div>
  );
}
