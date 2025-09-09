"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/services/supabaseClient";
import ConfirmationModal from "@/components/ConfirmationModal/ConfirmationModal";
import styles from "./EditPortfolio.module.css";

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

export default function EditPortfolioPage() {
  const router = useRouter();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    title: "",
    image: "",
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    async function fetchPortfolio() {
      setErrorMsg(null);
      const { data, error } = await supabase
        .from("portfolios")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        setErrorMsg(error.message);
      } else {
        setFormData({
          title: data.title || "",
          image: data.image || "",
          category: data.category || "",
          description: data.description || "",
          overview: data.overview || "",
          achievements: data.achievements || "",
          key_features: data.key_features || "",
          live_url: data.live_url || "",
          repo_url: data.repo_url || "",
          status: data.status || "Completed",
          technologies: data.technologies || "",
        });
      }
      setLoading(false);
    }
    fetchPortfolio();
  }, [id]);

  function handleChange(e) {
    setErrorMsg(null);
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg(null);

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from("portfolio-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type, // important for fixing 400 error
      });

    if (uploadError) {
      setErrorMsg(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("portfolio-images")
      .getPublicUrl(filePath);

    setFormData((prev) => ({ ...prev, image: data.publicUrl }));
    setUploading(false);
  }

  function handleDeleteImage() {
    setShowDeleteConfirm(true);
  }

  async function confirmDeleteImage() {
    if (!formData.image) return;

    setUploading(true);
    setErrorMsg(null);

    try {
      // Check if the image is from Supabase storage
      const isSupabaseImage =
        formData.image.includes("supabase.co") &&
        formData.image.includes("portfolio-images");

      if (isSupabaseImage) {
        // Extract filename from URL
        const urlParts = formData.image.split("/");
        const fileName = urlParts[urlParts.length - 1];

        // Delete from storage
        const { error: deleteError } = await supabase.storage
          .from("portfolio-images")
          .remove([fileName]);

        if (deleteError) {
          console.log(
            "Storage deletion failed, but continuing with form update:",
            deleteError.message
          );
        }
      }

      // Clear image from form (regardless of storage deletion result)
      setFormData((prev) => ({ ...prev, image: "" }));
    } catch (error) {
      setErrorMsg("Error deleting image: " + error.message);
    }

    setUploading(false);
    setShowDeleteConfirm(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    const { error } = await supabase
      .from("portfolios")
      .update({
        title: formData.title,
        image: formData.image,
        category: formData.category,
        description: formData.description,
        overview: formData.overview,
        achievements: formData.achievements,
        key_features: formData.key_features,
        live_url: formData.live_url,
        repo_url: formData.repo_url,
        status: formData.status,
        technologies: formData.technologies,
      })
      .eq("id", id);

    if (error) {
      setErrorMsg(error.message);
    } else {
      if (typeof window !== "undefined" && window.showToast) {
        window.showToast("Portfolio updated successfully!", "success");
      }
      router.push("/admin/portfolio");
    }
    setSaving(false);
  }

  if (loading) return <p>Loading portfolio data...</p>;

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Edit Portfolio</h1>

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
          <label className={styles.label}>Current Image:</label>
          {formData.image ? (
            <div style={{ marginBottom: "10px" }}>
              <img
                src={formData.image}
                alt="Portfolio image"
                style={{
                  maxWidth: "200px",
                  display: "block",
                  marginBottom: "10px",
                }}
              />
              <button
                type="button"
                onClick={handleDeleteImage}
                disabled={uploading}
                className={styles.deleteBtn}
              >
                {uploading ? "Deleting..." : "Delete Image"}
              </button>
            </div>
          ) : (
            <p>No image uploaded yet</p>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Upload New Image:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className={styles.input}
            disabled={uploading}
          />
          {uploading && <p>Uploading image...</p>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Categories:</label>
          <div className={styles.checkboxGroup}>
            {CATEGORY_OPTIONS.map((cat) => (
              <label key={cat} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  value={cat}
                  checked={formData.category
                    .split(",")
                    .map((c) => c.trim())
                    .includes(cat)}
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

        <button
          type="submit"
          disabled={saving || uploading}
          className={styles.submitBtn}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>

      {/* Delete Image Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteImage}
        title="Delete Image"
        message="Are you sure you want to delete this image? This action cannot be undone and the image will be permanently removed from storage."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
