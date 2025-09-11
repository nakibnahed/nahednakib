"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabaseClient";
import UserLayout from "@/components/User/Layout/UserLayout";
import ConfirmationModal from "@/components/ConfirmationModal/ConfirmationModal";
import styles from "../Profile.module.css";

export default function FavoritesPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [blogIdToSlug, setBlogIdToSlug] = useState({});
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
        alert("Failed to remove favorite");
      } else {
        setFavorites((prev) =>
          prev.filter((fav) => fav.id !== favoriteToDelete)
        );
      }
    } catch (err) {
      console.error("Error removing favorite:", err);
      alert("An error occurred while removing the favorite");
    } finally {
      setShowDeleteConfirm(false);
      setFavoriteToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.profileContent}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.profileContent}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <UserLayout user={user} profileData={profileData}>
      <div className={styles.profileContent}>
        <div className={styles.contentHeader}>
          <h1>Favorites</h1>
          <p>Your favorite posts</p>
        </div>

        {favorites.length === 0 ? (
          <div className={styles.emptyState}>
            <p>You don't have any favorites yet.</p>
          </div>
        ) : (
          <div className={styles.contentList}>
            {favorites.map((favorite) => {
              const isBlog = favorite.content_type === "blog";
              const href = isBlog
                ? `/blog/${blogIdToSlug[favorite.content_id] || ""}`
                : `/portfolio/${favorite.content_id}`;
              const isDisabled = isBlog && !blogIdToSlug[favorite.content_id];

              return (
                <div key={favorite.id} className={styles.favoriteItem}>
                  <div className={styles.favoriteHeader}>
                    <div className={styles.postInfo}>
                      <h3>
                        Favorite {isBlog ? "Blog Post" : "Portfolio Item"}
                      </h3>
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
                  <div className={styles.favoriteContent}>
                    <p>
                      You added this {isBlog ? "blog post" : "portfolio item"}{" "}
                      to your favorites.
                    </p>
                  </div>
                  <div className={styles.favoriteFooter}>
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

        {/* Delete Confirmation Modal */}
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
    </UserLayout>
  );
}
