"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseClient";
import ConfirmationModal from "@/components/ConfirmationModal/ConfirmationModal";
import styles from "../../../../app/users/profile/Profile.module.css";

export default function FavoritesContent({ user }) {
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [favoriteToDelete, setFavoriteToDelete] = useState(null);

  useEffect(() => {
    async function loadFavorites() {
      try {
        setLoading(true);

        // Fetch user's favorites
        const { data: userFavorites, error: favoritesError } = await supabase
          .from("user_favorites")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (favoritesError) {
          console.error("Error fetching favorites:", favoritesError);
          setError("Could not load favorites");
        } else {
          // Fetch post details for each favorite
          const favoritesWithPostDetails = await Promise.all(
            (userFavorites || []).map(async (favorite) => {
              try {
                if (favorite.content_type === "blog") {
                  const { data: blogPost } = await supabase
                    .from("blogs")
                    .select("title")
                    .eq("id", favorite.content_id)
                    .single();
                  return {
                    ...favorite,
                    postTitle: blogPost?.title || "Unknown Blog Post",
                  };
                } else if (favorite.content_type === "portfolio") {
                  const { data: portfolioItem } = await supabase
                    .from("portfolios")
                    .select("title")
                    .eq("id", favorite.content_id)
                    .single();
                  return {
                    ...favorite,
                    postTitle: portfolioItem?.title || "Unknown Portfolio Item",
                  };
                }
                return favorite;
              } catch (err) {
                console.error("Error fetching post details:", err);
                return {
                  ...favorite,
                  postTitle:
                    favorite.content_type === "blog"
                      ? "Unknown Blog Post"
                      : "Unknown Portfolio Item",
                };
              }
            })
          );

          setFavorites(favoritesWithPostDetails);
        }
      } catch (err) {
        console.error("Error loading favorites:", err);
        setError("An error occurred while loading your favorites");
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadFavorites();
    }
  }, [user]);

  const confirmDelete = (favoriteId) => {
    setFavoriteToDelete(favoriteId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteFavorite = async () => {
    if (!favoriteToDelete) return;

    try {
      const { error } = await supabase
        .from("user_favorites")
        .delete()
        .eq("id", favoriteToDelete);

      if (error) {
        console.error("Error deleting favorite:", error);
        alert("Failed to delete favorite");
      } else {
        setFavorites(
          favorites.filter((favorite) => favorite.id !== favoriteToDelete)
        );
      }
    } catch (err) {
      console.error("Error deleting favorite:", err);
      alert("An error occurred while deleting the favorite");
    } finally {
      setShowDeleteConfirm(false);
      setFavoriteToDelete(null);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          color: "#fff",
        }}
      >
        <p>Loading your favorites...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          color: "#ff6b6b",
        }}
      >
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.profileContent}>
      <div className={styles.contentHeader}>
        <h1>Favorites</h1>
        <p>Posts you've favorited</p>
      </div>

      {favorites.length === 0 ? (
        <div className={styles.emptyState}>
          <p>You haven't favorited any posts yet.</p>
        </div>
      ) : (
        <div className={styles.contentList}>
          {favorites.map((favorite) => (
            <div key={favorite.id} className={styles.favoriteItem}>
              <div className={styles.favoriteHeader}>
                <div className={styles.postInfo}>
                  <h3>Favorited "{favorite.postTitle}"</h3>
                  <span className={styles.favoriteDate}>
                    Favorited on{" "}
                    {new Date(favorite.created_at).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={() => confirmDelete(favorite.id)}
                  className={styles.deleteButton}
                >
                  Remove
                </button>
              </div>
              <div className={styles.favoriteContent}>
                <p>
                  You favorited this{" "}
                  {favorite.content_type === "blog"
                    ? "blog post"
                    : "portfolio item"}
                  .
                </p>
              </div>
              <div className={styles.favoriteFooter}>
                <span className={styles.postType}>
                  {favorite.content_type === "blog"
                    ? "Blog Post"
                    : "Portfolio Item"}
                </span>
                <a
                  href={
                    favorite.content_type === "blog"
                      ? `/blog/${favorite.content_id}`
                      : `/portfolio/${favorite.content_id}`
                  }
                  className={styles.viewPostLink}
                >
                  View Post
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteFavorite}
        title="Remove from Favorites"
        message="Are you sure you want to remove this item from your favorites?"
        confirmText="Remove"
        cancelText="Cancel"
      />
    </div>
  );
}
