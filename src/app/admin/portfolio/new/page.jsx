"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabaseClient";
import ConfirmationModal from "@/components/ConfirmationModal/ConfirmationModal";
import styles from "./NewPortfolio.module.css";

const CATEGORY_OPTIONS = [
  "Web Development",
  "Mobile App",
  "UI/UX",
  "Backend",
  "Full Stack",
  "Marketing",
  "Data Science",
  "Other",
];

export default function NewPortfolioPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    imageFile: null,
    category: "",
    description: "",
    overview: "",
    achievements: "",
    key_features: "",
    live_url: "",
    repo_url: "",
    status: "Completed",
    technologies: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleFileChange(e) {
    setFormData({ ...formData, imageFile: e.target.files[0] || null });
  }

  function handleDeleteImage() {
    setShowDeleteConfirm(true);
  }

  function confirmDeleteImage() {
    setFormData({ ...formData, imageFile: null });
    setShowDeleteConfirm(false);
  }

  function handleCategoryChange(e) {
    const value = e.target.value;
    let selected = formData.category
      ? formData.category.split(",").map((c) => c.trim())
      : [];
    if (e.target.checked) {
      if (!selected.includes(value)) selected.push(value);
    } else {
      selected = selected.filter((c) => c !== value);
    }
    setFormData({ ...formData, category: selected.join(", ") });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    let imageUrl = "";

    if (formData.imageFile) {
      try {
        const fileExt = formData.imageFile.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadError } = await supabase.storage
          .from("portfolio-images")
          .upload(filePath, formData.imageFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: formData.imageFile.type,
          });

        if (uploadError) {
          setErrorMsg("Image upload failed: " + uploadError.message);
          setLoading(false);
          return;
        }

        const { data: publicData, error: urlError } = supabase.storage
          .from("portfolio-images")
          .getPublicUrl(filePath);

        if (urlError) {
          setErrorMsg("Failed to get image URL: " + urlError.message);
          setLoading(false);
          return;
        }

        imageUrl = publicData.publicUrl;
      } catch (uploadError) {
        setErrorMsg("Image upload failed: " + uploadError.message);
        setLoading(false);
        return;
      }
    }

    const createdDate = new Date().toLocaleString();

    const { error } = await supabase.from("portfolios").insert([
      {
        title: formData.title,
        image: imageUrl,
        date: createdDate,
        category: formData.category,
        description: formData.description,
        overview: formData.overview,
        achievements: formData.achievements,
        key_features: formData.key_features,
        live_url: formData.live_url,
        repo_url: formData.repo_url,
        status: formData.status,
        technologies: formData.technologies,
      },
    ]);

    if (error) {
      setErrorMsg(error.message);
    } else {
      if (typeof window !== "undefined" && window.showToast) {
        window.showToast("Portfolio created successfully!", "success");
      }
      // Send notification to all users about new portfolio item
      try {
        await fetch("/api/admin/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: "New Portfolio Project! 🚀",
            message: `Check out our latest project: \"${formData.title}\"`,
            type: "portfolio",
            isGlobal: true,
          }),
        });
      } catch (error) {
        console.error("Error sending portfolio notification:", error);
      }
      router.push("/admin/portfolio");
    }
    setLoading(false);
  }

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Create New Portfolio</h1>

      {errorMsg && <p className={styles.errorMsg}>{errorMsg}</p>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Title:</label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Image Upload:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className={styles.input}
          />
          {formData.imageFile && (
            <div className={styles.imagePreview}>
              <p>Selected: {formData.imageFile.name}</p>
              <button
                type="button"
                onClick={handleDeleteImage}
                className={styles.deleteBtn}
              >
                Remove Image
              </button>
            </div>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Categories:</label>
          <div className={styles.checkboxGroup}>
            {CATEGORY_OPTIONS.map((cat) => (
              <label key={cat} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  value={cat}
                  checked={
                    formData.category
                      ? formData.category
                          .split(",")
                          .map((c) => c.trim())
                          .includes(cat)
                      : false
                  }
                  onChange={handleCategoryChange}
                />
                {cat}
              </label>
            ))}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Description:</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={styles.textarea}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Project Overview (HTML):</label>
          <textarea
            name="overview"
            value={formData.overview}
            onChange={handleChange}
            className={styles.textarea}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Achievements (HTML):</label>
          <textarea
            name="achievements"
            value={formData.achievements}
            onChange={handleChange}
            className={styles.textarea}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Key Features (HTML):</label>
          <textarea
            name="key_features"
            value={formData.key_features}
            onChange={handleChange}
            className={styles.textarea}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Live Website URL:</label>
          <input
            name="live_url"
            value={formData.live_url}
            onChange={handleChange}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Repo URL (optional):</label>
          <input
            name="repo_url"
            value={formData.repo_url}
            onChange={handleChange}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Status:</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={styles.input}
          >
            <option value="Completed">Completed</option>
            <option value="In Progress">In Progress</option>
            <option value="Paused">Paused</option>
            <option value="Planned">Planned</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            Technologies (comma-separated):
          </label>
          <input
            name="technologies"
            value={formData.technologies}
            onChange={handleChange}
            className={styles.input}
            placeholder="e.g. React, Next.js, Supabase"
          />
        </div>

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? "Saving..." : "Create"}
        </button>
      </form>

      {/* Delete Image Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteImage}
        title="Remove Image"
        message="Are you sure you want to remove this image? This action cannot be undone."
        confirmText="Remove"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
}
