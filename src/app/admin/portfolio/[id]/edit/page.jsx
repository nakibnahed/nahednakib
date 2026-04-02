"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  AlignLeft,
  ArrowLeft,
  FileText,
  ImageIcon,
  Layers,
  Link2,
  Search,
} from "lucide-react";
import admin from "@/components/Admin/adminPage.module.css";
import be from "../../../blogs/BlogEditor.module.css";
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
        <div className={be.pageRoot}>
          <div className={admin.loadingPanel}>
            <div className={admin.loadingSpinner} aria-hidden />
            <span>Loading portfolio…</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={admin.page}>
      <div className={be.pageRoot}>
        <header className={be.hero}>
          <div className={be.heroBack}>
            <Link href="/admin/portfolio" className={admin.backNav}>
              <ArrowLeft size={18} strokeWidth={2} aria-hidden />
              Back to portfolio
            </Link>
          </div>
          <div className={be.heroMeta}>
            <p className={admin.eyebrow}>Showcase</p>
            <span className={be.metaChip}>Editing</span>
          </div>
          <h1 className={admin.pageTitle}>Edit portfolio project</h1>
          <p className={admin.lead}>
            Update copy, media, links, status, and SEO for this project.
          </p>
        </header>

        {errorMsg && (
          <div className={admin.formErrorBanner} role="alert">
            {errorMsg}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className={`${admin.formStack} ${be.formFlow}`}
        >
          <section
            className={be.section}
            aria-labelledby="edit-portfolio-section-basics"
          >
            <div className={be.sectionHead}>
              <div className={be.sectionIcon} aria-hidden>
                <FileText size={20} strokeWidth={1.75} />
              </div>
              <div className={be.sectionHeadText}>
                <p className={be.sectionKicker}>Basics</p>
                <h2
                  id="edit-portfolio-section-basics"
                  className={be.sectionTitle}
                >
                  Title
                </h2>
                <p className={be.sectionLead}>
                  The project name shown on cards and detail pages.
                </p>
              </div>
            </div>
            <div className={admin.formField}>
              <label className={admin.fieldLabel} htmlFor="edit-portfolio-title">
                Title
              </label>
              <input
                id="edit-portfolio-title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className={admin.fieldInput}
              />
            </div>
          </section>

          <section
            className={be.section}
            aria-labelledby="edit-portfolio-section-media"
          >
            <div className={be.sectionHead}>
              <div className={be.sectionIcon} aria-hidden>
                <ImageIcon size={20} strokeWidth={1.75} />
              </div>
              <div className={be.sectionHeadText}>
                <p className={be.sectionKicker}>Media</p>
                <h2
                  id="edit-portfolio-section-media"
                  className={be.sectionTitle}
                >
                  Cover image
                </h2>
                <p className={be.sectionLead}>
                  Replace or remove the hero image for this project.
                </p>
              </div>
            </div>
            <div className={be.mediaPreview}>
              {formData.image ? (
                <div className={be.previewFrame}>
                  <Image
                    src={formData.image}
                    alt={formData.title ? `Cover: ${formData.title}` : "Portfolio cover"}
                    width={320}
                    height={320}
                    style={{ maxWidth: "100%", height: "auto" }}
                  />
                </div>
              ) : (
                <div className={be.emptyMedia}>No image uploaded yet.</div>
              )}
              <div className={admin.formField} style={{ flex: "1 1 220px" }}>
                <label
                  className={admin.fieldLabel}
                  htmlFor="edit-portfolio-upload"
                >
                  Upload or replace
                </label>
                <input
                  id="edit-portfolio-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className={`${admin.fieldInput} ${be.fileInput}`}
                  disabled={uploading}
                />
                {uploading && (
                  <p className={admin.fieldHelp}>Uploading image…</p>
                )}
                {formData.image && (
                  <button
                    type="button"
                    onClick={handleDeleteImage}
                    disabled={uploading}
                    className={admin.btnDanger}
                  >
                    {uploading ? "Deleting…" : "Remove cover image"}
                  </button>
                )}
              </div>
            </div>
          </section>

          <section
            className={be.section}
            aria-labelledby="edit-portfolio-section-taxonomy"
          >
            <div className={be.sectionHead}>
              <div className={be.sectionIcon} aria-hidden>
                <Layers size={20} strokeWidth={1.75} />
              </div>
              <div className={be.sectionHeadText}>
                <p className={be.sectionKicker}>Classification</p>
                <h2
                  id="edit-portfolio-section-taxonomy"
                  className={be.sectionTitle}
                >
                  Categories
                </h2>
                <p className={be.sectionLead}>
                  One or more labels for filtering and related projects.
                </p>
              </div>
            </div>
            <div className={admin.formField}>
              <span className={admin.fieldLabel}>Categories</span>
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
          </section>

          <section
            className={be.section}
            aria-labelledby="edit-portfolio-section-story"
          >
            <div className={be.sectionHead}>
              <div className={be.sectionIcon} aria-hidden>
                <AlignLeft size={20} strokeWidth={1.75} />
              </div>
              <div className={be.sectionHeadText}>
                <p className={be.sectionKicker}>Story</p>
                <h2
                  id="edit-portfolio-section-story"
                  className={be.sectionTitle}
                >
                  Description &amp; HTML blocks
                </h2>
                <p className={be.sectionLead}>
                  Short summary plus rich HTML sections for the project page.
                </p>
              </div>
            </div>
            <div className={admin.formField}>
              <label
                className={admin.fieldLabel}
                htmlFor="edit-portfolio-description"
              >
                Description
              </label>
              <textarea
                id="edit-portfolio-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={admin.fieldTextarea}
              />
            </div>
            <div className={admin.formField}>
              <label
                className={admin.fieldLabel}
                htmlFor="edit-portfolio-overview"
              >
                Project overview (HTML)
              </label>
              <textarea
                id="edit-portfolio-overview"
                name="overview"
                value={formData.overview}
                onChange={handleChange}
                className={`${admin.fieldTextarea} ${be.htmlTextarea}`}
              />
            </div>
            <div className={admin.formField}>
              <label
                className={admin.fieldLabel}
                htmlFor="edit-portfolio-achievements"
              >
                Achievements (HTML)
              </label>
              <textarea
                id="edit-portfolio-achievements"
                name="achievements"
                value={formData.achievements}
                onChange={handleChange}
                className={`${admin.fieldTextarea} ${be.htmlTextarea}`}
              />
            </div>
            <div className={admin.formField}>
              <label
                className={admin.fieldLabel}
                htmlFor="edit-portfolio-key-features"
              >
                Key features (HTML)
              </label>
              <textarea
                id="edit-portfolio-key-features"
                name="key_features"
                value={formData.key_features}
                onChange={handleChange}
                className={`${admin.fieldTextarea} ${be.htmlTextarea}`}
              />
            </div>
          </section>

          <section
            className={be.section}
            aria-labelledby="edit-portfolio-section-links"
          >
            <div className={be.sectionHead}>
              <div className={be.sectionIcon} aria-hidden>
                <Link2 size={20} strokeWidth={1.75} />
              </div>
              <div className={be.sectionHeadText}>
                <p className={be.sectionKicker}>Links &amp; status</p>
                <h2
                  id="edit-portfolio-section-links"
                  className={be.sectionTitle}
                >
                  URLs, status &amp; stack
                </h2>
                <p className={be.sectionLead}>
                  Live demo, repository, delivery status, and technologies.
                </p>
              </div>
            </div>
            <div className={be.grid2}>
              <div className={admin.formField}>
                <label
                  className={admin.fieldLabel}
                  htmlFor="edit-portfolio-live-url"
                >
                  Live website URL
                </label>
                <input
                  id="edit-portfolio-live-url"
                  name="live_url"
                  value={formData.live_url}
                  onChange={handleChange}
                  className={admin.fieldInput}
                />
              </div>
              <div className={admin.formField}>
                <label
                  className={admin.fieldLabel}
                  htmlFor="edit-portfolio-repo-url"
                >
                  Repo URL (optional)
                </label>
                <input
                  id="edit-portfolio-repo-url"
                  name="repo_url"
                  value={formData.repo_url}
                  onChange={handleChange}
                  className={admin.fieldInput}
                />
              </div>
              <div className={admin.formField}>
                <label
                  className={admin.fieldLabel}
                  htmlFor="edit-portfolio-status"
                >
                  Status
                </label>
                <select
                  id="edit-portfolio-status"
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
                <label
                  className={admin.fieldLabel}
                  htmlFor="edit-portfolio-technologies"
                >
                  Technologies (comma-separated)
                </label>
                <input
                  id="edit-portfolio-technologies"
                  name="technologies"
                  value={formData.technologies}
                  onChange={handleChange}
                  className={admin.fieldInput}
                  placeholder="e.g. React, Next.js, Supabase"
                />
              </div>
            </div>
          </section>

          <section
            className={be.section}
            aria-labelledby="edit-portfolio-section-seo"
          >
            <div className={be.seoSection}>
              <div className={be.sectionHead}>
                <div className={be.sectionIcon} aria-hidden>
                  <Search size={20} strokeWidth={1.75} />
                </div>
                <div className={be.sectionHeadText}>
                  <p className={be.sectionKicker}>SEO</p>
                  <h2 id="edit-portfolio-section-seo" className={be.sectionTitle}>
                    Search &amp; metadata (optional)
                  </h2>
                  <p className={be.sectionLead}>
                    Leave blank to auto-generate titles and descriptions from
                    project fields. Supporting keywords feed structured data only.
                  </p>
                </div>
              </div>
              <div className={be.seoFields}>
                <div className={admin.formField}>
                  <label
                    className={admin.fieldLabel}
                    htmlFor="edit-portfolio-focus-kw"
                  >
                    Focus keyword
                  </label>
                  <input
                    id="edit-portfolio-focus-kw"
                    name="focus_keyword"
                    value={formData.focus_keyword}
                    onChange={handleChange}
                    className={admin.fieldInput}
                  />
                </div>
                <div className={admin.formField}>
                  <label
                    className={admin.fieldLabel}
                    htmlFor="edit-portfolio-seo-kw"
                  >
                    Supporting keywords
                  </label>
                  <input
                    id="edit-portfolio-seo-kw"
                    name="seo_keywords"
                    value={formData.seo_keywords}
                    onChange={handleChange}
                    className={admin.fieldInput}
                    placeholder="Comma-separated"
                  />
                </div>
                <div className={admin.formField}>
                  <label
                    className={admin.fieldLabel}
                    htmlFor="edit-portfolio-meta-title"
                  >
                    Meta title override
                  </label>
                  <input
                    id="edit-portfolio-meta-title"
                    name="meta_title"
                    value={formData.meta_title}
                    onChange={handleChange}
                    className={admin.fieldInput}
                  />
                </div>
                <div className={admin.formField}>
                  <label
                    className={admin.fieldLabel}
                    htmlFor="edit-portfolio-meta-desc"
                  >
                    Meta description override
                  </label>
                  <textarea
                    id="edit-portfolio-meta-desc"
                    name="meta_description"
                    value={formData.meta_description}
                    onChange={handleChange}
                    className={admin.fieldTextarea}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </section>

          <div className={be.stickyActions}>
            <button
              type="submit"
              disabled={saving || uploading}
              className={admin.btnPrimary}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>

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
