"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, BookOpen, Briefcase, Clock, ExternalLink, HeartOff } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import be from "@/app/admin/blogs/BlogEditor.module.css";
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

export default function LikesPage() {
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState([]);
  const [blogIdToSlug, setBlogIdToSlug] = useState({});
  const [blogIdToTitle, setBlogIdToTitle] = useState({});
  const [portfolioIdToSlug, setPortfolioIdToSlug] = useState({});
  const [portfolioIdToTitle, setPortfolioIdToTitle] = useState({});
  const [filterType, setFilterType] = useState("all");
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function loadUserData() {
      try {
        setLoading(true);
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) { router.push("/login"); return; }

        const { data: userLikes, error: likesError } = await supabase
          .from("user_likes").select("*").eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (likesError) { setError("Could not load liked posts"); setLikes([]); return; }

        const fetched = userLikes || [];
        setLikes(fetched);

        const blogIds = [...new Set(fetched.filter((l) => l.content_type === "blog" && l.content_id).map((l) => l.content_id))];
        if (blogIds.length > 0) {
          const { data: blogs } = await supabase.from("blogs").select("id, slug, title").in("id", blogIds);
          const slugMap = {}, titleMap = {};
          (blogs || []).forEach((b) => { if (b?.id) { slugMap[b.id] = b.slug; titleMap[b.id] = b.title; } });
          setBlogIdToSlug(slugMap); setBlogIdToTitle(titleMap);
        }

        const portfolioIds = [...new Set(fetched.filter((l) => l.content_type === "portfolio" && l.content_id).map((l) => l.content_id))];
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

  const handleUnlike = async (likeId) => {
    try {
      const { error } = await supabase.from("user_likes").delete().eq("id", likeId);
      if (error) return;
      setLikes((prev) => prev.filter((l) => l.id !== likeId));
    } catch {}
  };

  if (loading) return <div className={be.pageRoot}><p className={styles.pageLoading}>Loading…</p></div>;
  if (error) return <div className={be.pageRoot}><p className={styles.error}>{error}</p></div>;

  const contentTypes = [...new Set(likes.map((l) => l.content_type))];
  const filtered = filterType === "all" ? likes : likes.filter((l) => l.content_type === filterType);

  return (
    <div className={be.pageRoot}>
      <header className={styles.hero}>
        <div className={styles.heroTop}>
          <span className={styles.heroChip}>Engagement</span>
        </div>
        <div className={styles.heroTitleRow}>
          <div className={styles.heroIcon}><Heart size={17} strokeWidth={1.75} /></div>
          <h1 className={styles.heroTitle}>Liked posts</h1>
        </div>
        <p className={styles.heroLead}>Open a post or remove a like from here.</p>
      </header>

      <div className={be.formFlow}>
        <section className={be.section}>
          {likes.length === 0 ? (
            <div className={styles.emptyState}><p>You haven&apos;t liked any posts yet.</p></div>
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
                <div className={styles.emptyState}><p>No {typeLabel(filterType).toLowerCase()} in your likes.</p></div>
              ) : (
                <div className={styles.contentList}>
                  {filtered.map((like) => {
                    const isBlog = like.content_type === "blog";
                    const slug = isBlog ? blogIdToSlug[like.content_id] : (portfolioIdToSlug[like.content_id] || like.content_id);
                    const href = isBlog ? `/blog/${slug || ""}` : `/portfolio/${slug}`;
                    const isDisabled = isBlog && !blogIdToSlug[like.content_id];
                    const title = isBlog ? blogIdToTitle[like.content_id] : portfolioIdToTitle[like.content_id];

                    return (
                      <div key={like.id} className={styles.itemCard}>
                        <div className={`${styles.itemIcon} ${isBlog ? styles.itemIconBlog : styles.itemIconPortfolio}`}>
                          {isBlog ? <BookOpen size={18} strokeWidth={1.75} /> : <Briefcase size={18} strokeWidth={1.75} />}
                        </div>

                        <div className={styles.itemInfo}>
                          <div className={styles.itemTitleRow}>
                            <span className={styles.itemTitle}>{title || (isBlog ? "Blog Post" : "Portfolio Item")}</span>
                          </div>
                          <div className={styles.itemPillsRow}>
                            <span className={styles.itemTypePill}>{typeLabel(like.content_type)}</span>
                            <span className={styles.itemTimeChip}><Clock size={11} />{formatDate(like.created_at)}</span>
                          </div>
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
                            onClick={() => handleUnlike(like.id)}
                          >
                            <HeartOff size={13} /> Unlike
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
    </div>
  );
}
