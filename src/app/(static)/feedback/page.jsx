"use client";

import React, { useState } from "react";
import {
  Star,
  Send,
  MessageSquare,
  ThumbsUp,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import ConfirmationModal from "@/components/ConfirmationModal/ConfirmationModal";
import styles from "./feedback.module.css";

export default function FeedbackPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    feedback: "",
    rating: 0,
    category: "general",
  });
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showConfirmation, setShowConfirmation] = useState(false);

  const feedbackCategories = [
    { value: "general", label: "General Feedback", icon: MessageSquare },
    { value: "bug", label: "Bug Report", icon: AlertCircle },
    { value: "feature", label: "Feature Request", icon: ThumbsUp },
    { value: "performance", label: "Performance", icon: Star },
    { value: "ui", label: "User Interface", icon: MessageSquare },
  ];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (message.text) setMessage({ text: "", type: "" });
  };

  const handleRatingClick = (rating) => {
    setForm({ ...form, rating });
  };

  const handleRatingHover = (rating) => {
    setHoveredRating(rating);
  };

  const handleRatingLeave = () => {
    setHoveredRating(0);
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      setMessage({ text: "Please enter your name", type: "error" });
      return false;
    }
    if (!form.email.trim()) {
      setMessage({ text: "Please enter your email", type: "error" });
      return false;
    }
    if (!form.feedback.trim()) {
      setMessage({ text: "Please enter your feedback", type: "error" });
      return false;
    }
    if (form.feedback.trim().length < 10) {
      setMessage({
        text: "Please provide at least 10 characters of feedback",
        type: "error",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          text: data.message || "Thank you for your valuable feedback! 🙏",
          type: "success",
        });
        setForm({
          name: "",
          email: "",
          feedback: "",
          rating: 0,
          category: "general",
        });
        setHoveredRating(0);
      } else {
        setMessage({
          text: data.error || "Failed to send feedback",
          type: "error",
        });
      }
    } catch (error) {
      setMessage({
        text: "Network error. Please check your connection and try again.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setShowConfirmation(true);
  };

  const confirmSubmit = () => {
    setShowConfirmation(false);
    handleSubmit({ preventDefault: () => {} });
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => {
      const isActive = star <= (hoveredRating || form.rating);
      return (
        <button
          key={star}
          type="button"
          className={`${styles.star} ${
            isActive ? styles.starActive : styles.starInactive
          }`}
          onClick={() => handleRatingClick(star)}
          onMouseEnter={() => handleRatingHover(star)}
          onMouseLeave={handleRatingLeave}
        >
          <Star size={24} fill={isActive ? "currentColor" : "none"} />
        </button>
      );
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.feedbackCard}>
        <div className={styles.header}>
          <h1 className={styles.title}>Share Your Feedback</h1>
          <p className={styles.description}>
            Your opinion matters! Help us improve by sharing your thoughts,
            suggestions, or reporting any issues you've encountered.
          </p>
        </div>

        <form onSubmit={handleFormSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Your Name *</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address *</label>
            <input
              type="email"
              name="email"
              placeholder="your.email@example.com"
              value={form.email}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Feedback Category</label>
            <div className={styles.categoryGrid}>
              {feedbackCategories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <button
                    key={category.value}
                    type="button"
                    className={`${styles.categoryButton} ${
                      form.category === category.value
                        ? styles.categoryActive
                        : ""
                    }`}
                    onClick={() =>
                      setForm({ ...form, category: category.value })
                    }
                  >
                    <IconComponent size={16} />
                    <span>{category.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              How would you rate your experience? (Optional)
            </label>
            <div className={styles.ratingContainer}>
              {renderStars()}
              <span className={styles.ratingText}>
                {form.rating > 0 && (
                  <>
                    {form.rating === 1 && "Poor"}
                    {form.rating === 2 && "Fair"}
                    {form.rating === 3 && "Good"}
                    {form.rating === 4 && "Very Good"}
                    {form.rating === 5 && "Excellent"}
                  </>
                )}
              </span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Your Feedback *</label>
            <textarea
              name="feedback"
              placeholder="Please share your detailed feedback, suggestions, or describe any issues you've encountered..."
              value={form.feedback}
              onChange={handleChange}
              className={styles.textarea}
              rows={6}
              required
            />
            <div className={styles.characterCount}>
              {form.feedback.length}/500 characters
            </div>
          </div>

          {message.text && (
            <div className={`${styles.message} ${styles[message.type]}`}>
              {message.type === "success" ? (
                <CheckCircle size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={styles.submitButton}
          >
            {isSubmitting ? (
              <>
                <div className={styles.spinner}></div>
                Sending Feedback...
              </>
            ) : (
              <>
                <Send size={18} />
                Send Feedback
              </>
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            We read every piece of feedback and use it to make our platform
            better. Thank you for taking the time to share your thoughts with
            us!
          </p>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={confirmSubmit}
        title="Submit Feedback"
        message="Are you ready to submit your feedback? This will help us improve our platform."
        confirmText="Submit"
        cancelText="Review"
        type="info"
      />
    </div>
  );
}
