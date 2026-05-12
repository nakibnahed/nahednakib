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
import { isUuid } from "@/lib/utils/isUuid";

const typeLabel = (type) => {
  if (type === "blog") return "Blog Posts";
  if (type === "portfolio") return "Portfolio";
  return type.charAt(0).toUpperCase() + type.slice(1);
};

export default function CommentsPage() {
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [blogIdToSlug, setBlogIdToSlug] = useState({});
  const [blogIdToTitle, setBlogIdToTitle] = useState({});
  const [portfolioIdToSlug, setPortfolioIdToSlug] = useState({});
  const [portfolioIdToTitle, setPortfolioIdToTitle] = useState({});
  const [filterType, setFilterType] = useState("all");
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
              .select("id, slug, title")
              .in("id", uniqueBlogIds);
            if (!blogsError && blogs) {
              const slugMap = {};
              const titleMap = {};
              for (const b of blogs) {
                if (b?.id && b?.slug) slugMap[b.id] = b.slug;
                if (b?.id && b?.title) titleMap[b.id] = b.title;
              }
              setBlogIdToSlug(slugMap);
              setBlogIdToTitle(titleMap);
            }
          }

          const portfolioIds = fetched
            .filter((c) => c.content_type === "portfolio" && c.content_id)
            .map((c) => c.content_id);
          const uniquePortfolioIds = Array.from(new Set(portfolioIds));
          if (uniquePortfolioIds.length > 0) {
            const slugMap = {};
            const titleMap = {};
            for (const ref of uniquePortfolioIds) {
              if (!isUuid(ref)) slugMap[ref] = ref;
            }
            const nonUuidRefs = uniquePortfolioIds.filter((id) => !isUuid(id));
            if (nonUuidRefs.length > 0) {
              const { data: portfoliosBySlug } = await supabase
                .from("portfolios")
                .select("slug, title")
                .in("slug", nonUuidRefs);
              if (portfoliosBySlug) {
                for (const p of portfoliosBySlug) {
                  if (p?.slug && p?.title) titleMap[p.slug] = p.title;
                }
              }
            }
            const uuidPortfolioIds = uniquePortfolioIds.filter(isUuid);
            if (uuidPortfolioIds.length > 0) {
              const { data: portfolios, error: portfoliosError } =
                await supabase
                  .from("portfolios")
                  .select("id, slug, title")
                  .in("id", uuidPortfolioIds);
              if (!portfoliosError && portfolios) {
                for (const p of portfolios) {
                  if (p?.id && p?.slug) slugMap[p.id] = p.slug;
                  if (p?.id && p?.title) titleMap[p.id] = p.title;
                }
              }
            }
            setPortfolioIdToSlug(slugMap);
            setPortfolioIdToTitle(titleMap);
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

  const contentTypes = [...new Set(comments.map((c) => c.content_type))];
  const filtered =
    filterType === "all"
      ? comments
      : comments.filter((c) => c.content_type === filterType);

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
            <>
              <div className={styles.filterBar}>
                <button
                  className={`${styles.filterBtn}${filterType === "all" ? ` ${styles.filterBtnActive}` : ""}`}
                  onClick={() => setFilterType("all")}
                >
                  All
                </button>
                {contentTypes.map((type) => (
                  <button
                    key={type}
                    className={`${styles.filterBtn}${filterType === type ? ` ${styles.filterBtnActive}` : ""}`}
                    onClick={() => setFilterType(type)}
                  >
                    {typeLabel(type)}
                  </button>
                ))}
              </div>

              {filtered.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No {typeLabel(filterType).toLowerCase()} comments found.</p>
                </div>
              ) : (
                <div className={styles.contentList}>
                  {filtered.map((comment) => {
                    const isBlog = comment.content_type === "blog";
                    const href = isBlog
                      ? `/blog/${blogIdToSlug[comment.content_id] || ""}`
                      : `/portfolio/${portfolioIdToSlug[comment.content_id] || comment.content_id}`;
                    const isDisabled = isBlog && !blogIdToSlug[comment.content_id];
                    const title = isBlog
                      ? blogIdToTitle[comment.content_id]
                      : portfolioIdToTitle[comment.content_id];

                    return (
                      <div key={comment.id} className={styles.commentItem}>
                        <div className={styles.commentHeader}>
                          <div className={styles.postInfo}>
                            <h3>{title || (isBlog ? "Blog Post" : "Portfolio Item")}</h3>
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
                            {typeLabel(comment.content_type)}
                          </span>
                          {isDisabled ? (
                            <span className={styles.viewPostLink} aria-disabled>
                              Unavailable
                            </span>
                          ) : (
                            <Link href={href} className={styles.viewPostLink}>
                              View Post
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
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
