"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import ConfirmationModal from "@/components/ConfirmationModal/ConfirmationModal";
import { showAppToast } from "@/lib/showAppToast";
import be from "@/app/admin/blogs/BlogEditor.module.css";
import admin from "@/components/Admin/adminPage.module.css";
import styles from "../Profile.module.css";

export default function CommentsPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [comments, setComments] = useState([]);
  const [blogIdToSlug, setBlogIdToSlug] = useState({});
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function loadUserData() {
      try {
        setLoading(true);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        setUser(user);

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

        const { data: userComments, error: commentsError } = await supabase
          .from("user_comments")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (commentsError) {
          console.error("Error fetching comments:", commentsError);
          setError("Could not load comments");
          setComments([]);
        } else {
          const fetched = userComments || [];
          setComments(fetched);

          const blogIds = fetched
            .filter((c) => c.content_type === "blog" && c.content_id)
            .map((c) => c.content_id);
          const uniqueBlogIds = Array.from(new Set(blogIds));
          if (uniqueBlogIds.length > 0) {
            const { data: blogs, error: blogsError } = await supabase
              .from("blogs")
              .select("id, slug")
              .in("id", uniqueBlogIds);
            if (!blogsError && blogs) {
              const map = {};
              for (const b of blogs) {
                if (b?.id && b?.slug) map[b.id] = b.slug;
              }
              setBlogIdToSlug(map);
            }
          }
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
        showAppToast("Failed to delete comment.", "error");
      } else {
        setComments((prev) => prev.filter((c) => c.id !== commentToDelete));
        showAppToast("Comment deleted.", "success");
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
      showAppToast("An error occurred while deleting the comment.", "error");
    } finally {
      setShowDeleteConfirm(false);
      setCommentToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className={be.pageRoot}>
        <p className={styles.pageLoading}>Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={be.pageRoot}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <div className={be.pageRoot}>
      <header className={be.hero}>
        <div className={be.heroBack}>
          <Link href="/users/profile" className={admin.backNav}>
            <ArrowLeft size={18} strokeWidth={2} aria-hidden />
            Back to dashboard
          </Link>
        </div>
        <div className={be.heroMeta}>
          <p className={admin.eyebrow}>Account</p>
          <span className={be.metaChip}>Comments</span>
        </div>
        <h1 className={admin.pageTitle}>My comments</h1>
        <p className={admin.lead}>
          View and manage all your comments on blog posts and portfolio items.
        </p>
      </header>

      <div className={be.formFlow}>
        <section className={be.section} aria-labelledby="user-comments-section">
          <div className={be.sectionHead}>
            <div className={be.sectionIcon} aria-hidden>
              <MessageCircle size={20} strokeWidth={1.75} />
            </div>
            <div className={be.sectionHeadText}>
              <p className={be.sectionKicker}>Engagement</p>
              <h2 id="user-comments-section" className={be.sectionTitle}>
                Your comments
              </h2>
              <p className={be.sectionLead}>
                Delete a comment or open the post it belongs to.
              </p>
            </div>
          </div>

          {comments.length === 0 ? (
            <div className={styles.emptyState}>
              <p>You haven&apos;t made any comments yet.</p>
            </div>
          ) : (
            <div className={styles.contentList}>
              {comments.map((comment) => {
              const isBlog = comment.content_type === "blog";
              const href = isBlog
                ? `/blog/${blogIdToSlug[comment.content_id] || ""}`
                : `/portfolio/${comment.content_id}`;
              const isDisabled = isBlog && !blogIdToSlug[comment.content_id];

              return (
                <div key={comment.id} className={styles.commentItem}>
                  <div className={styles.commentHeader}>
                    <div className={styles.postInfo}>
                      <h3>
                        Comment on {isBlog ? "Blog Post" : "Portfolio Item"}
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
                      {isBlog ? "Blog Post" : "Portfolio Item"}
                    </span>
                    {isDisabled ? (
                      <span className={styles.viewPostLink} aria-disabled>
                        Loading link...
                      </span>
                    ) : (
                      <a href={href} className={styles.viewPostLink}>
                        View Post
                      </a>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </section>
      </div>

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
