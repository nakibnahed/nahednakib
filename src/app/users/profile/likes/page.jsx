"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Heart } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import be from "@/app/admin/blogs/BlogEditor.module.css";
import admin from "@/components/Admin/adminPage.module.css";
import styles from "../Profile.module.css";
import { isUuid } from "@/lib/utils/isUuid";

const typeLabel = (type) => {
  if (type === "blog") return "Blog Posts";
  if (type === "portfolio") return "Portfolio";
  return type.charAt(0).toUpperCase() + type.slice(1);
};

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

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        const { data: userLikes, error: likesError } = await supabase
          .from("user_likes")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (likesError) {
          console.error("Error fetching likes:", likesError);
          setError("Could not load liked posts");
          setLikes([]);
        } else {
          const fetchedLikes = userLikes || [];
          setLikes(fetchedLikes);

          const blogIds = fetchedLikes
            .filter((l) => l.content_type === "blog" && l.content_id)
            .map((l) => l.content_id);
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

          const portfolioIds = fetchedLikes
            .filter((l) => l.content_type === "portfolio" && l.content_id)
            .map((l) => l.content_id);
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

  const handleUnlike = async (likeId) => {
    try {
      const { error } = await supabase
        .from("user_likes")
        .delete()
        .eq("id", likeId);

      if (error) {
        console.error("Error unliking post:", error);
        return;
      }

      setLikes((prev) => prev.filter((l) => l.id !== likeId));
    } catch (err) {
      console.error("Error:", err);
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

  const contentTypes = [...new Set(likes.map((l) => l.content_type))];
  const filtered =
    filterType === "all"
      ? likes
      : likes.filter((l) => l.content_type === filterType);

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
          <span className={be.metaChip}>Likes</span>
        </div>
        <h1 className={admin.pageTitle}>Liked posts</h1>
        <p className={admin.lead}>
          Posts and portfolio items you&apos;ve liked. Unlike to remove from this
          list.
        </p>
      </header>

      <div className={be.formFlow}>
        <section className={be.section} aria-labelledby="user-likes-section">
          <div className={be.sectionHead}>
            <div className={be.sectionIcon} aria-hidden>
              <Heart size={20} strokeWidth={1.75} />
            </div>
            <div className={be.sectionHeadText}>
              <p className={be.sectionKicker}>Engagement</p>
              <h2 id="user-likes-section" className={be.sectionTitle}>
                Your likes
              </h2>
              <p className={be.sectionLead}>
                Open a post or remove a like from here.
              </p>
            </div>
          </div>

          {likes.length === 0 ? (
            <div className={styles.emptyState}>
              <p>You haven&apos;t liked any posts yet.</p>
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
                  <p>No {typeLabel(filterType).toLowerCase()} in your likes.</p>
                </div>
              ) : (
                <div className={styles.contentList}>
                  {filtered.map((like) => {
                    const isBlog = like.content_type === "blog";
                    const href = isBlog
                      ? `/blog/${blogIdToSlug[like.content_id] || ""}`
                      : `/portfolio/${portfolioIdToSlug[like.content_id] || like.content_id}`;
                    const isDisabled = isBlog && !blogIdToSlug[like.content_id];
                    const title = isBlog
                      ? blogIdToTitle[like.content_id]
                      : portfolioIdToTitle[like.content_id];

                    return (
                      <div key={like.id} className={styles.likeItem}>
                        <div className={styles.likeHeader}>
                          <div className={styles.postInfo}>
                            <h3>{title || (isBlog ? "Blog Post" : "Portfolio Item")}</h3>
                            <span className={styles.likeDate}>
                              Liked on{" "}
                              {new Date(like.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <button
                            onClick={() => handleUnlike(like.id)}
                            className={styles.unlikeButton}
                          >
                            Unlike
                          </button>
                        </div>
                        <div className={styles.likeFooter}>
                          <span className={styles.postType}>
                            {typeLabel(like.content_type)}
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
    </div>
  );
}
