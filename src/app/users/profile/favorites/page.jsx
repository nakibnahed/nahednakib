"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
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

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        const { data: userFavorites, error: favoritesError } = await supabase
          .from("user_favorites")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (favoritesError) {
          console.error("Error fetching favorites:", favoritesError);
          setError("Could not load favorite posts");
          setFavorites([]);
        } else {
          const fetched = userFavorites || [];
          setFavorites(fetched);

          const blogIds = fetched
            .filter((f) => f.content_type === "blog" && f.content_id)
            .map((f) => f.content_id);
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
            .filter((f) => f.content_type === "portfolio" && f.content_id)
            .map((f) => f.content_id);
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

  const confirmRemoveFavorite = (favoriteId) => {
    setFavoriteToDelete(favoriteId);
    setShowDeleteConfirm(true);
  };

  const handleRemoveFavorite = async () => {
    if (!favoriteToDelete) return;

    try {
      const { error } = await supabase
        .from("user_favorites")
        .delete()
        .eq("id", favoriteToDelete);

      if (error) {
        console.error("Error removing favorite:", error);
        showAppToast("Failed to remove favorite.", "error");
      } else {
        setFavorites((prev) =>
          prev.filter((fav) => fav.id !== favoriteToDelete)
        );
        showAppToast("Favorite removed.", "success");
      }
    } catch (err) {
      console.error("Error removing favorite:", err);
      showAppToast("An error occurred while removing the favorite.", "error");
    } finally {
      setShowDeleteConfirm(false);
      setFavoriteToDelete(null);
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

  const contentTypes = [...new Set(favorites.map((f) => f.content_type))];
  const filtered =
    filterType === "all"
      ? favorites
      : favorites.filter((f) => f.content_type === filterType);

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
          <span className={be.metaChip}>Favorites</span>
        </div>
        <h1 className={admin.pageTitle}>Favorites</h1>
        <p className={admin.lead}>
          Your saved blog posts and portfolio items in one place.
        </p>
      </header>

      <div className={be.formFlow}>
        <section className={be.section} aria-labelledby="user-favorites-section">
          <div className={be.sectionHead}>
            <div className={be.sectionIcon} aria-hidden>
              <Star size={20} strokeWidth={1.75} />
            </div>
            <div className={be.sectionHeadText}>
              <p className={be.sectionKicker}>Saved</p>
              <h2 id="user-favorites-section" className={be.sectionTitle}>
                Your favorites
              </h2>
              <p className={be.sectionLead}>
                Remove items or jump to the original post.
              </p>
            </div>
          </div>

          {favorites.length === 0 ? (
            <div className={styles.emptyState}>
              <p>You don&apos;t have any favorites yet.</p>
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
                  <p>No {typeLabel(filterType).toLowerCase()} in your favorites.</p>
                </div>
              ) : (
                <div className={styles.contentList}>
                  {filtered.map((favorite) => {
                    const isBlog = favorite.content_type === "blog";
                    const href = isBlog
                      ? `/blog/${blogIdToSlug[favorite.content_id] || ""}`
                      : `/portfolio/${portfolioIdToSlug[favorite.content_id] || favorite.content_id}`;
                    const isDisabled = isBlog && !blogIdToSlug[favorite.content_id];
                    const title = isBlog
                      ? blogIdToTitle[favorite.content_id]
                      : portfolioIdToTitle[favorite.content_id];

                    return (
                      <div key={favorite.id} className={styles.favoriteItem}>
                        <div className={styles.favoriteHeader}>
                          <div className={styles.postInfo}>
                            <h3>{title || (isBlog ? "Blog Post" : "Portfolio Item")}</h3>
                            <span className={styles.favoriteDate}>
                              Added on{" "}
                              {new Date(favorite.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <button
                            onClick={() => confirmRemoveFavorite(favorite.id)}
                            className={styles.removeButton}
                          >
                            Remove
                          </button>
                        </div>
                        <div className={styles.favoriteFooter}>
                          <span className={styles.postType}>
                            {typeLabel(favorite.content_type)}
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
