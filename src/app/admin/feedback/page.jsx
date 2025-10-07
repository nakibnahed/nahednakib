"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/services/supabaseClient";
import styles from "./Feedback.module.css";
import ConfirmationModal from "@/components/ConfirmationModal/ConfirmationModal";
import {
  MessageSquare,
  Star,
  Calendar,
  User,
  Mail,
  Filter,
  Search,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle,
  Bug,
  Zap,
  Monitor,
  HelpCircle,
} from "lucide-react";

const categoryIcons = {
  general: MessageSquare,
  bug: Bug,
  feature: Zap,
  performance: Monitor,
  ui: HelpCircle,
};

const categoryColors = {
  general: "#6b7280",
  bug: "#ef4444",
  feature: "#3b82f6",
  performance: "#10b981",
  ui: "#f59e0b",
};

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRating, setSelectedRating] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState(null);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("feedback_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFeedback(data || []);
    } catch (err) {
      console.error("Error fetching feedback:", err);
      setError("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setFeedbackToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteFeedback = async () => {
    if (!feedbackToDelete) return;

    try {
      const { error } = await supabase
        .from("feedback_messages")
        .delete()
        .eq("id", feedbackToDelete);

      if (error) throw error;
      setFeedback(feedback.filter((item) => item.id !== feedbackToDelete));
      setShowDeleteModal(false);
      setFeedbackToDelete(null);
    } catch (err) {
      console.error("Error deleting feedback:", err);
      alert("Failed to delete feedback");
    }
  };

  const viewFeedback = (item) => {
    setSelectedFeedback(item);
    setShowModal(true);
  };

  const filteredFeedback = feedback.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.feedback.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;

    const matchesRating =
      selectedRating === "all" ||
      (selectedRating === "no-rating" && !item.rating) ||
      item.rating?.toString() === selectedRating;

    return matchesSearch && matchesCategory && matchesRating;
  });

  const sortedFeedback = [...filteredFeedback].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.created_at) - new Date(a.created_at);
      case "oldest":
        return new Date(a.created_at) - new Date(b.created_at);
      case "rating-high":
        return (b.rating || 0) - (a.rating || 0);
      case "rating-low":
        return (a.rating || 0) - (b.rating || 0);
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const renderStars = (rating) => {
    if (!rating) return <span className={styles.noRating}>No rating</span>;
    return (
      <div className={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={`${styles.star} ${
              star <= rating ? styles.starFilled : styles.starEmpty
            }`}
          />
        ))}
      </div>
    );
  };

  const getCategoryIcon = (category) => {
    const IconComponent = categoryIcons[category] || MessageSquare;
    return <IconComponent size={16} />;
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading feedback...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <AlertCircle size={24} />
        <p>{error}</p>
        <button onClick={fetchFeedback} className={styles.retryButton}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Feedback Management</h1>
        <p className={styles.subtitle}>
          Manage and review user feedback submissions
        </p>
      </div>

      {/* Filters and Search */}
      <div className={styles.filters}>
        <div className={styles.searchContainer}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search feedback..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Categories</option>
            <option value="general">General</option>
            <option value="bug">Bug Report</option>
            <option value="feature">Feature Request</option>
            <option value="performance">Performance</option>
            <option value="ui">User Interface</option>
          </select>

          <select
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
            <option value="no-rating">No Rating</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="rating-high">Highest Rating</option>
            <option value="rating-low">Lowest Rating</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <MessageSquare size={24} />
          <div>
            <h3>{feedback.length}</h3>
            <p>Total Feedback</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <Star size={24} />
          <div>
            <h3>
              {feedback.length > 0
                ? (
                    feedback.reduce(
                      (sum, item) => sum + (item.rating || 0),
                      0
                    ) / feedback.filter((item) => item.rating).length
                  ).toFixed(1)
                : "0.0"}
            </h3>
            <p>Average Rating</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <CheckCircle size={24} />
          <div>
            <h3>
              {
                feedback.filter((item) => item.rating && item.rating >= 4)
                  .length
              }
            </h3>
            <p>Positive Feedback</p>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className={styles.feedbackList}>
        {sortedFeedback.length === 0 ? (
          <div className={styles.empty}>
            <MessageSquare size={48} />
            <h3>No feedback found</h3>
            <p>
              {searchTerm ||
              selectedCategory !== "all" ||
              selectedRating !== "all"
                ? "Try adjusting your filters"
                : "No feedback has been submitted yet"}
            </p>
          </div>
        ) : (
          sortedFeedback.map((item) => (
            <div key={item.id} className={styles.feedbackCard}>
              <div className={styles.feedbackHeader}>
                <div className={styles.userInfo}>
                  <User size={20} />
                  <div>
                    <h4>{item.name}</h4>
                    <p>{item.email}</p>
                  </div>
                </div>
                <div className={styles.feedbackMeta}>
                  <div
                    className={styles.categoryTag}
                    style={{ backgroundColor: categoryColors[item.category] }}
                  >
                    {getCategoryIcon(item.category)}
                    <span>{item.category}</span>
                  </div>
                  {renderStars(item.rating)}
                </div>
              </div>

              <div className={styles.feedbackContent}>
                <p>{item.feedback}</p>
              </div>

              <div className={styles.feedbackFooter}>
                <div className={styles.date}>
                  <Calendar size={16} />
                  <span>
                    {new Date(item.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className={styles.actions}>
                  <button
                    onClick={() => viewFeedback(item)}
                    className={styles.viewButton}
                    title="View Details"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(item.id)}
                    className={styles.deleteButton}
                    title="Delete Feedback"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && selectedFeedback && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowModal(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>Feedback Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalSection}>
                <h3>User Information</h3>
                <div className={styles.modalInfo}>
                  <div>
                    <strong>Name:</strong> {selectedFeedback.name}
                  </div>
                  <div>
                    <strong>Email:</strong> {selectedFeedback.email}
                  </div>
                  <div>
                    <strong>Category:</strong>{" "}
                    <span
                      className={styles.categoryTag}
                      style={{
                        backgroundColor:
                          categoryColors[selectedFeedback.category],
                      }}
                    >
                      {getCategoryIcon(selectedFeedback.category)}
                      {selectedFeedback.category}
                    </span>
                  </div>
                  <div>
                    <strong>Rating:</strong>{" "}
                    {renderStars(selectedFeedback.rating)}
                  </div>
                  <div>
                    <strong>Date:</strong>{" "}
                    {new Date(selectedFeedback.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className={styles.modalSection}>
                <h3>Feedback</h3>
                <div className={styles.feedbackText}>
                  {selectedFeedback.feedback}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setFeedbackToDelete(null);
        }}
        onConfirm={confirmDeleteFeedback}
        title="Delete Feedback"
        message="Are you sure you want to delete this feedback? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
