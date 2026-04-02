"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import admin from "@/components/Admin/adminPage.module.css";
import { supabase } from "@/services/supabaseClient";
import ConfirmationModal from "@/components/ConfirmationModal/ConfirmationModal";
import { showAppToast } from "@/lib/showAppToast";
import { seoKeywordsFromInput, seoKeywordsToInput } from "@/lib/seo/auto";

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
    focus_keyword: "",
    seo_keywords: "",
    meta_title: "",
    meta_description: "",
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
        showAppToast(error.message || "Could not load portfolio item.", "error");
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
          focus_keyword: data.focus_keyword || "",
          seo_keywords: seoKeywordsToInput(data.seo_keywords),
          meta_title: data.meta_title || "",
          meta_description: data.meta_description || "",
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
      showAppToast(uploadError.message || "Image upload failed.", "error");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("portfolio-images")
      .getPublicUrl(filePath);

    setFormData((prev) => ({ ...prev, image: data.publicUrl }));
    showAppToast("Image uploaded.", "success");
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

      setFormData((prev) => ({ ...prev, image: "" }));
      showAppToast("Cover image removed.", "success");
    } catch (error) {
      const msg = "Error deleting image: " + error.message;
      setErrorMsg(msg);
      showAppToast(msg, "error");
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
        focus_keyword: formData.focus_keyword.trim() || null,
        seo_keywords: seoKeywordsFromInput(formData.seo_keywords),
        meta_title: formData.meta_title.trim() || null,
        meta_description: formData.meta_description.trim() || null,
      })
      .eq("id", id);

    if (error) {
      setErrorMsg(error.message);
      showAppToast(error.message || "Could not update portfolio item.", "error");
    } else {
      showAppToast("Portfolio updated successfully.", "success");
      router.push("/admin/portfolio");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className={admin.page}>
        <div className={admin.loadingPanel}>
          <div className={admin.loadingSpinner} aria-hidden />
          <span>Loading portfolio…</span>
        </div>
      </div>
    );
  }

  return (
    <div className={admin.page}>
      <div className={admin.entityForm}>
        <header className={admin.pageHeader}>
          <p className={admin.eyebrow}>Showcase</p>
          <h1 className={admin.pageTitle}>Edit portfolio project</h1>
          <p className={admin.lead}>
            Update copy, media, links, status, and SEO for this project.
          </p>
        </header>

        <section className={admin.filtersSection} aria-label="Back">
          <Link href="/admin/portfolio" className={admin.backNav}>
            <ArrowLeft size={18} strokeWidth={2} aria-hidden />
            Back to portfolio
          </Link>
        </section>

        {errorMsg && (
          <div className={admin.formErrorBanner} role="alert">
            {errorMsg}
          </div>
        )}

        <div className={admin.formCard}>
          <form onSubmit={handleSubmit} className={admin.formStack}>
        <div className={admin.formField}>
          <label className={admin.fieldLabel}>Title:</label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className={admin.fieldInput}
          />
        </div>

        <div className={admin.formField}>
          <span className={admin.fieldLabel}>Cover image</span>
          {formData.image ? (
            <div className={admin.imageThumbWrap}>
              <Image
                src={formData.image}
                alt="Portfolio image"
                width={200}
                height={200}
              />
              <button
                type="button"
                onClick={handleDeleteImage}
                disabled={uploading}
                className={admin.btnDanger}
              >
                {uploading ? "Deleting…" : "Delete image"}
              </button>
            </div>
          ) : (
            <p className={admin.fieldHelp}>No image uploaded yet.</p>
          )}
        </div>

        <div className={admin.formField}>
          <label className={admin.fieldLabel} htmlFor="edit-portfolio-upload">
            Upload new image
          </label>
          <input
            id="edit-portfolio-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className={admin.fieldInput}
            disabled={uploading}
          />
          {uploading && (
            <p className={admin.fieldHelp}>Uploading image…</p>
          )}
        </div>

        <div className={admin.formField}>
          <label className={admin.fieldLabel}>Categories:</label>
          <div className={admin.checkboxGrid}>
            {CATEGORY_OPTIONS.map((cat) => (
              <label key={cat} className={admin.checkboxLabel}>
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

        <div className={admin.formField}>
          <label className={admin.fieldLabel}>Description:</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={admin.fieldTextarea}
          />
        </div>

        <div className={admin.formField}>
          <label className={admin.fieldLabel}>Project Overview (HTML):</label>
          <textarea
            name="overview"
            value={formData.overview}
            onChange={handleChange}
            className={admin.fieldTextarea}
          />
        </div>

        <div className={admin.formField}>
          <label className={admin.fieldLabel}>Achievements (HTML):</label>
          <textarea
            name="achievements"
            value={formData.achievements}
            onChange={handleChange}
            className={admin.fieldTextarea}
          />
        </div>

        <div className={admin.formField}>
          <label className={admin.fieldLabel}>Key Features (HTML):</label>
          <textarea
            name="key_features"
            value={formData.key_features}
            onChange={handleChange}
            className={admin.fieldTextarea}
          />
        </div>

        <div className={admin.formField}>
          <label className={admin.fieldLabel}>Live Website URL:</label>
          <input
            name="live_url"
            value={formData.live_url}
            onChange={handleChange}
            className={admin.fieldInput}
          />
        </div>

        <div className={admin.formField}>
          <label className={admin.fieldLabel}>Repo URL (optional):</label>
          <input
            name="repo_url"
            value={formData.repo_url}
            onChange={handleChange}
            className={admin.fieldInput}
          />
        </div>

        <div className={admin.formField}>
          <label className={admin.fieldLabel}>Status:</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={`${admin.fieldInput} ${admin.fieldSelect}`}
          >
            <option value="Completed">Completed</option>
            <option value="In Progress">In Progress</option>
            <option value="Paused">Paused</option>
            <option value="Planned">Planned</option>
          </select>
        </div>

        <div className={admin.formField}>
          <label className={admin.fieldLabel}>
            Technologies (comma-separated):
          </label>
          <input
            name="technologies"
            value={formData.technologies}
            onChange={handleChange}
            className={admin.fieldInput}
            placeholder="e.g. React, Next.js, Supabase"
          />
        </div>

        <div className={admin.formField}>
          <h2 className={admin.formSubheading}>SEO (optional)</h2>
          <p className={admin.fieldHelp}>
            Leave blank to auto-generate titles and descriptions from project
            fields. Supporting keywords feed structured data only.
          </p>
          <label className={admin.fieldLabel}>Focus keyword</label>
          <input
            name="focus_keyword"
            value={formData.focus_keyword}
            onChange={handleChange}
            className={admin.fieldInput}
          />
          <label className={admin.fieldLabel}>Supporting keywords</label>
          <input
            name="seo_keywords"
            value={formData.seo_keywords}
            onChange={handleChange}
            className={admin.fieldInput}
            placeholder="Comma-separated"
          />
          <label className={admin.fieldLabel}>Meta title override</label>
          <input
            name="meta_title"
            value={formData.meta_title}
            onChange={handleChange}
            className={admin.fieldInput}
          />
          <label className={admin.fieldLabel}>Meta description override</label>
          <textarea
            name="meta_description"
            value={formData.meta_description}
            onChange={handleChange}
            className={admin.fieldTextarea}
            rows={3}
          />
        </div>

        <div className={admin.formActions}>
          <button
            type="submit"
            disabled={saving || uploading}
            className={admin.btnPrimary}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
        </div>

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
    </div>
  );
}
