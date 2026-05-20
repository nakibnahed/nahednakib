"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star, BookOpen, Briefcase, Clock, ExternalLink, StarOff } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import ConfirmationModal from "@/components/ConfirmationModal/ConfirmationModal";
import { showAppToast } from "@/lib/showAppToast";
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

export default function FavoritesPage() {
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [blogIdToSlug, setBlogIdToSlug] = useState({});
  const [blogIdToTitle, setBlogIdToTitle] = useState({});
  const [portfolioIdToSlug, setPortfolioIdToSlug] = useState({});
  const [portfolioIdToTitle, setPortfolioIdToTitle] = useState({});
  const [filterType, setFilterType] = useState("all");
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [favoriteToDelete, setFavoriteToDelete] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function loadUserData() {
      try {
        setLoading(true);
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) { router.push("/login"); return; }

        const { data: userFavorites, error: favoritesError } = await supabase
          .from("user_favorites").select("*").eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (favoritesError) { setError("Could not load favorite posts"); setFavorites([]); return; }

        const fetched = userFavorites || [];
        setFavorites(fetched);

        const blogIds = [...new Set(fetched.filter((f) => f.content_type === "blog" && f.content_id).map((f) => f.content_id))];
        if (blogIds.length > 0) {
          const { data: blogs } = await supabase.from("blogs").select("id, slug, title").in("id", blogIds);
          const slugMap = {}, titleMap = {};
          (blogs || []).forEach((b) => { if (b?.id) { slugMap[b.id] = b.slug; titleMap[b.id] = b.title; } });
          setBlogIdToSlug(slugMap); setBlogIdToTitle(titleMap);
        }

        const portfolioIds = [...new Set(fetched.filter((f) => f.content_type === "portfolio" && f.content_id).map((f) => f.content_id))];
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

  const handleRemoveFavorite = async () => {
    if (!favoriteToDelete) return;
    try {
      const { error } = await supabase.from("user_favorites").delete().eq("id", favoriteToDelete);
      if (error) { showAppToast("Failed to remove favorite.", "error"); return; }
      setFavorites((prev) => prev.filter((f) => f.id !== favoriteToDelete));
      showAppToast("Favorite removed.", "success");
    } catch { showAppToast("An error occurred.", "error"); }
    finally { setShowDeleteConfirm(false); setFavoriteToDelete(null); }
  };

  if (loading) return <div className={be.pageRoot}><p className={styles.pageLoading}>Loading…</p></div>;
  if (error) return <div className={be.pageRoot}><p className={styles.error}>{error}</p></div>;

  const contentTypes = [...new Set(favorites.map((f) => f.content_type))];
  const filtered = filterType === "all" ? favorites : favorites.filter((f) => f.content_type === filterType);

  return (
    <div className={be.pageRoot}>
      <header className={styles.hero}>
        <div className={styles.heroTop}>
          <span className={styles.heroChip}>Saved</span>
        </div>
        <div className={styles.heroTitleRow}>
          <div className={styles.heroIcon}><Star size={17} strokeWidth={1.75} /></div>
          <h1 className={styles.heroTitle}>Favorites</h1>
        </div>
        <p className={styles.heroLead}>Remove items or jump to the original post.</p>
      </header>

      <div className={be.formFlow}>
        <section className={be.section}>
          {favorites.length === 0 ? (
            <div className={styles.emptyState}><p>You don&apos;t have any favorites yet.</p></div>
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
                <div className={styles.emptyState}><p>No {typeLabel(filterType).toLowerCase()} in your favorites.</p></div>
              ) : (
                <div className={styles.contentList}>
                  {filtered.map((favorite) => {
                    const isBlog = favorite.content_type === "blog";
                    const slug = isBlog ? blogIdToSlug[favorite.content_id] : (portfolioIdToSlug[favorite.content_id] || favorite.content_id);
                    const href = isBlog ? `/blog/${slug || ""}` : `/portfolio/${slug}`;
                    const isDisabled = isBlog && !blogIdToSlug[favorite.content_id];
                    const title = isBlog ? blogIdToTitle[favorite.content_id] : portfolioIdToTitle[favorite.content_id];

                    return (
                      <div key={favorite.id} className={styles.itemCard}>
                        <div className={`${styles.itemIcon} ${isBlog ? styles.itemIconBlog : styles.itemIconPortfolio}`}>
                          {isBlog ? <BookOpen size={18} strokeWidth={1.75} /> : <Briefcase size={18} strokeWidth={1.75} />}
                        </div>

                        <div className={styles.itemInfo}>
                          <div className={styles.itemTitleRow}>
                            <span className={styles.itemTitle}>{title || (isBlog ? "Blog Post" : "Portfolio Item")}</span>
                          </div>
                          <div className={styles.itemPillsRow}>
                            <span className={styles.itemTypePill}>{typeLabel(favorite.content_type)}</span>
                            <span className={styles.itemTimeChip}><Clock size={11} />{formatDate(favorite.created_at)}</span>
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
                            onClick={() => { setFavoriteToDelete(favorite.id); setShowDeleteConfirm(true); }}
                          >
                            <StarOff size={13} /> Remove
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
        onConfirm={handleRemoveFavorite}
        title="Remove from Favorites"
        message="Are you sure you want to remove this from your favorites?"
        confirmText="Remove"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
}
