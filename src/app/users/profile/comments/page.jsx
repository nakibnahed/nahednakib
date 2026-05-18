"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, MessageCircle, BookOpen, Briefcase,
  Clock, ExternalLink, Trash2, MessageSquare, CheckCircle,
} from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import ConfirmationModal from "@/components/ConfirmationModal/ConfirmationModal";
import { showAppToast } from "@/lib/showAppToast";
import be from "@/app/admin/blogs/BlogEditor.module.css";
import admin from "@/components/Admin/adminPage.module.css";
import styles from "../Profile.module.css";
import { isUuid } from "@/lib/utils/isUuid";

const typeLabel = (type) => {
  if (type === "blog") return "Blog";
  if (type === "portfolio") return "Portfolio";
  return type.charAt(0).toUpperCase() + type.slice(1);
};

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffH = Math.floor((now - date) / 3_600_000);
  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  if (diffH < 48) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

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
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) { router.push("/login"); return; }

        const { data: userComments, error: commentsError } = await supabase
          .from("user_comments").select("*").eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (commentsError) { setError("Could not load comments"); setComments([]); return; }

        const fetched = userComments || [];
        setComments(fetched);

        const blogIds = [...new Set(fetched.filter((c) => c.content_type === "blog" && c.content_id).map((c) => c.content_id))];
        if (blogIds.length > 0) {
          const { data: blogs } = await supabase.from("blogs").select("id, slug, title").in("id", blogIds);
          const slugMap = {}, titleMap = {};
          (blogs || []).forEach((b) => { if (b?.id) { slugMap[b.id] = b.slug; titleMap[b.id] = b.title; } });
          setBlogIdToSlug(slugMap); setBlogIdToTitle(titleMap);
        }

        const portfolioIds = [...new Set(fetched.filter((c) => c.content_type === "portfolio" && c.content_id).map((c) => c.content_id))];
        if (portfolioIds.length > 0) {
          const slugMap = {}, titleMap = {};
          portfolioIds.filter((id) => !isUuid(id)).forEach((ref) => { slugMap[ref] = ref; });
          const nonUuids = portfolioIds.filter((id) => !isUuid(id));
          if (nonUuids.length > 0) {
            const { data } = await supabase.from("portfolios").select("slug, title").in("slug", nonUuids);
            (data || []).forEach((p) => { if (p?.slug) titleMap[p.slug] = p.title; });
          }
          const uuids = portfolioIds.filter(isUuid);
          if (uuids.length > 0) {
            const { data } = await supabase.from("portfolios").select("id, slug, title").in("id", uuids);
            (data || []).forEach((p) => { if (p?.id) { slugMap[p.id] = p.slug; titleMap[p.id] = p.title; } });
          }
          setPortfolioIdToSlug(slugMap); setPortfolioIdToTitle(titleMap);
        }
      } catch { setError("An error occurred while loading your data"); }
      finally { setLoading(false); }
    }
    loadUserData();
  }, [router]);

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;
    try {
      const { error } = await supabase.from("user_comments").delete().eq("id", commentToDelete);
      if (error) { showAppToast("Failed to delete comment.", "error"); return; }
      setComments((prev) => prev.filter((c) => c.id !== commentToDelete));
      showAppToast("Comment deleted.", "success");
    } catch { showAppToast("An error occurred.", "error"); }
    finally { setShowDeleteConfirm(false); setCommentToDelete(null); }
  };

  if (loading) return <div className={be.pageRoot}><p className={styles.pageLoading}>Loading…</p></div>;
  if (error) return <div className={be.pageRoot}><p className={styles.error}>{error}</p></div>;

  const contentTypes = [...new Set(comments.map((c) => c.content_type))];
  const filtered = filterType === "all" ? comments : comments.filter((c) => c.content_type === filterType);

  return (
    <div className={be.pageRoot}>
      <header className={be.hero}>
        <div className={be.heroBack}>
          <Link href="/users/profile" className={admin.backNav}>
            <ArrowLeft size={18} strokeWidth={2} aria-hidden /> Back to dashboard
          </Link>
        </div>
        <div className={be.heroMeta}>
          <p className={admin.eyebrow}>Account</p>
          <span className={be.metaChip}>Comments</span>
        </div>
        <h1 className={admin.pageTitle}>My comments</h1>
        <p className={admin.lead}>View and manage all your comments on blog posts and portfolio items.</p>
      </header>

      <div className={be.formFlow}>
        <section className={be.section} aria-labelledby="user-comments-section">
          <div className={be.sectionHead}>
            <div className={be.sectionIcon} aria-hidden><MessageCircle size={20} strokeWidth={1.75} /></div>
            <div className={be.sectionHeadText}>
              <p className={be.sectionKicker}>Engagement</p>
              <h2 id="user-comments-section" className={be.sectionTitle}>Your comments</h2>
              <p className={be.sectionLead}>Delete a comment or open the post it belongs to.</p>
            </div>
          </div>

          {comments.length === 0 ? (
            <div className={styles.emptyState}><p>You haven&apos;t made any comments yet.</p></div>
          ) : (
            <>
              <div className={styles.filterBar}>
                {["all", ...contentTypes].map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`${styles.filterBtn}${filterType === t ? ` ${styles.filterBtnActive}` : ""}`}
                    onClick={() => setFilterType(t)}
                  >
                    {t === "all" ? "All" : typeLabel(t)}
                  </button>
                ))}
              </div>

              {filtered.length === 0 ? (
                <div className={styles.emptyState}><p>No {typeLabel(filterType).toLowerCase()} comments found.</p></div>
              ) : (
                <div className={styles.contentList}>
                  {filtered.map((comment) => {
                    const isBlog = comment.content_type === "blog";
                    const slug = isBlog ? blogIdToSlug[comment.content_id] : (portfolioIdToSlug[comment.content_id] || comment.content_id);
                    const href = isBlog ? `/blog/${slug || ""}` : `/portfolio/${slug}`;
                    const isDisabled = isBlog && !blogIdToSlug[comment.content_id];
                    const title = isBlog ? blogIdToTitle[comment.content_id] : portfolioIdToTitle[comment.content_id];

                    return (
                      <div key={comment.id} className={styles.itemCard}>
                        <div className={`${styles.itemIcon} ${isBlog ? styles.itemIconBlog : styles.itemIconPortfolio}`}>
                          {isBlog ? <BookOpen size={18} strokeWidth={1.75} /> : <Briefcase size={18} strokeWidth={1.75} />}
                        </div>

                        <div className={styles.itemInfo}>
                          <div className={styles.itemTitleRow}>
                            <span className={styles.itemTitle}>{title || (isBlog ? "Blog Post" : "Portfolio Item")}</span>
                          </div>
                          <div className={styles.itemPillsRow}>
                            <span className={styles.itemTypePill}>{typeLabel(comment.content_type)}</span>
                            {comment.is_approved ? (
                              <span className={styles.itemBadgeApproved}><CheckCircle size={10} /> Approved</span>
                            ) : (
                              <span className={styles.itemBadgePending}><Clock size={10} /> Pending</span>
                            )}
                            <span className={styles.itemTimeChip}><Clock size={11} />{formatDate(comment.created_at)}</span>
                          </div>
                          <p className={styles.itemBody}>
                            <MessageSquare size={12} style={{ flexShrink: 0, marginTop: 2, marginRight: 8, opacity: 0.45 }} />
                            {comment.comment || "No content"}
                          </p>
                        </div>

                        <div className={styles.itemActions}>
                          {isDisabled ? (
                            <span className={styles.itemViewDisabled}>Unavailable</span>
                          ) : (
                            <Link href={href} className={styles.itemViewBtn}>
                              <ExternalLink size={13} /> View
                            </Link>
                          )}
                          <button
                            type="button"
                            className={styles.itemRemoveBtn}
                            onClick={() => { setCommentToDelete(comment.id); setShowDeleteConfirm(true); }}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
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
