"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export function useEngagement(contentType, contentId) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [engagement, setEngagement] = useState({
    likes: { count: 0, userLiked: false, loading: false },
    favorites: { count: 0, userFavorited: false, loading: false },
    comments: { items: [], count: 0, loading: false, hasMore: false, page: 1 },
  });

  const supabase = createClient();

  // Initialize user session
  useEffect(() => {
    async function initializeUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    }

    initializeUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Fetch engagement data
  const fetchEngagementData = useCallback(async () => {
    if (!contentType || !contentId) return;

    try {
      // Fetch likes
      const likesResponse = await fetch(
        `/api/engagement/likes?contentType=${contentType}&contentId=${contentId}${
          user ? `&userId=${user.id}` : ""
        }`
      );

      if (!likesResponse.ok) {
        console.error("Failed to fetch likes:", likesResponse.status);
        return;
      }

      const likesData = await likesResponse.json();

      // Fetch favorites
      const favoritesResponse = await fetch(
        `/api/engagement/favorites?contentType=${contentType}&contentId=${contentId}${
          user ? `&userId=${user.id}` : ""
        }`
      );

      if (!favoritesResponse.ok) {
        console.error("Failed to fetch favorites:", favoritesResponse.status);
        return;
      }

      const favoritesData = await favoritesResponse.json();

      // Fetch comments
      const commentsResponse = await fetch(
        `/api/engagement/comments?contentType=${contentType}&contentId=${contentId}&page=1&limit=10`
      );

      if (!commentsResponse.ok) {
        console.error("Failed to fetch comments:", commentsResponse.status);
        return;
      }

      const commentsData = await commentsResponse.json();

      setEngagement((prev) => ({
        ...prev,
        likes: {
          count: likesData.likesCount || 0,
          userLiked: likesData.userLiked || false,
          loading: false,
        },
        favorites: {
          count: favoritesData.favoritesCount || 0,
          userFavorited: favoritesData.userFavorited || false,
          loading: false,
        },
        comments: {
          items: commentsData.comments || [],
          count: commentsData.totalCount || 0,
          loading: false,
          hasMore: commentsData.hasMore || false,
          page: 1,
        },
      }));
    } catch (error) {
      console.error("Error fetching engagement data:", error);
    }
  }, [contentType, contentId, user]);

  useEffect(() => {
    if (!loading) {
      fetchEngagementData();
    }
  }, [loading, fetchEngagementData]);

  // Like/Unlike function
  const toggleLike = async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    setEngagement((prev) => ({
      ...prev,
      likes: { ...prev.likes, loading: true },
    }));

    try {
      const response = await fetch("/api/engagement/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType, contentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setEngagement((prev) => ({
        ...prev,
        likes: {
          count: prev.likes.count + (data.liked ? 1 : -1),
          userLiked: data.liked,
          loading: false,
        },
      }));
    } catch (error) {
      console.error("Error toggling like:", error);
      setEngagement((prev) => ({
        ...prev,
        likes: { ...prev.likes, loading: false },
      }));
    }
  };

  // Favorite/Unfavorite function
  const toggleFavorite = async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    setEngagement((prev) => ({
      ...prev,
      favorites: { ...prev.favorites, loading: true },
    }));

    try {
      const response = await fetch("/api/engagement/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType, contentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setEngagement((prev) => ({
        ...prev,
        favorites: {
          count: prev.favorites.count + (data.favorited ? 1 : -1),
          userFavorited: data.favorited,
          loading: false,
        },
      }));
    } catch (error) {
      console.error("Error toggling favorite:", error);
      setEngagement((prev) => ({
        ...prev,
        favorites: { ...prev.favorites, loading: false },
      }));
    }
  };

  // Add comment function
  const addComment = async (commentText, parentId = null) => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    if (!commentText?.trim()) return;

    try {
      const response = await fetch("/api/engagement/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType,
          contentId,
          comment: commentText.trim(),
          parentId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      // Refresh comments
      await fetchEngagementData();
      return data.comment;
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  };

  // Load more comments
  const loadMoreComments = async () => {
    if (!engagement.comments.hasMore || engagement.comments.loading) return;

    setEngagement((prev) => ({
      ...prev,
      comments: { ...prev.comments, loading: true },
    }));

    try {
      const nextPage = engagement.comments.page + 1;
      const response = await fetch(
        `/api/engagement/comments?contentType=${contentType}&contentId=${contentId}&page=${nextPage}&limit=10`
      );
      const data = await response.json();

      setEngagement((prev) => ({
        ...prev,
        comments: {
          items: [...prev.comments.items, ...(data.comments || [])],
          count: data.totalCount || prev.comments.count,
          loading: false,
          hasMore: data.hasMore || false,
          page: nextPage,
        },
      }));
    } catch (error) {
      console.error("Error loading more comments:", error);
      setEngagement((prev) => ({
        ...prev,
        comments: { ...prev.comments, loading: false },
      }));
    }
  };

  return {
    user,
    loading,
    engagement,
    actions: {
      toggleLike,
      toggleFavorite,
      addComment,
      loadMoreComments,
      refreshData: fetchEngagementData,
    },
  };
}
